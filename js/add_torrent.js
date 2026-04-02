debug_log("Creating click handler");
document.body.addEventListener("click", function (event) {
	var link = event.target.closest("a");
	if (!link) return;

	var url = link.href;
	debug_log("Click handler activated. URL: " + url);

	if (ExtensionConfig.handle_magnets) {
		debug_log("Handling magnets enabled");
		if (url.indexOf("magnet:") === 0) {
			debug_log("Detected link as magnet");
			event.stopPropagation();
			event.preventDefault();
			debug_log("Captured magnet link " + url);
			chrome.runtime.sendMessage({
				"method": "add_torrent_from_magnet",
				"url": url
			});
			debug_log("Link sent to Deluge.");
		}
	}

	if (ExtensionConfig.handle_torrents) {
		debug_log("Handling torrents enabled");
		if (/\.torrent$/.test(url)) {
			debug_log("Detected link as a torrent");
			event.stopPropagation();
			event.preventDefault();
			debug_log("Captured .torrent link " + url);
			chrome.runtime.sendMessage({
				"method": "add_torrent_from_url",
				"url": url
			});
			debug_log("Link sent to Deluge.");
		}
	}
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	debug_log(request.msg);
});
