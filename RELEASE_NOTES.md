# Deluge Remote Modern v2.0.2 Release Notes

**Release Date:** 2026-04-01

---

## v2.0.2 — Label Selector

### New Features
- **Label Selector** — Each torrent row now shows a dropdown to change its label directly from the popup. Uses Deluge's `label.set_torrent` API. Requires the Label plugin to be enabled in Deluge.
- Label dropdown positioned on the info row between Seeds and Speed columns

### Files Changed
| File | Change |
|---|---|
| `js/popup.js` | Added `labelSelector()` function, label change handler, label in info row |
| `js/torrents.js` | Added `getLabels()` method, stores available labels |
| `css/darkmode.css` | Added `.table_cell_label` styling for light and dark modes |
| `manifest.json` | Version bumped to 2.0.2 |

---

## v2.0.1 — Password Encryption

### New Features
- **Password Encryption (AES-256-GCM)** — Passwords are now encrypted before being stored. A per-installation AES-256 key is generated and stored locally (`chrome.storage.local`), while the encrypted password syncs via `chrome.storage.sync`. Backward compatible with plain text passwords from v2.0.0.

### Bug Fixes
- **Fixed Error progress bar in dark mode** — Error state (red) now correctly overrides the finished state (green) when both classes are present on a torrent at 100%

### Files Changed
| File | Change |
|---|---|
| `js/crypto.js` | **New** — AES-256-GCM encrypt/decrypt |
| `js/background.js` | Added PasswordCrypto, decrypts password before login |
| `js/options.js` | Encrypts password on save, decrypts on load |
| `options.html` | Added `crypto.js` script |
| `css/darkmode.css` | Error bar fix |
| `PRIVACY.md` | Updated to mention AES-256-GCM encryption |

---

## v2.0.0 — Manifest V3 Migration & Dark Mode

### Manifest V3 Migration
- Background page replaced with a **service worker** (`background.js`)
- All network calls rewritten from jQuery AJAX to native **fetch() API**
- `chrome.extension.getBackgroundPage()` replaced with **chrome.runtime.sendMessage()**
- `browser_action` → `action`, `chrome.browserAction` → `chrome.action`
- Host permissions moved to `host_permissions` array
- `web_accessible_resources` updated to MV3 object format

### Dark Mode
- Three modes: **System (auto)**, **Light**, **Dark**
- Configurable in Options → Appearance → Theme
- Dark styles scoped via `[data-theme="dark"]` — light mode completely untouched
- Covers popup, options, progress bars, dialogs, filters, scrollbars

### Other Changes
- Upgraded jQuery 3.0.0 → **4.0.0**
- Removed unused `jquery_tablesorter.js`
- Default protocol changed to **HTTPS**
- Handle .torrent and magnet links **enabled by default**
- Fixed `deluge_active.png` (was JPEG disguised as PNG)
- New **green active icon** for clear connected/disconnected state
- Added `.catch()` handlers on all `setIcon()` and `sendMessage()` calls
- Extension renamed to **Deluge Remote Modern**
- Credits original author YodaDaCoda in README and options page