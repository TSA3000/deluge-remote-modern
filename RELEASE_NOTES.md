# Deluge Remote Modern — Release Notes

---

## v2.5.0 — Pagination
*2026-04-15*

### New Features

- **Paginated torrent list** — The popup now shows a configurable number of torrents per page instead of rendering the entire list at once. Dramatically improves performance for large libraries (1000+ torrents). Navigate with Prev/Next buttons; page info shows current position and total count.

- **Torrents per page setting** — New dropdown in Options → Extras lets you choose 10, 20, 50, 100, or All (no paging). Default is 20. Setting is saved and applied on next popup open.

### Technical Details

- Filtered torrents are collected into an array first, then sliced by `currentPage * TORRENTS_PER_PAGE`
- Page resets to 1 when sort column, sort direction, or any filter changes
- Pagination bar auto-hides when all torrents fit on one page or "All" is selected
- Dark theme support for pagination controls via CSS custom properties

### Files Changed

| File | Change |
|---|---|
| `popup.html` | Added `#pagination` div with Prev/Next buttons and page info |
| `js/popup.js` | Pagination state, filtered array slicing, page controls, reset on filter/sort |
| `js/global_options.js` | Added `torrents_per_page: 20` default |
| `js/background.js` | Added `torrents_per_page: 20` default |
| `options.html` | Added "Torrents per page" dropdown in Extras (10, 20, 50, 100, All) |
| `js/options.js` | Save/load `torrents_per_page`, change listener with status message |
| `css/popup.css` | Pagination bar styling |
| `css/theme-base.css` | Dark theme pagination styles |
| `manifest.json` | Version bumped to `2.5.0` |
| `RELEASE_NOTES.md` | This entry |
| `README.md` | Version history and features updated |

---


## v2.4.0 — Test Connection Button
*2026-04-11*

### New Features

- **Test Connection button** — Added a "Test Connection" button to the Options page under Basic Setup. Saves current settings, then checks connectivity to the Deluge Web UI and displays the result: connected, login failed, or unreachable. No more guessing whether the address/password is correct.

### Files Changed

| File | Change |
|---|---|
| `options.html` | Added Test Connection button and result span after password row |
| `js/options.js` | Test handler: saves settings, sends `check_status`, shows result |
| `css/options.css` | Styling for test button and result text |
| `manifest.json` | Version bumped to `2.4.0` |
| `RELEASE_NOTES.md` | This entry |
| `README.md` | Version history updated |

---


## v2.3.1 — Service Worker & Default Sync Fix
*2026-04-09*

### Bug Fixes

- **Login broken after v2.3.0** — Removing the bare `start()` call in v2.3.0 meant `loadConfig()` never ran when the service worker woke up, so the extension had empty credentials and could not connect. Re-added `start(false)` for normal wake-ups alongside `start(true)` for installs/updates via the `allowOpenOptions` parameter.

- **Mismatched refresh interval default** — `background.js` had `refresh_interval: 1000` while `global_options.js` and `options.html` used `3000`. Synced to `3000` everywhere.

### Files Changed

| File | Change |
|---|---|
| `js/background.js` | `start()` accepts `allowOpenOptions`; `onInstalled` calls `start(true)`, bare call uses `start(false)`; `refresh_interval` default changed to `3000` |
| `manifest.json` | Version bumped to `2.3.1` |
| `RELEASE_NOTES.md` | This entry |
| `README.md` | Version history updated |
---

## v2.3.0 — First Install & Options Save Fixes
*2026-04-09*

### Bug Fixes

- **Options not saving on OK** — Pressing OK closed the window before `chrome.storage.sync.set()` finished writing. The save is now async-safe — `window.close()` waits for the storage callback to complete.

- **Form fields appearing empty** — Address, port, and base path inputs used `placeholder` attributes instead of `value`, so they looked filled but were actually empty. First save would store empty strings. Added real default `value` attributes to match the placeholders.

- **Default refresh interval** — The HTML dropdown had `1s` pre-selected instead of `3s`, contradicting the JS default. Fixed the `selected` attribute in `options.html`.

- **Double options tab on install** — `start()` was called identically from both `onInstalled` and at the top level, causing two options tabs to open on first install. Added `allowOpenOptions` parameter so `onInstalled` calls `start(true)` (may open options tab) while the bare startup calls `start(false)` (loads config and connects only).

- **Auto-save overwriting on first install** — The `?newver=true` auto-save ran even on first install when storage was empty, saving blank defaults. It now only runs on version upgrades when existing settings are present.

