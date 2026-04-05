# Deluge Remote Modern Release Notes

---

## v2.2.0 — Icon Pack System

### New Features

- **Selectable Icon Packs:** A new "Icon Pack" option in the Appearance section of the Options page lets users choose between two button styles for the torrent list.
- **Classic (default):** The original 16×16 PNG icons unchanged. No visual difference for existing users — a zero-disruption default.
- **Modern (SVG glyphs):** A full set of crisp SVG icons that use CSS `mask-image` to render in the browser. Because they use `currentColor` via CSS variables, they automatically match the active theme — pause is yellow, resume is green, managed is blue, delete is red — with each dark theme (Dark, Nord, Dracula, Solarized) getting its own tuned palette.
- **Live Preview:** The Options page shows a live icon strip below the selector that updates instantly as you switch packs (and themes), so you can see exactly what you're getting before saving.
- **Extensible Architecture:** Adding a third icon pack in the future requires only a new CSS file and a `<option>` in the dropdown — no JS changes needed.

### How It Works

- `html[data-icons="modern"]` is set on the root element by `applyIconPack()` in `global_options.js`
- `css/icon-pack-classic.css` scopes the PNG rules under `html:not([data-icons="modern"])` — active by default
- `css/icon-pack-modern.css` scopes SVG mask rules under `html[data-icons="modern"]` with per-theme color overrides
- The old bare icon rules in `popup.css` are removed to avoid specificity conflicts

### Files Changed (v2.2.0)

| File | Change |
| --- | --- |
| `images/glyphs/` | **NEW folder** — 12 SVG glyph files (pause, resume, up, down, managed, unmanaged, recheck, remove, cancel, trash, torrent_file, add_torrent) |
| `css/icon-pack-classic.css` | **NEW** — Scoped PNG icon rules (active when no `data-icons` attribute) |
| `css/icon-pack-modern.css` | **NEW** — SVG mask icon rules with per-theme semantic colors |
| `css/popup.css` | Removed bare icon background rules (now in icon-pack CSS files) |
| `js/global_options.js` | Added `icon_pack: "classic"` default, `applyIconPack()` function, change listener |
| `js/options.js` | Added `icon_pack` to save/load, live preview on select change, status message case |
| `options.html` | Added icon pack `<select>` + live preview strip to Appearance fieldset; added icon-pack CSS `<link>` tags |
| `popup.html` | Added icon-pack CSS `<link>` tags |
| `manifest.json` | Version bumped to `2.2.0` |

---

## v2.1.0 — Theme Engine

### New Features

- **Multi-Theme Support:** Replaced the single `darkmode.css` with a full CSS custom-property theme engine. Users can now choose from four built-in themes: **Dark (Midnight Blue)**, **Solarized Dark**, **Nord**, and **Dracula**.
- **Extensible Architecture:** A new `css/theme-base.css` file contains all themed selectors using only CSS variables — it has zero hardcoded colors. Adding a new theme requires only a single CSS file defining variables under `[data-theme="mytheme"]`, a link tag in the HTML, and a dropdown option.
- **System Preference Integration:** The "System (auto)" mode now maps directly to the active theme's variable set via `@media (prefers-color-scheme: dark)`, giving consistent automatic theming without any JavaScript.
- **Light Mode Preservation:** All theme rules are scoped to `[data-theme]:not([data-theme="light"])`, ensuring the default light appearance is completely untouched.

### Files Changed (v2.1.0)

| File | Change |
| --- | --- |
| `css/theme-base.css` | **NEW** — All themed selectors using CSS variables; no hardcoded colors |
| `css/themes/dark.css` | **NEW** — Dark (Midnight Blue) theme variables |
| `css/themes/solarized.css` | **NEW** — Solarized Dark theme variables |
| `css/themes/nord.css` | **NEW** — Nord theme variables |
| `css/themes/dracula.css` | **NEW** — Dracula theme variables |
| `css/darkmode.css` | **REMOVED** — Replaced by the theme engine |
| `popup.html` | Added `<link>` tags for `theme-base.css` and all four theme files |
| `options.html` | Added `<link>` tags for `theme-base.css` and all four theme files; added theme options to dropdown |
| `js/global_options.js` | `applyDarkMode()` updated to set `data-theme` attribute for any theme name |
| `manifest.json` | Version bumped to `2.1.0` |

---

## v2.0.9 - Permissions & Performance

### Fixed

- **Permissions:** Removed `tabs` permission from `manifest.json` as it was not required for current functionality.
- **Performance:** Adjusted the dashboard refresh rate from 1 second to **3 seconds** to reduce background resource usage while maintaining a responsive UI.

### Changed

- Bumped version for resubmission to Chrome Web Store.

### Files Changed (v2.0.9)

| File | Change |
| --- | --- |
| `manifest.jsonl` | Removed `tabs` permission |
| `js/global_options.js` | Changed refresh_interval to 3000 "3 seconds" |

---

## v2.0.8 — Variable Refresh Rate

### New Features

- **Customizable Refresh Rate:** Added a new setting in the Options menu that allows users to choose how frequently the extension polls the Deluge server for updates (ranging from 500ms to 30s). This gives users better control over performance and server load.

### Files Changed (v2.0.8)

| File | Change |
| --- | --- |
| `options.html` / `js/options.js` | Added the UI dropdown and save logic for the new refresh interval setting. |
| `js/global_options.js` | Added `refresh_interval` to the default configuration state. |
| `js/popup.js` | Updated the `Timer` and refresh logic to respect the user's custom interval instead of hardcoding 1000ms. |

---

## v2.0.7 — Server Crash Prevention

