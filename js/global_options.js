// All options stored in an object
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
	debug_mode:       false,
	dark_mode:        "system"
};

// Listen for changes
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

// Load options, then fire a custom event so page scripts know config is ready
chrome.storage.sync.get(function (items) {
	if (items && Object.keys(items).length > 0) {
		for (var key in items) {
			ExtensionConfig[key] = items[key];
		}
	}
	// Apply dark mode as soon as config is loaded
	if (typeof applyDarkMode === "function") {
		applyDarkMode(ExtensionConfig.dark_mode);
	}
	// Fire custom event for scripts waiting on config
	document.dispatchEvent(new Event("ExtensionConfigReady"));
});

// Dark mode helper — sets data-theme attribute on <html>
function applyDarkMode(mode) {
	if (typeof document === "undefined") return;
	var html = document.documentElement;
	if (mode === "dark") {
		html.setAttribute("data-theme", "dark");
	} else if (mode === "light") {
		html.setAttribute("data-theme", "light");
	} else {
		// "system" — remove attribute, let CSS media query decide
		html.removeAttribute("data-theme");
	}
}
