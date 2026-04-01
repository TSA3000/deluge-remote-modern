/*
 * Remote Deluge - Background Service Worker (Manifest V3)
 *
 * Combines: global_options, debug_log, deluge API, and background logic.
 * No DOM or jQuery — uses fetch() for network calls.
 */

// ── Global Options ──────────────────────────────────────────────────────────
let ExtensionConfig = {
	address_protocol: "https",
	address_ip:       "",
	address_port:     "",
	address_base:     "",
	password:         "",
	handle_magnets:   true,
	handle_torrents:  true,
	context_menu:     false,
	badge_timeout:    250,
	debug_mode:       false,
	dark_mode:        "system"
};

function loadConfig() {
	return chrome.storage.sync.get().then(items => {
		if (items && Object.keys(items).length > 0) {
			ExtensionConfig = { ...ExtensionConfig, ...items };
		}
	});
}

chrome.storage.onChanged.addListener((changes, namespace) => {
	for (const key in changes) {
		ExtensionConfig[key] = changes[key].newValue;
		if (key === "context_menu") {
			updateContextMenu(changes[key].newValue);
		}
	}
});

// ── Debug Log ───────────────────────────────────────────────────────────────
function debug_log(...args) {
	if (ExtensionConfig.debug_mode) {
		console.log(...args);
	}
}

// ── Deluge API (fetch-based) ────────────────────────────────────────────────
const DelugeAPI = {
	API_ERROR: "apierror",
	API_AUTH_CODE: 1,
	API_UNKNOWN_METHOD_CODE: 2,
	API_UNKNOWN_ERROR_CODE: 3,

	endpoint() {
		const proto = ExtensionConfig.address_protocol || "http";
		const ip    = ExtensionConfig.address_ip || "";
		const port  = ExtensionConfig.address_port || "8112";
		const base  = ExtensionConfig.address_base;
		return `${proto}://${ip}:${port}/${base ? base + "/" : ""}`;
	},

	/**
	 * Make a JSON-RPC call to Deluge.
	 * Returns { result, error } — caller checks which is set.
	 */
	async call(method, params = [], options = {}) {
		const url = this.endpoint() + "json";
		const timeout = options.timeout || 10000;
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeout);

		try {
			const resp = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ method, params, id: "-999" }),
				credentials: "include",
				signal: controller.signal
			});
			clearTimeout(timer);

			if (!resp.ok) {
				return { error: { type: "http", status: resp.status, message: resp.statusText } };
			}

			const json = await resp.json();
			if (json.error !== null) {
				return { error: { type: "api", code: json.error.code, message: json.error.message } };
			}
			return { result: json.result };
		} catch (err) {
			clearTimeout(timer);
			return { error: { type: "network", message: err.message } };
		}
	}
};

// ── Background Logic ────────────────────────────────────────────────────────
let statusTimer = null;
let contextMenuId = null;

const STATUS_CHECK_ERROR_INTERVAL = 120000;
const STATUS_CHECK_INTERVAL       = 60000;

// Badge helper
function badgeText(text, colour) {
	debug_log("badgeText:", text, colour);
	chrome.action.setBadgeText({ text });
	chrome.action.setBadgeBackgroundColor({ color: colour });
	setTimeout(() => {
		chrome.action.setBadgeText({ text: "" });
	}, ExtensionConfig.badge_timeout || 250);
}

// ── Daemon / Connection ─────────────────────────────────────────────────────
async function startDaemon(hostId) {
	const status = await DelugeAPI.call("web.get_host_status", [hostId]);
	if (status.result && status.result[3] === "Offline") {
		await DelugeAPI.call("web.start_daemon", [status.result[2]]);
		await new Promise(r => setTimeout(r, 2000));
	}
}

async function connectToDaemon() {
	const hosts = await DelugeAPI.call("web.get_hosts");
	if (hosts.error) throw new Error("Failed to get hosts");
	if (!hosts.result || hosts.result.length !== 1) {
		throw new Error("Expected exactly one host");
	}
	const hostId = hosts.result[0][0];
	await startDaemon(hostId);
	const conn = await DelugeAPI.call("web.connect", [hostId]);
	if (conn.error) throw new Error("Failed to connect to daemon");
}

async function login() {
	return DelugeAPI.call("auth.login", [ExtensionConfig.password]);
}

