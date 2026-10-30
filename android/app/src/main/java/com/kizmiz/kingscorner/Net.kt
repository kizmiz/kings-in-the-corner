package com.kizmiz.kingscorner

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.net.wifi.WifiManager
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

/**
 * Tables on the same Wi-Fi (web/net.js). The host listens on TCP and advertises the table over
 * DNS-SD as _kitc._tcp; the others discover it and connect. Messages are JSON text, one per line.
 * iOS does the same with Bonjour (ios/KingsCorner/Net.swift), so Android phones and iPhones sit at
 * the same table.
 *
 * The page asks with {type: "net", op: "host" | "browse" | "join" | "send" | "close", ...}; what
 * happens comes back through [emit] as the events web/net.js lists (from any thread).
 */
class LocalNet(context: Context, private val emit: (JSONObject) -> Unit) {
    private val nsd = context.getSystemService(Context.NSD_SERVICE) as NsdManager
    private val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
    private val io = Executors.newCachedThreadPool()
    private var multicast: WifiManager.MulticastLock? = null
    private var server: ServerSocket? = null
    private var hosted: String? = null          // the table's name while hosting
    private var registration: NsdManager.RegistrationListener? = null
    private var discovery: NsdManager.DiscoveryListener? = null
    private val peers = ConcurrentHashMap<String, Line>()   // hosting: the phones at the table
    private val found = ConcurrentHashMap<String, NsdServiceInfo>()   // browsing: tables by name
    @Volatile private var host: Line? = null              // joined: the phone running the table

    fun handle(m: JSONObject) {
        when (m.optString("op")) {
            "host" -> hostTable(m.optString("name", "Kings Corner"))
            "browse" -> browse()
            "join" -> join(m.optString("id"))
            "send" -> send(m.optString("peer"), m.optString("text"))
            "close" -> close()
        }
    }

    private fun event(e: String) = JSONObject().put("e", e)
    private fun error(text: String) = emit(event("error").put("text", text))

    /** Hosting, or making sure the table is still up; the players still connected stay. */
    private fun hostTable(name: String) {
        if (hosted == name && server?.isClosed == false && registration != null) return
        registration?.let { runCatching { nsd.unregisterService(it) } }
        registration = null
        runCatching { server?.close() }
        hosted = name
        val socket = try { ServerSocket(0) } catch (e: IOException) { return error(e.message ?: "") }
        server = socket
        val listener = object : NsdManager.RegistrationListener {
            override fun onServiceRegistered(info: NsdServiceInfo) {}
            override fun onRegistrationFailed(info: NsdServiceInfo, code: Int) = error("registration failed ($code)")
            override fun onServiceUnregistered(info: NsdServiceInfo) {}
            override fun onUnregistrationFailed(info: NsdServiceInfo, code: Int) {}
        }
        registration = listener
        val info = NsdServiceInfo().apply { serviceName = name; serviceType = TYPE; port = socket.localPort }
        nsd.registerService(info, NsdManager.PROTOCOL_DNS_SD, listener)
        io.execute {
            while (!socket.isClosed) {
                val client = try { socket.accept() } catch (e: IOException) { break }
                val id = UUID.randomUUID().toString()
                val line = Line(client)
                line.onText = { emit(event("message").put("peer", id).put("text", it)) }
                line.onClose = {
                    peers.remove(id)
                    emit(event("gone").put("peer", id))
                }
                peers[id] = line
                emit(event("peer").put("peer", id))
                line.start()
            }
        }
    }

    // Asked again while already looking, it just reports what it has found.
    private fun browse() {
        if (discovery != null) return report()
        multicast = wifi.createMulticastLock("kitc").apply { setReferenceCounted(false); acquire() }
        val listener = object : NsdManager.DiscoveryListener {
            override fun onServiceFound(info: NsdServiceInfo) {
                found[info.serviceName] = info
                report()
            }
            override fun onServiceLost(info: NsdServiceInfo) {
                found.remove(info.serviceName)
                report()
            }
            override fun onDiscoveryStarted(type: String) {}
            override fun onDiscoveryStopped(type: String) {}
            override fun onStartDiscoveryFailed(type: String, code: Int) {
                discovery = null
                error("discovery failed ($code)")
            }
            override fun onStopDiscoveryFailed(type: String, code: Int) {}
        }
        discovery = listener
        nsd.discoverServices(TYPE, NsdManager.PROTOCOL_DNS_SD, listener)
    }

    private fun report() {
        val tables = JSONArray()
        for (name in found.keys.sorted()) tables.put(JSONObject().put("id", name).put("name", name))
        emit(event("tables").put("tables", tables))
    }

    private fun stopBrowsing() {
        discovery?.let { runCatching { nsd.stopServiceDiscovery(it) } }
        discovery = null
        multicast?.release()
        multicast = null
    }

    @Suppress("DEPRECATION")  // resolveService and host: still the way to reach a table before Android 14's callbacks
    private fun join(name: String) {
        val service = found[name] ?: return error("The table isn't there any more.")
        stopBrowsing()
        nsd.resolveService(service, object : NsdManager.ResolveListener {
            override fun onResolveFailed(info: NsdServiceInfo, code: Int) = error("couldn't reach the table ($code)")
            override fun onServiceResolved(info: NsdServiceInfo) {
                io.execute {
                    val socket = Socket()
                    try {
                        socket.connect(InetSocketAddress(info.host, info.port), 5000)
                    } catch (e: IOException) {
                        return@execute error(e.message ?: "")
                    }
                    val line = Line(socket)
                    line.onText = { emit(event("message").put("peer", "host").put("text", it)) }
                    line.onClose = {
                        host = null
                        emit(event("closed"))
                    }
                    host = line
                    emit(event("joined"))
                    line.start()
                }
            }
        })
    }

    private fun send(peer: String, text: String) {
        if (peer.isNotEmpty() && peer != "host") peers[peer]?.send(text) else host?.send(text)
    }

    /** Leaving on purpose: nothing is reported back to the page. */
    fun close() {
        hosted = null
        registration?.let { runCatching { nsd.unregisterService(it) } }
        registration = null
        runCatching { server?.close() }
        server = null
        stopBrowsing()
        for (line in peers.values) {
            line.onClose = null
            line.cancel()
        }
        peers.clear()
        host?.let { it.onClose = null; it.cancel() }
        host = null
        found.clear()
    }

    /** One TCP connection carrying lines of UTF-8 text: a thread reads, sends go out in order. */
    private inner class Line(private val socket: Socket) {
        @Volatile var onText: ((String) -> Unit)? = null
        @Volatile var onClose: (() -> Unit)? = null
        private val writer = OutputStreamWriter(socket.getOutputStream(), Charsets.UTF_8)
        private val out = Executors.newSingleThreadExecutor()

        fun start() = io.execute {
            try {
                val reader = BufferedReader(InputStreamReader(socket.getInputStream(), Charsets.UTF_8))
                while (true) {
                    val text = reader.readLine() ?: break
                    if (text.isNotEmpty()) onText?.invoke(text)
                }
            } catch (e: IOException) {
                // the other phone went away
            }
            finish()
        }

        fun send(text: String) = out.execute {
            try {
                writer.write(text)
                writer.write("\n")
                writer.flush()
            } catch (e: IOException) {
                finish()
            }
        }

        fun cancel() {
            onClose = null
            finish()
        }

        @Synchronized private fun finish() {
            if (socket.isClosed) return
            runCatching { socket.close() }
            out.shutdown()
            onClose?.invoke()
        }
    }

    companion object {
        const val TYPE = "_kitc._tcp"
    }
}