### Bug Fixes

- **Delete Torrent Crash Fix:** Fixed a critical bug where deleting a torrent could cause the Deluge daemon to crash. This was triggered by rapid concurrent API calls (e.g., double-clicking the delete button or the background table refreshing at the exact moment a deletion was processing). Added a locking mechanism to prevent double-clicks and paused background refreshes until the deletion safely completes.
- **Safe Deletion Guard:** Added a check to prevent users from deleting a torrent while it is actively in a "Moving" or "Allocating" state, protecting the daemon from I/O errors and preventing orphaned data files on the disk.
- **Torrent Link Capture:** Improved the click interceptor on webpages to reliably capture `.torrent` links even when they contain query parameters (e.g., `?passkey=...`) or uppercase extensions (`.TORRENT`), by switching from strict regex to a robust URL parser.

### Files Changed (v2.0.7)

| File | Change |
| --- | --- |
| `js/popup.js` | Updated the `.delete-options a` click handler with a `dataset.clicked` lock to block double-clicks, and modified the refresh logic to wait for the server's confirmation before updating the table. |
| `js/add_torrent.js` | Replaced strict regex with `new URL()` parser for `.torrent` links, and added early returns for efficiency. |

---

## v2.0.6 — Version Bump

### Maintenance

- **Manifest Update:** Updated the extension version in `manifest.json` to accurately reflect the current release version.

### Files Changed (v2.0.6)

| File | Change |
| --- | --- |
| `manifest.json` | Bumped `version` to "2.0.6" |

---

## v2.0.5 — Label Selector Usability Fix

### Bug Fixes (v2.0.5)

- **Label Dropdown Closing:** Fixed an issue where the label selector dropdown would close unexpectedly if the UI refreshed while the user was trying to make a selection. The background table refresh is now automatically paused when the dropdown is focused.

### Files Changed (v2.0.5)

| File | Change |
| --- | --- |
| `js/popup.js` | Added `focus` and `blur` event listeners to `.label_select` to trigger `pauseTableRefresh()` and `resumeTableRefresh()` |

---

## v2.0.4 — UI & Dark Mode Fixes

### Bug Fixes (v2.0.4)

- **Add Torrent Dialog Fix:** Fixed an issue where clicking the "Add Torrent" button failed to show the popup dialog. The custom DOM helper now explicitly overrides the stylesheet by setting `display: block`.
- **Dark Mode Progress Bar Fix:** Fixed a specificity conflict in dark mode where a paused torrent at 100% completion would incorrectly display the green "finished" color instead of the grey "paused" color.

### Files Changed (v2.0.4)

| File | Change |
| --- | --- |
| `js/dom_helper.js` | Updated the `show` method to force `display: "block"` instead of clearing the inline style |
| `css/darkmode.css` | Added `:not(.Paused)` to the `.finished` progress bar rules to preserve the grey paused state at 100% |

---

## v2.0.3 — The Vanilla JS Update

### Performance Overhaul

- **jQuery Removed:** Replaced the heavy `jquery-4.0.0.min.js` (78.7KB) with a custom, ultra-lightweight `dom_helper.js` (1.4KB), saving ~77KB in overall extension size.
- **Native DOM Methods:** Transitioned all core scripts to use faster, native JavaScript methods (e.g., `document.querySelector`, `addEventListener`).

### Files Changed (v2.0.3)

| File | Change |
| --- | --- |
| `js/dom_helper.js` | **NEW** — Tiny helper (1.4KB) for fadeIn, fadeOut, show, hide, and delegated events |
| `js/popup.js` | Rewritten (`$()` → `querySelector`, `.on()` → `addEventListener`, `.html()` → `innerHTML`) |
| `js/options.js` | Rewritten (`$().val()` → `.value`, `$().is(":checked")` → `.checked`) |
| `js/add_torrent.js` | Global body event listeners updated to `document.body.addEventListener()` |
| `js/torrents.js` | Removed jQuery IIFE wrapper; transitioned filter logic to native DOM |
| `js/timer.js` | Updated references for the new DOM helper |
| `manifest.json` | Removed jQuery reference from `content_scripts` |
| `popup.html`, `options.html` | Replaced jQuery script tag with `dom_helper.js` |
| `js/libs/jquery-4.0.0.min.js` | **DELETED** |

---

## v2.0.2 — Label Selector

### New Features (v2.0.2)

- **Label Selector** — Each torrent row now shows a dropdown to change its label directly from the popup. Uses Deluge's `label.set_torrent` API. Requires the Label plugin to be enabled in Deluge.
- Label dropdown positioned on the info row between Seeds and Speed columns

### Files Changed (v2.0.2)

| File | Change |
| --- | --- |
| `js/popup.js` | Added `labelSelector()` function, label change handler, label in info row |
| `js/torrents.js` | Added `getLabels()` method, stores available labels |
| `css/darkmode.css` | Added `.table_cell_label` styling for light and dark modes |
| `manifest.json` | Version bumped to 2.0.2 |

---

## v2.0.1 — Password Encryption

### New Features (v2.0.1)

- **Password Encryption (AES-256-GCM)** — Passwords are now encrypted before being stored. A per-installation AES-256 key is generated and stored locally (`chrome.storage.local`), while the encrypted password syncs via `chrome.storage.sync`. Backward compatible with plain text passwords from v2.0.0.

### Bug Fixes (v2.0.1)

- **Fixed Error progress bar in dark mode** — Error state (red) now correctly overrides the finished state (green) when both classes are present on a torrent at 100%

### Files Changed (v2.0.1)

| File | Change |
| --- | --- |
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