- **Unhandled sendMessage error** — `chrome.runtime.sendMessage()` in `global_options.js` had no error handling. If the service worker was sleeping, this threw an uncaught rejection. Added `.catch()`.

### Files Changed

| File | Change |
|---|---|
| `js/options.js` | `saveOptions()` accepts callback; `?newver=true` only auto-saves on upgrade |
| `js/global_options.js` | Added `.catch()` to `chrome.runtime.sendMessage()` |
| `js/background.js` | `start()` accepts `allowOpenOptions`; `onInstalled` calls `start(true)`, bare call uses `start(false)` |
| `options.html` | Added `value` attrs to inputs; fixed refresh interval `selected`; `type="button"` on buttons |
| `manifest.json` | Version bumped to `2.3.0` |
| `RELEASE_NOTES.md` | This entry |
| `README.md` | Version history updated |

---

## v2.2.2 — Project Cleanup & Image Reorganization
*2026-04-09*

### Improvements

- **Image folder reorganization** — Action icons are now organized into separate icon pack folders for clarity and maintainability:
  - `images/classic/` — Original PNG action icons (Classic icon pack)
  - `images/modern/` — SVG action icons (Modern icon pack, renamed from `glyphs/`)
  - `images/icons/` — Extension toolbar and manifest icons (unchanged)
  - Shared UI icons (`close.png`, `error.png`, `add_torrent.png`) remain in `images/`

### Bug Fixes

- **Broken image paths** — Fixed 6 CSS references still pointing to the deleted `/themes/standard/images/` folder. `close.png` and `error.png` paths now correctly point to `/images/`.

### Dead Code Removed

- **`css/master.css`** — Removed `#mass-buttons` block (not used in HTML), `#table_header_speed`, `#table_header_actions`, `table#torrent_table`, `.sortable`, and `.sorted` selectors
- **`css/icon-pack-classic.css`** — Updated all image paths from `/images/` to `/images/classic/`

### Files Deleted

| File | Reason |
|---|---|
| `js/popup.css` | Stray copy — duplicate of `css/popup.css` |
| `js/theme-base.css` | Stray copy — duplicate of `css/theme-base.css` |
| `css/darkmode.css` | Replaced by theme engine in v2.1.0 |
| `js/Deluge.Formatters.js` | Not referenced anywhere |
| `images/asc.png` | Unused |
| `images/bottom.png` | Unused |
| `images/desc.png` | Unused |
| `images/top.png` | Unused |
| `images/deluge.png` | Unused (extension uses `images/icons/deluge.png`) |

### Files Changed

| File | Change |
|---|---|
| `css/master.css` | Fixed `close.png` path, removed all dead CSS selectors |
| `css/popup.css` | Fixed `error.png` path from `/themes/standard/images/` to `/images/` |
| `css/icon-pack-classic.css` | All paths updated to `/images/classic/` |
| `images/classic/` | **NEW** folder — 11 action PNGs moved here |
| `images/modern/` | **RENAMED** from `images/glyphs/` |
| `manifest.json` | Version bumped to `2.2.2` |
| `RELEASE_NOTES.md` | This entry |
| `README.md` | Version history updated |

---

## v2.2.1 — Torrent Stats Polish
*2026-04-05*

### Bug Fixes

- **Meaningless zero stats suppressed** — Ratio, ETA, Peers, Seeds, and Speed previously showed zeros (`0.00`, `∞`, `0/0`, `↓0.0 KiB/s`) for torrents that were Queued, Paused, Checking, or in Error state. These values are not meaningful when a torrent is not actively transferring. They now display `—` instead.

- **ETA `∞` on queued torrents** — A queued torrent with no active connection was showing `∞` ETA. ETA is now only shown when the torrent is Downloading or Seeding.

- **Speed row on inactive torrents** — Upload and download speeds now show `—` when the torrent is inactive and both speeds are zero. If a torrent is in an unexpected state but still transferring, speeds still display normally.

- **Ratio `0.00` on fresh torrents** — Ratio now shows `—` when the value is zero or negative, which is the case for any torrent that hasn't uploaded anything yet.

### Technical Details

- Added `Torrent.prototype.isActive()` — returns `true` only for `Downloading` and `Seeding` states
- `getRatio()` — returns `—` when `ratio <= 0`
- `getEta()` — returns `—` when not active or `eta <= 0` (fixes the `∞` on queued torrents, replaces the old `&infin;` HTML entity with a proper `—` dash)
- `getSpeeds()` — returns `—` when not active and both speeds are zero

### Files Changed

| File | Change |
|---|---|
| `js/torrent.js` | Added `isActive()`, updated `getRatio()`, `getEta()`, `getSpeeds()` |
| `manifest.json` | Version bumped to `2.2.1` |
| `RELEASE_NOTES.md` | This entry |
| `README.md` | Version history updated |