// ── Status Check ────────────────────────────────────────────────────────────
async function checkStatus(options) {
	debug_log("Deluge: Checking status");
	console.log("Deluge: checkStatus called, endpoint:", DelugeAPI.endpoint());
	clearTimeout(statusTimer);

	const resp = await DelugeAPI.call("web.connected", [], options);
	console.log("Deluge: web.connected response:", JSON.stringify(resp));

	if (resp.result === true) {
		activate();
		statusTimer = setTimeout(checkStatus, STATUS_CHECK_INTERVAL);
		return { connected: true };
	}

	if (resp.error && resp.error.type === "api") {
		if (resp.error.code === DelugeAPI.API_AUTH_CODE) {
			const loginResp = await login();
			if (loginResp.result === true) {
				return checkStatus(options);
			} else {
				debug_log("Deluge: Incorrect login details.");
				statusTimer = setTimeout(checkStatus, STATUS_CHECK_ERROR_INTERVAL);
				deactivate();
				chrome.runtime.sendMessage({ msg: "auto_login_failed" }).catch(() => {});
				return { connected: false, reason: "auth_failed" };
			}
		}
		debug_log("Deluge: API error occurred");
		deactivate();
		statusTimer = setTimeout(checkStatus, STATUS_CHECK_INTERVAL);
		return { connected: false, reason: "api_error" };
	}

	if (resp.error && resp.error.type === "network") {
		debug_log("Error: Network issue -", resp.error.message);
		statusTimer = setTimeout(checkStatus, STATUS_CHECK_ERROR_INTERVAL);
		deactivate();
		return { connected: false, reason: "network_error" };
	}

	// result is false — authenticated but not connected to daemon
	try {
		await connectToDaemon();
		activate();
		statusTimer = setTimeout(checkStatus, STATUS_CHECK_INTERVAL);
		return { connected: true };
	} catch (e) {
		debug_log("Deluge: Failed to connect to daemon", e);
		deactivate();
		statusTimer = setTimeout(checkStatus, STATUS_CHECK_INTERVAL);
		return { connected: false, reason: "daemon_error" };
	}
}

// ── Activate / Deactivate ───────────────────────────────────────────────────
function activate() {
	debug_log("Deluge: Extension activated");
	console.log("Deluge: Setting active icon");
	chrome.action.setIcon({
		path: {
			"16": "/images/icons/deluge_active.png",
			"32": "/images/icons/deluge_active.png"
		}
	}).then(() => {
		console.log("Deluge: Active icon set successfully");
	}).catch((err) => {
		console.error("Deluge: setIcon active FAILED:", err.message || err);
		chrome.action.setIcon({
			path: {
				"16": "images/icons/deluge.png",
				"32": "images/icons/deluge.png"
			}
		}).catch(() => {});
	});
	chrome.action.setTitle({ title: chrome.i18n.getMessage("browser_title") });
	chrome.runtime.sendMessage({ msg: "extension_activated" }).catch(() => {});
}

function deactivate() {
	debug_log("Extension deactivated");
	console.log("Deluge: Setting inactive icon");
	chrome.action.setIcon({
		path: {
			"16": "/images/icons/deluge.png",
			"32": "/images/icons/deluge.png"
		}
	}).catch((err) => {
		console.error("Deluge: setIcon deactivate FAILED:", err.message || err);
	});
	chrome.action.setTitle({ title: chrome.i18n.getMessage("browser_title_disabled") });
	chrome.runtime.sendMessage({ msg: "extension_deactivated" }).catch(() => {});
}

// ── Add Torrent from URL ────────────────────────────────────────────────────
async function addTorrentFromUrl(url, tabId) {
	debug_log("Sending URL to deluge");

	const dl = await DelugeAPI.call("web.download_torrent_from_url", [url, ""]);
	if (dl.error || !dl.result) {
		debug_log("Deluge: failed to download torrent from URL");
		badgeText("Fail", "#FF0000");
		if (tabId) chrome.tabs.sendMessage(tabId, { msg: "Deluge: failed to download torrent from URL." }).catch(() => {});
		return;
	}

	const tmpTorrent = dl.result;
	debug_log("Deluge: downloaded torrent.");

	const opts = await DelugeAPI.call("core.get_config_values", [[
		"add_paused", "compact_allocation", "download_location",
		"max_connections_per_torrent", "max_download_speed_per_torrent",
		"max_upload_speed_per_torrent", "max_upload_slots_per_torrent",
		"prioritize_first_last_pieces"
	]]);

	if (opts.error || !opts.result) {
		debug_log("Deluge: unable to fetch options.");
		if (tabId) chrome.tabs.sendMessage(tabId, { msg: "Deluge: Unable to fetch options." }).catch(() => {});
		return;
	}

	const add = await DelugeAPI.call("web.add_torrents", [[{ path: tmpTorrent, options: opts.result }]]);
	if (add.result) {
		debug_log("Deluge: added torrent.");
		badgeText("Add", "#00FF00");
		if (tabId) chrome.tabs.sendMessage(tabId, { msg: "Deluge: Success adding torrent!" }).catch(() => {});
	} else {
		debug_log("Deluge: unable to add torrent.");
		badgeText("Fail", "#FF0000");
		if (tabId) chrome.tabs.sendMessage(tabId, { msg: "Deluge: Unable to add torrent." }).catch(() => {});
	}
}

