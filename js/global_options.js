var ExtensionConfig = {
	address_protocol: "https",
	address_ip:       "",
	address_port:     "",
	address_base:     "",
	password:         "",
	handle_magnets:   true,
	handle_torrents:  true,
	context_menu:     false,
	badge_timeout:    250,
	refresh_interval: 1000,
	debug_mode:       false,
	dark_mode:        "system"
};

chrome.storage.onChanged.addListener(function (changes, namespace) {
	for (var key in changes) {
		ExtensionConfig[key] = changes[key].newValue;
		if (key === "context_menu") {
			chrome.runtime.sendMessage({ method: "context_menu", enabled: changes[key].newValue });
		}
		if (key === "dark_mode") {
			applyDarkMode(changes[key].newValue);
		}
	}
});

chrome.storage.sync.get(function (items) {
	if (items && Object.keys(items).length > 0) {
		for (var key in items) {
			ExtensionConfig[key] = items[key];
		}
	}
	if (typeof applyDarkMode === "function") {
		applyDarkMode(ExtensionConfig.dark_mode);
	}
	document.dispatchEvent(new Event("ExtensionConfigReady"));
});

function applyDarkMode(mode) {
	if (typeof document === "undefined") return;
	var html = document.documentElement;
	if (mode === "dark") {
		html.setAttribute("data-theme", "dark");
	} else if (mode === "light") {
		html.setAttribute("data-theme", "light");
	} else {
		html.removeAttribute("data-theme");
	}
}