---

## v2.2.0 — Icon Pack System
*2026-04-05*

### New Features

- **Selectable Icon Packs** — A new "Icon Pack" option in Options → Appearance lets users choose between two button styles for the torrent list. The choice is saved and applied immediately on every page load.

- **Classic pack (default)** — The original 16×16 PNG icons, unchanged. Existing users see zero difference. This is the default so the extension continues to look exactly as before unless the user opts in.

- **Modern pack** — A full set of crisp SVG icons rendered via CSS `mask-image`. Because they use CSS custom properties rather than fixed colors, they automatically match the active theme:
  - Pause — amber/yellow
  - Resume — green
  - Auto-managed on — blue
  - Delete — red
  - Move Up / Down / Recheck — theme secondary text color
  - Each dark theme (Dark, Nord, Dracula, Solarized) has its own exact accent palette

- **Live Preview** — The Options page shows a strip of all action buttons below the selector. It updates instantly as you change the icon pack or the theme, so you see the result before saving.

- **Extensible** — Adding a third icon pack requires only a new CSS file and one `<option>` in the dropdown. No JavaScript changes needed.

### Technical Details

- `applyIconPack(pack)` in `global_options.js` sets or removes `data-icons="modern"` on `<html>`
- `css/icon-pack-classic.css` — PNG rules scoped to `html:not([data-icons="modern"])`
- `css/icon-pack-modern.css` — SVG mask rules scoped to `html[data-icons="modern"]` with per-theme overrides
- Bare icon background-image rules removed from `css/popup.css` to avoid specificity conflicts

### Files Changed

| File | Change |
|---|---|
| `images/glyphs/pause.svg` | **NEW** |
| `images/glyphs/resume.svg` | **NEW** |
| `images/glyphs/up.svg` | **NEW** |
| `images/glyphs/down.svg` | **NEW** |
| `images/glyphs/manage_active.svg` | **NEW** |
| `images/glyphs/manage.svg` | **NEW** |
| `images/glyphs/recheck.svg` | **NEW** |
| `images/glyphs/remove.svg` | **NEW** |
| `images/glyphs/cancel.svg` | **NEW** |
| `images/glyphs/trash.svg` | **NEW** |
| `images/glyphs/torrent_file.svg` | **NEW** |
| `images/glyphs/add_torrent.svg` | **NEW** |
| `css/icon-pack-classic.css` | **NEW** — Scoped PNG rules |
| `css/icon-pack-modern.css` | **NEW** — SVG mask rules with per-theme colors |
| `css/popup.css` | Removed bare icon background-image rules |
| `js/global_options.js` | Added `icon_pack: "classic"` default, `applyIconPack()`, change listener |
| `js/options.js` | Save/load `icon_pack`, live preview on change, status message |
| `options.html` | Icon Pack row in Appearance `<fieldset>` + live preview strip + CSS links |
| `popup.html` | Added icon-pack CSS `<link>` tags |
| `manifest.json` | Version bumped to `2.2.0` |
| `RELEASE_NOTES.md` | This entry |
| `README.md` | Updated features table and version history |

---

## v2.1.0 — Theme Engine
*2026-04-05*

### New Features

- **Multi-Theme Support** — Replaced the single `darkmode.css` with a full CSS custom-property theme engine. Users can now choose from four built-in dark themes in addition to Light and System auto.

- **Built-in themes:**
  - **Dark (Midnight Blue)** — Deep navy, the original dark theme
  - **Solarized Dark** — Ethan Schoonover's classic Solarized palette
  - **Nord** — Arctic, north-bluish cool tones
  - **Dracula** — Purple and pink dark theme

- **Extensible Architecture** — `css/theme-base.css` contains all themed selectors using only CSS variables — zero hardcoded colors. Adding a new theme requires only one CSS file.

- **System Preference** — "System (auto)" uses `@media (prefers-color-scheme: dark)` to map directly to the theme variable set, giving consistent automatic theming without JavaScript.

- **Light Mode Preserved** — All rules are scoped to `[data-theme]:not([data-theme="light"])`, so the default light appearance is completely untouched.

### Files Changed