// ── Add Torrent from Magnet ─────────────────────────────────────────────────
async function addTorrentFromMagnet(url, tabId) {
	const resp = await DelugeAPI.call("core.add_torrent_magnet", [url, ""]);

	if (resp.result) {
		debug_log("Deluge: added magnet.");
		badgeText("Add", "#00FF00");
		if (tabId) chrome.tabs.sendMessage(tabId, { msg: "Deluge: Success adding torrent from magnet" }).catch(() => {});
	} else {
		debug_log("Deluge: failed to add magnet.");
		badgeText("Fail", "#FF0000");
		if (tabId) chrome.tabs.sendMessage(tabId, { msg: "Deluge: Failed to add torrent from magnet." }).catch(() => {});
	}
}

// ── Context Menu ────────────────────────────────────────────────────────────
function updateContextMenu(enabled) {
	chrome.contextMenus.removeAll(() => {
		if (enabled) {
			chrome.contextMenus.create({
				id: "context_links",
				title: "Send to Deluge",
				contexts: ["link"]
			});
		}
	});
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
	debug_log("Context menu sending link to Deluge:", info.linkUrl);
	const url = info.linkUrl;
	if (/^magnet:/.test(url)) {
		addTorrentFromMagnet(url, tab?.id);
	} else {
		addTorrentFromUrl(url, tab?.id);
	}
});

// ── Get Deluge Version ──────────────────────────────────────────────────────
async function getVersion() {
	const resp = await DelugeAPI.call("daemon.info");
	if (resp.result) {
		const parts = resp.result.split("-")[0].split(".");
		return { major: Number(parts[0]), minor: Number(parts[1]), build: Number(parts[2]) };
	}
	return null;
}

// ── Message Handling ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	debug_log("Received message:", request.method || request.msg, request);

	// Handle method-based messages (from content scripts and legacy)
	switch (request.method) {
		case "add_torrent_from_url":
			addTorrentFromUrl(request.url, sender.tab?.id);
			return false;

		case "add_torrent_from_magnet":
			addTorrentFromMagnet(request.url, sender.tab?.id);
			return false;

		case "context_menu":
			updateContextMenu(request.enabled);
			return false;

		case "ExtensionConfig":
			sendResponse({ value: ExtensionConfig[request.key] });
			return false;

		// Messages from popup
		case "check_status":
			checkStatus({ timeout: 1000 }).then(result => sendResponse(result));
			return true; // async

		case "deluge_api":
			DelugeAPI.call(request.apiMethod, request.params, request.options || {})
				.then(resp => sendResponse(resp));
			return true; // async

		case "get_endpoint":
			sendResponse({ endpoint: DelugeAPI.endpoint() });
			return false;

		case "get_version":
			getVersion().then(ver => sendResponse(ver));
			return true;

		default:
			break;
	}
});

// ── Startup ─────────────────────────────────────────────────────────────────
async function start() {
	await loadConfig();
	console.log("Deluge: Config loaded:", JSON.stringify({
		protocol: ExtensionConfig.address_protocol,
		ip: ExtensionConfig.address_ip,
		port: ExtensionConfig.address_port,
		base: ExtensionConfig.address_base,
		endpoint: DelugeAPI.endpoint()
	}));

	// Check for major version change
	const manifest = chrome.runtime.getManifest();
	if (
		typeof ExtensionConfig.version === "undefined" ||
		manifest.version.split(".")[0] !== (ExtensionConfig.version || "").split(".")[0]
	) {
		chrome.tabs.create({ url: "options.html?newver=true" });
	}

	updateContextMenu(ExtensionConfig.context_menu);
	checkStatus();
}

// Service workers use the install/activate events
chrome.runtime.onInstalled.addListener(() => {
	console.log("Deluge: Extension installed/updated");
	start();
});

// Also start on service worker wake-up (if not triggered by onInstalled)
start();
