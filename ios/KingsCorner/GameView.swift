import SwiftUI
import WebKit

/// The game is the web app in ../web, bundled with the app and served from kitc://game/ so its
/// modules and Nana's weights load as they do in a browser. Nothing leaves the phone.
struct GameView: UIViewRepresentable {
    func makeCoordinator() -> Bridge { Bridge() }

    func makeUIView(context: Context) -> WKWebView {
        let bridge = context.coordinator
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(BundledFiles(), forURLScheme: BundledFiles.scheme)
        config.userContentController.addUserScript(
            WKUserScript(source: bridge.startupScript(), injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.userContentController.add(bridge, name: "native")

        let web = GameWebView(frame: .zero, configuration: config)
        web.navigationDelegate = bridge
        web.allowsLinkPreview = false
        web.allowsBackForwardNavigationGestures = false
        web.isOpaque = false
        web.backgroundColor = UIColor(named: "Felt")
        web.scrollView.backgroundColor = UIColor(named: "Felt")
        web.scrollView.bounces = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        #if DEBUG
        web.isInspectable = true  // Safari > Develop, for the page's console
        #endif
        bridge.web = web
        web.load(URLRequest(url: URL(string: "\(BundledFiles.scheme)://game/index.html")!))
        return web
    }

    func updateUIView(_ web: WKWebView, context: Context) {}
}

/// Tells the page the size it has, in points, whenever that changes: iPhone Duo folding and
/// unfolding, or its inner screen turning (web/index.html lays the table out to fit).
final class GameWebView: WKWebView {
    private var told = CGSize.zero

    override func layoutSubviews() {
        super.layoutSubviews()
        tellSize()
    }

    /// `again`: once a page has loaded, since the one before it was told.
    func tellSize(again: Bool = false) {
        let size = bounds.size
        guard size.width > 0, size.height > 0, again || size != told else { return }
        told = size
        evaluateJavaScript("window.kitcFit && window.kitcFit(\(size.width), \(size.height))")
    }
}

/// Serves the files in the app bundle's `web` folder, with the content types a browser expects.
final class BundledFiles: NSObject, WKURLSchemeHandler {
    static let scheme = "kitc"
    private let root = Bundle.main.resourceURL!.appendingPathComponent("web").standardizedFileURL
    private static let types = [
        "html": "text/html", "js": "text/javascript", "css": "text/css", "json": "application/json",
        "svg": "image/svg+xml", "png": "image/png", "woff2": "font/woff2", "txt": "text/plain",
        "bin": "application/octet-stream",
    ]

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        let path = url.path.isEmpty || url.path == "/" ? "index.html" : String(url.path.dropFirst())
        let file = root.appendingPathComponent(path).standardizedFileURL
        guard file.path.hasPrefix(root.path + "/"), let data = try? Data(contentsOf: file) else {
            NSLog("kitc: no file for %@", url.absoluteString)
            task.didReceive(HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: nil)!)
            task.didFinish()
            return
        }
        let headers = [
            "Content-Type": Self.types[file.pathExtension] ?? "application/octet-stream",
            "Content-Length": String(data.count),
            "Access-Control-Allow-Origin": "*",
        ]
        task.didReceive(HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}

/// What the page asks of the phone, through window.webkit.messageHandlers.native:
///   {type: "save", key, value}   keep a setting or the records (a JSON string) natively
///   {type: "haptic", kind}       tap, place, good, bad or warn
///   {type: "log", text}          the page's errors, in debug builds
///   {type: "net", op, ...}        tables on the same Wi-Fi (Net.swift)
///   {type: "awake", on}           keep the screen from locking (while at a Wi-Fi table)
/// The page also gets the language the app runs in (English or German), in window.kitc.lang.
/// iOS may clear a web view's storage, so the page's saved keys are kept here too and handed back
/// to it on startup in window.kitc.saved.
final class Bridge: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
    weak var web: WKWebView?
    private let savedKey = "page.saved"
    private let net = LocalNet()

    override init() {
        super.init()
        net.emit = { [weak self] event in self?.toPage(event) }
    }

    /// A Wi-Fi table's news, for web/net.js.
    private func toPage(_ event: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: event),
              let json = String(data: data, encoding: .utf8) else { return }
        web?.evaluateJavaScript("window.kitcNet && window.kitcNet(\(json))")
    }

    private var saved: [String: String] {
        get { UserDefaults.standard.dictionary(forKey: savedKey) as? [String: String] ?? [:] }
        set { UserDefaults.standard.set(newValue, forKey: savedKey) }
    }

    func startupScript() -> String {
        let info = Bundle.main.infoDictionary ?? [:]
        let shell: [String: Any] = [
            "platform": "ios",
            "lang": Bundle.main.preferredLocalizations.first ?? "en",
            "saved": saved,
            "version": "\(info["CFBundleShortVersionString"] ?? "")",
        ]
        let json = (try? JSONSerialization.data(withJSONObject: shell)).flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        var script = "window.kitc = \(json);"
        #if DEBUG
        script += """
            const report = (text) => window.webkit.messageHandlers.native.postMessage({type: 'log', text: String(text)});
            window.addEventListener('error', (e) => report(`${e.message} at ${e.filename}:${e.lineno}`));
            window.addEventListener('unhandledrejection', (e) => report(`unhandled: ${e.reason}`));
            """
        // For trying the app from a script: `-kitcEval "<js>"` at launch runs once the page has loaded.
        if let js = UserDefaults.standard.string(forKey: "kitcEval") {
            script += "window.addEventListener('load', () => setTimeout(() => { \(js) }, 600));"
        }
        #endif
        return script
    }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "save":
            guard let key = body["key"] as? String, let value = body["value"] as? String else { return }
            saved[key] = value
        case "haptic":
            haptic(body["kind"] as? String ?? "tap")
        case "log":
            NSLog("page: %@", body["text"] as? String ?? "")
        case "awake":
            UIApplication.shared.isIdleTimerDisabled = body["on"] as? Bool ?? false
        case "net":
            #if DEBUG
            NSLog("net: %@ %@ %d", body["op"] as? String ?? "", body["peer"] as? String ?? "", (body["text"] as? String)?.count ?? 0)
            #endif
            net.handle(body)
        default:
            break
        }
    }

    private func haptic(_ kind: String) {
        switch kind {
        case "place": UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        case "good": UINotificationFeedbackGenerator().notificationOccurred(.success)
        case "bad": UINotificationFeedbackGenerator().notificationOccurred(.error)
        case "warn": UINotificationFeedbackGenerator().notificationOccurred(.warning)
        default: UIImpactFeedbackGenerator(style: .light).impactOccurred()
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        (webView as? GameWebView)?.tellSize(again: true)
    }

    // The game never navigates away; links to the web open in Safari.
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url, url.scheme != BundledFiles.scheme else { return decisionHandler(.allow) }
        if url.scheme == "https" { UIApplication.shared.open(url) }
        decisionHandler(.cancel)
    }

    // If iOS ends the page's process (memory pressure in the background), start it again with what
    // has been saved since launch.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        net.close()   // the page that ran the table is gone
        let scripts = webView.configuration.userContentController
        scripts.removeAllUserScripts()
        scripts.addUserScript(WKUserScript(source: startupScript(), injectionTime: .atDocumentStart, forMainFrameOnly: true))
        webView.reload()
    }
}