| File | Change |
|---|---|
| `css/theme-base.css` | **NEW** — All themed selectors, no hardcoded colors |
| `css/themes/dark.css` | **NEW** — Dark (Midnight Blue) variables |
| `css/themes/solarized.css` | **NEW** — Solarized Dark variables |
| `css/themes/nord.css` | **NEW** — Nord variables |
| `css/themes/dracula.css` | **NEW** — Dracula variables |
| `css/darkmode.css` | **REMOVED** — Superseded by theme engine |
| `popup.html` | Added `<link>` tags for theme-base and all four theme files |
| `options.html` | Added `<link>` tags; added theme options to dropdown |
| `js/global_options.js` | `applyDarkMode()` updated to set `data-theme` for any theme name |
| `manifest.json` | Version bumped to `2.1.0` |

---

## v2.0.9 — Permissions & Performance
*2026-04-03*

### Fixed

- **Permissions** — Removed `tabs` permission from `manifest.json`. It was not required for any current functionality and was flagging unnecessarily in Chrome Web Store review.
- **Performance** — Default refresh interval reduced from 1 second to 3 seconds to ease server load while keeping the UI responsive.

### Files Changed

| File | Change |
|---|---|
| `manifest.json` | Removed `tabs` permission |
| `js/global_options.js` | Changed `refresh_interval` default to `3000` |

---

## v2.0.8 — Variable Refresh Rate
*2026-04-03*

### New Features

- **Configurable Refresh Rate** — Added a new "Refresh interval" dropdown in Options → Extras. Users can choose how frequently the popup polls the Deluge server for updates, from 500ms to 30 seconds.

### Files Changed

| File | Change |
|---|---|
| `options.html` | Added refresh interval `<select>` |
| `js/options.js` | Save/load `refresh_interval` |
| `js/global_options.js` | Added `refresh_interval: 3000` default |
| `js/popup.js` | Timer reads from `ExtensionConfig.refresh_interval` |

---

## v2.0.7 — Server Crash Prevention
*2026-04-03*

### Bug Fixes

- **Delete Crash Fix** — Fixed a critical bug where double-clicking the delete button, or the background refresh firing mid-deletion, could crash the Deluge daemon. Added a `dataset.clicked` lock on the delete button to block concurrent calls.

- **Safe Deletion Guard** — Deletion is now blocked while a torrent is in "Moving" or "Allocating" state. Attempting to delete during these states could cause file system corruption and orphaned data on disk.

- **Torrent Link Detection** — Replaced the strict `.torrent` regex with `new URL()` parsing so that `.torrent` links with query parameters (e.g. `?passkey=abc123`) or uppercase extensions (`.TORRENT`) are correctly captured.

### Files Changed

| File | Change |
|---|---|
| `js/popup.js` | `dataset.clicked` lock on delete, blocked states guard, refresh waits for confirmation |
| `js/add_torrent.js` | `new URL()` parser for `.torrent` links, early returns for efficiency |

---

## v2.0.6 — Version Bump
*2026-04-03*

### Maintenance

- Updated `manifest.json` version to `2.0.6` for Chrome Web Store resubmission.

### Files Changed

| File | Change |
|---|---|
| `manifest.json` | Version bumped to `2.0.6` |

---

## v2.0.5 — Label Selector Usability Fix
*2026-04-03*

### Bug Fixes

- **Label Dropdown Stability** — The label selector dropdown was closing unexpectedly when the table auto-refreshed while the user was choosing a label. The refresh is now paused while the dropdown is focused and resumes with a short delay after it closes.

### Files Changed

| File | Change |
|---|---|
| `js/popup.js` | `mousedown` pauses refresh, `focusout` resumes refresh with 300ms delay |

---

## v2.0.4 — UI & Dark Mode Fixes
*2026-04-03*

### Bug Fixes

- **Add Torrent Dialog** — The dialog failed to appear when clicking the Add Torrent button. `dom_helper.show()` now explicitly sets `display: block` instead of just clearing the inline style, which was being overridden by a stylesheet rule.

- **Progress Bar Color** — In dark mode, a paused torrent at 100% completion incorrectly displayed the green "finished" color instead of the grey "paused" color. Fixed by adding `:not(.Paused)` to the `.finished` CSS rule.

### Files Changed

| File | Change |
|---|---|
| `js/dom_helper.js` | `show()` forces `display: "block"` |
| `css/darkmode.css` | Added `:not(.Paused)` to `.finished` progress bar rule |

---

## v2.0.3 — The Vanilla JS Update
*2026-04-02*

### Performance Overhaul

- **jQuery Removed** — `jquery-4.0.0.min.js` (78.7KB) replaced with a custom `dom_helper.js` (1.4KB). The extension is now ~77KB lighter.
- **Native DOM** — All scripts transitioned to `document.querySelector`, `addEventListener`, `innerHTML`, `.value`, and `.checked`.

### Files Changed

