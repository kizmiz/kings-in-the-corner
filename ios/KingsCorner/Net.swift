import Foundation
import Network

/// Tables on the same Wi-Fi (web/net.js). The host listens on TCP and advertises the table over
/// Bonjour as _kitc._tcp; the others browse for it and connect. Messages are JSON text, one per
/// line, handed to the page as they arrive. Android does the same (android/.../Net.kt), so iPhones
/// and Android phones sit at the same table.
///
/// The page asks with {type: "net", op: "host" | "browse" | "join" | "send" | "close", ...} and
/// hears back through `emit` (see web/net.js for the events).
final class LocalNet {
    static let service = "_kitc._tcp"
    var emit: ([String: Any]) -> Void = { _ in }

    private let queue = DispatchQueue.main
    private var listener: NWListener?
    private var hosted: String?                    // the table's name while hosting
    private var browser: NWBrowser?
    private var peers: [String: Line] = [:]        // hosting: the phones at the table
    private var host: Line?                        // joined: the phone running the table
    private var found: [String: NWEndpoint] = [:]  // browsing: tables by name

    func handle(_ body: [String: Any]) {
        switch body["op"] as? String {
        case "host": hostTable(name: body["name"] as? String ?? "Kings Corner")
        case "browse": browse()
        case "join": join(name: body["id"] as? String ?? "")
        case "send": send(to: body["peer"] as? String, text: body["text"] as? String ?? "")
        case "close": close()
        default: break
        }
    }

    /// Hosting, or making sure the table is still up: after the phone was locked, iOS may have shut
    /// the listener down; a new one advertises the table again, and the players still connected stay.
    private func hostTable(name: String) {
        if let listener, hosted == name {
            switch listener.state {
            case .setup, .waiting, .ready: return
            default: break
            }
        }
        listener?.cancel()
        listener = nil
        hosted = name
        do {
            let listener = try NWListener(using: .tcp)
            listener.service = NWListener.Service(name: name, type: Self.service)
            listener.newConnectionHandler = { [weak self] connection in
                guard let self else { return }
                let id = UUID().uuidString
                let line = Line(connection, queue: queue)
                line.onText = { [weak self] text in self?.emit(["e": "message", "peer": id, "text": text]) }
                line.onClose = { [weak self] in
                    self?.peers[id] = nil
                    self?.emit(["e": "gone", "peer": id])
                }
                peers[id] = line
                line.start()
                emit(["e": "peer", "peer": id])
            }
            listener.stateUpdateHandler = { [weak self] state in
                if case .failed(let error) = state { self?.emit(["e": "error", "text": error.localizedDescription]) }
            }
            listener.start(queue: queue)
            self.listener = listener
        } catch {
            emit(["e": "error", "text": error.localizedDescription])
        }
    }

    // Asked again while already looking, it just reports what it has found.
    private func browse() {
        if browser != nil { return report() }
        let browser = NWBrowser(for: .bonjour(type: Self.service, domain: nil), using: .tcp)
        browser.browseResultsChangedHandler = { [weak self] results, _ in
            guard let self else { return }
            found = [:]
            for result in results {
                if case .service(let name, _, _, _) = result.endpoint { found[name] = result.endpoint }
            }
            report()
        }
        browser.stateUpdateHandler = { [weak self] state in
            if case .failed(let error) = state { self?.emit(["e": "error", "text": error.localizedDescription]) }
        }
        browser.start(queue: queue)
        self.browser = browser
    }

    private func report() {
        emit(["e": "tables", "tables": found.keys.sorted().map { ["id": $0, "name": $0] }])
    }

    private func join(name: String) {
        guard let endpoint = found[name] else {
            emit(["e": "error", "text": "The table isn't there any more."])
            return
        }
        browser?.cancel()
        browser = nil
        let line = Line(NWConnection(to: endpoint, using: .tcp), queue: queue)
        line.onReady = { [weak self] in self?.emit(["e": "joined"]) }
        line.onText = { [weak self] text in self?.emit(["e": "message", "peer": "host", "text": text]) }
        line.onClose = { [weak self] in
            self?.host = nil
            self?.emit(["e": "closed"])
        }
        host = line
        line.start()
    }

    private func send(to peer: String?, text: String) {
        if let peer, peer != "host" { peers[peer]?.send(text) } else { host?.send(text) }
    }

    /// Leaving on purpose: nothing is reported back to the page.
    func close() {
        listener?.cancel()
        listener = nil
        hosted = nil
        browser?.cancel()
        browser = nil
        for line in peers.values {
            line.onClose = nil
            line.cancel()
        }
        peers = [:]
        host?.onClose = nil
        host?.cancel()
        host = nil
        found = [:]
    }
}

/// One TCP connection carrying lines of UTF-8 text.
final class Line {
    var onReady: (() -> Void)?
    var onText: ((String) -> Void)?
    var onClose: (() -> Void)?

    private let connection: NWConnection
    private let queue: DispatchQueue
    private var buffer = Data()
    private var finished = false

    init(_ connection: NWConnection, queue: DispatchQueue) {
        self.connection = connection
        self.queue = queue
    }

    func start() {
        connection.stateUpdateHandler = { [weak self] state in
            switch state {
            case .ready: self?.onReady?()
            case .failed, .cancelled: self?.finish()
            default: break
            }
        }
        connection.start(queue: queue)
        receive()
    }

    func send(_ text: String) {
        connection.send(content: Data((text + "\n").utf8), completion: .contentProcessed { _ in })
    }

    func cancel() {
        finished = true
        connection.cancel()
    }

    private func receive() {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 1 << 16) { [weak self] data, _, complete, error in
            guard let self else { return }
            if let data {
                buffer.append(data)
                while let end = buffer.firstIndex(of: 10) {
                    let text = String(decoding: buffer[buffer.startIndex..<end], as: UTF8.self)
                    buffer = Data(buffer[buffer.index(after: end)...])
                    if !text.isEmpty { onText?(text) }
                }
            }
            if complete || error != nil { finish() } else { receive() }
        }
    }

    private func finish() {
        guard !finished else { return }
        finished = true
        connection.cancel()
        onClose?()
    }
}
