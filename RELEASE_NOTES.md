# Remote Deluge v2.0.1 Release Notes

**Release Date:** 2026-04-01

---

## Password Encryption (AES-GCM)

- **Secure Setup:** A random AES-256 key is generated on first load and stored in `chrome.storage.local` (local only, never syncs to the cloud).
- **Encrypted Storage:** Passwords are now encrypted with AES-GCM before being saved to `chrome.storage.sync`.
- **On-the-fly Decryption:** The background script automatically decrypts the password in memory when logging into the Deluge server.
- **Backward Compatibility:** Old plain text passwords are automatically detected and will continue to work. They are automatically encrypted the next time you save your settings.

---

# Remote Deluge v2.0.0 Release Notes

**Release Date:** 2026-04-01

---

## Manifest V3 Migration

Chrome is deprecating Manifest V2 extensions. This release migrates the entire extension to Manifest V3 for continued Chrome Web Store support.

- Background page replaced with a **service worker** (`background.js`) — no DOM or jQuery in background context
- All network calls rewritten from jQuery AJAX to native **fetch() API**
- `chrome.extension.getBackgroundPage()` replaced with **chrome.runtime.sendMessage()** in popup
- `browser_action` → `action` throughout manifest and codebase
- `chrome.browserAction` → `chrome.action` API calls
- Host permissions moved from `permissions` to `host_permissions` array
- `web_accessible_resources` updated to MV3 object format with `matches`
- `deluge.js` API wrapper rewritten with fetch(), maintaining `.success()/.error()` chaining for popup compatibility

## Dark Mode

Full dark mode support with three modes:

- **System (auto)** — follows your OS dark/light preference
- **Light** — original appearance, completely untouched
- **Dark** — deep blue/slate theme with proper contrast

Configurable in **Options → Appearance → Theme**. Dark mode styles are scoped so they never affect light mode. Covers all UI: popup, options page, progress bars, torrent rows, dialogs, filters, form elements, and scrollbars.

## jQuery 4.0 Upgrade

- Upgraded from jQuery 3.0.0 to **jQuery 4.0.0**
- Removed unused `jquery_tablesorter.js` (sorting was already handled by custom code in `torrents.js`)

## Default Settings Changes

- Default protocol changed from `http` to **`https`**
- **Handle .torrent links** enabled by default
- **Handle magnet links** enabled by default

## Icon Improvements

- Fixed `deluge_active.png` — was a JPEG file with a .png extension, now a proper PNG
- New **green-tinted active icon** so connected/disconnected states are visually distinct
- Added error handling on all `setIcon()` calls to prevent service worker crashes

## Bug Fixes

- Service worker no longer crashes when icon files fail to load
- Added `.catch()` handlers on `chrome.runtime.sendMessage()` to suppress errors when no listeners exist
- Improved error handling and logging throughout the background service worker

---

## Files Changed

| File | Change |
|---|---|
| `manifest.json` | MV3 format, action, host_permissions, jQuery 4 reference |
| `js/background.js` | **New** — service worker replacing old background page |
| `js/deluge.js` | Rewritten with fetch() API |
| `js/global_options.js` | Removed jQuery dependency, added dark mode helper |
| `js/popup.js` | Replaced getBackgroundPage() with messaging |
| `js/options.js` | Removed getBackgroundPage(), added dark_mode saving |
| `js/debug_log.js` | Unchanged (cleaned up) |
| `css/darkmode.css` | **New** — full dark/light/system theme |
| `popup.html` | Added darkmode.css link, jQuery 4 reference |
| `options.html` | Added darkmode.css link, Appearance fieldset, jQuery 4 |
| `images/icons/deluge_active.png` | Fixed format + green tint |
| `images/icons/16_green.png` | New 16px green icon |
| `js/libs/jquery-4.0.0.min.js` | **New** — replaces jquery-3.0.0.min.js |

## Files Removed

| File | Reason |
|---|---|
| `js/libs/jquery-3.0.0.min.js` | Replaced by jQuery 4.0.0 |
| `js/libs/jquery_tablesorter.js` | Unused — sorting handled by torrents.js |

## Unchanged Files

`torrent.js`, `torrents.js`, `timer.js`, `add_torrent.js`, `Deluge_Formatters.js`, `buttons.css`, `master.css`, `popup.css`, `options.css`, `chrome.css`, all images (except active icons), `_locales/`, `MIT-LICENSE`