| File | Change |
|---|---|
| `js/dom_helper.js` | **NEW** — fadeIn, fadeOut, show, hide, delegated on() |
| `js/popup.js` | Rewritten in native JS |
| `js/options.js` | Rewritten in native JS |
| `js/add_torrent.js` | Updated to `document.body.addEventListener()` |
| `js/torrents.js` | Removed jQuery IIFE, native DOM filters |
| `js/timer.js` | Updated for new DOM helper |
| `manifest.json` | Removed jQuery from `content_scripts` |
| `popup.html` | Replaced jQuery `<script>` with `dom_helper.js` |
| `options.html` | Replaced jQuery `<script>` with `dom_helper.js` |
| `js/libs/jquery-4.0.0.min.js` | **DELETED** |

---

## v2.0.2 — Label Selector
*2026-04-01*

### New Features

- **Inline Label Selector** — Each torrent row now shows a dropdown to change its label directly from the popup, without opening the Deluge Web UI. Uses Deluge's `label.set_torrent` API. Requires the Label plugin to be enabled in Deluge.

### Files Changed

| File | Change |
|---|---|
| `js/popup.js` | Label dropdown in info row, change handler, refresh pause/resume |
| `js/torrents.js` | `getLabels()` method, stores available labels from API response |
| `css/darkmode.css` | `.table_cell_label` and `.label_select` styling |
| `manifest.json` | Version bumped to `2.0.2` |

---

## v2.0.1 — Password Encryption
*2026-04-01*

### New Features

- **AES-256-GCM Encryption** — Passwords are now encrypted before being written to `chrome.storage.sync`. A per-installation AES-256 key is generated and stored in `chrome.storage.local`. Backward compatible — plain text passwords from v2.0.0 are detected and upgraded automatically on next save.

### Bug Fixes

- **Error Progress Bar** — In dark mode, the red Error state at 100% progress was being overridden by the green finished state. Fixed by increasing specificity of the Error rule.

### Files Changed

| File | Change |
|---|---|
| `js/crypto.js` | **NEW** — AES-256-GCM encrypt/decrypt via SubtleCrypto |
| `js/background.js` | `PasswordCrypto.decrypt()` before login |
| `js/options.js` | Encrypt on save, decrypt on load |
| `options.html` | Added `crypto.js` script tag |
| `css/darkmode.css` | Error bar specificity fix |
| `PRIVACY.md` | Updated to document AES-256-GCM encryption |

---

## v2.0.0 — Manifest V3 Migration & Dark Mode
*2026-04-01*

### Manifest V3 Migration

- Background page replaced with a **service worker** (`js/background.js`)
- All network calls rewritten from jQuery AJAX to native **`fetch()` API**
- `chrome.extension.getBackgroundPage()` replaced with **`chrome.runtime.sendMessage()`**
- `browser_action` → `action`, `chrome.browserAction` → `chrome.action`
- Host permissions moved to `host_permissions` array
- `web_accessible_resources` updated to MV3 object format with `matches`

### Dark Mode

- Three modes: **System (auto)**, **Light**, **Dark**
- Configurable in Options → Appearance → Theme
- Scoped via `[data-theme="dark"]` — light mode completely untouched
- Covers popup, options page, progress bars, dialogs, filters, scrollbars, buttons

### Other Changes

- Upgraded jQuery 3.0.0 → **4.0.0**
- Removed unused `jquery_tablesorter.js`
- Default protocol changed to **HTTPS**
- Handle `.torrent` and `magnet:` links **enabled by default**
- Fixed `deluge_active.png` (was a JPEG file with a PNG extension)
- New **green active icon** for clear connected vs disconnected state
- Added `.catch()` on all `setIcon()` and `sendMessage()` calls to prevent unhandled rejections
- Extension renamed to **Deluge Remote Modern**
- Credits original author YodaDaCoda in README and options page

### Files Changed

| File | Change |
|---|---|
| `manifest.json` | Full MV3 rewrite |
| `js/background.js` | **NEW** — Service worker (replaces background page) |
| `js/global_options.js` | Config defaults, storage listener, `applyDarkMode()` |
| `js/deluge.js` | Fetch-based API wrapper (replaces jQuery AJAX) |
| `js/popup.js` | `chrome.runtime.sendMessage()` for all background calls |
| `js/options.js` | Theme dropdown, dark mode save/load |
| `css/darkmode.css` | **NEW** — Full dark mode stylesheet |
| `popup.html` | Dark mode CSS link, updated script references |
| `options.html` | Dark mode CSS link, theme dropdown |
| `images/icons/deluge_active.png` | Fixed (was JPEG) |
| `images/icons/16_green.png` | **NEW** — Green active state icon |
