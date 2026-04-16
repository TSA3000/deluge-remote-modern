# Deluge Remote Modern — Release Notes

---

## v2.6.1 — Pagination Dark Mode Fix
*2026-04-16*

### Bug Fixes

- **Pagination bar appeared light in dark themes** — The pagination bar and its Prev/Next buttons rendered with a light gradient background in all dark themes, including System (OS-level dark mode). The existing dark theme rules in `theme-base.css` didn't override the `background-image: linear-gradient(...)` on the pagination container, and they didn't target System theme at all (which uses `@media prefers-color-scheme` rather than a `data-theme` attribute).

### Fix

- Added explicit overrides for `[data-theme="dark"]`, `[data-theme="solarized"]`, `[data-theme="nord"]`, and `[data-theme="dracula"]` that set `background-image: none` plus the proper dark background color
- Added `@media (prefers-color-scheme: dark)` block covering `html:not([data-theme])` and `html[data-theme="system"]` so OS-level dark mode applies the same dark styling

### Files Changed

| File | Change |
|---|---|
| `css/theme-base.css` | Added pagination dark-mode rules for all themes + System |
| `manifest.json` | Version bumped to `2.6.1` |

---

## v2.6.0 — Performance, Search, Setup Polish & Plugin Detection
*2026-04-16*

Big release rolling up 4 major areas of work: API performance overhaul, search, setup page polish, and server plugin detection.

### New Features

#### Search by Name
New search input at the top of the popup filters the torrent list in real time (150ms debounce). Press `Escape` to clear. Combines with existing State, Tracker, and Label filters.

#### Setup Page Polish
- **Live URL preview** — As you type, a preview box shows the exact endpoint URL being built (e.g. `http://192.168.1.14:8112/json`). Helps catch typos before saving.
- **Password show/hide toggle** — Eye icon next to the password field to verify you typed it correctly.
- **Clearer base path help** — Inline hint explains the base path field is only needed for reverse proxies, with examples.
- **HTTP warning panel** — When HTTP protocol is selected, an inline warning appears with instructions for adding a Firefox HTTPS-Only Mode exception.
- **Enhanced Test Connection feedback** — Color-coded result (green ✓ for success, red ✗ for failure) with specific error messages (auth failure vs network failure vs service worker not responding).

#### Label Plugin Detection
The extension now queries `core.get_enabled_plugins` on the first successful connection. If the Label plugin is not enabled on the Deluge server, the entire Label UI is hidden:
- The per-row Label dropdown in each torrent card disappears
- The "Label:" filter dropdown in the toolbar is hidden
- Torrents continue to render normally without the Label column

### Performance

#### Diff-Based Polling
Subsequent polls now use `core.get_torrents_status` with `diff=true`, returning only fields that changed since the last call. For large libraries (1000+ torrents) this reduces payload by 80-95%. A full `web.update_ui` runs every 10th poll to reconcile the filter tree.

#### Event-Driven Updates
The popup subscribes to Deluge's event system on connect:
- `TorrentAddedEvent`, `TorrentRemovedEvent`, `TorrentStateChangedEvent`, `TorrentFinishedEvent`, `SessionPausedEvent`, `SessionResumedEvent`

Events are polled via `web.get_events` every second, so torrent additions/removals appear near-instantly instead of waiting for the next full refresh.

#### Trimmed Request Payload
Removed 5 unused fields from the torrent status request (`seeds_peers_ratio`, `is_seed`, `active_time`, `seeding_time`, `time_added`) — about 22% less data per torrent.

### Bug Fixes

- **AbortError uncaught rejection** — Fixed `AbortError: signal is aborted without reason` appearing in the console when API calls timed out. The fetch promise in `deluge.js` now has a silent default catch, and `AbortError` is normalized into a typed `{ type: "timeout" }` error object.
- **Timeouts raised from 1500-2000ms to 5000ms** — For large libraries, initial full update plus event polling can legitimately take longer than 2 seconds under load.

### Technical Details

- `Torrents.update()` routes to `fullUpdate()` on first call and every 10th poll, otherwise `diffUpdate()`
- `applyDiff()` merges only the changed fields into existing Torrent objects — no reconstruction
- New `Torrents.hasPlugin(name)` accessor (case-insensitive) for plugin-aware UI
- `fetchPluginsOnce()` runs after first successful full update
- Dispatches `Torrents:pluginsChanged` CustomEvent so the popup can reactively hide/show plugin-dependent UI
- Event listener registration is idempotent — registered once per session

### Files Changed

| File | Change |
|---|---|
| `js/torrents.js` | Rewritten — diff polling, events, trimmed KEYS, plugin detection, `hasPlugin()` API |
| `js/popup.js` | Search filter, event polling, search input handler, conditional label rendering, plugin visibility listener |
| `js/deluge.js` | Silent default catch, AbortError normalization |
| `js/options.js` | URL preview updater, password toggle handler, enhanced test feedback |
| `popup.html` | Search input, `.label-filter-group` wrapper for Label filter |
| `options.html` | Rewritten Basic Setup fieldset with URL preview, password toggle, HTTP warning, field hints |
| `css/popup.css` | Search box styling |
| `css/options.css` | Field hints, URL preview, icon button, inline warning, test result styles |
| `css/theme-base.css` | Dark theme counterparts for all new elements |
| `manifest.json` | Version bumped to `2.6.0` |

### Backwards Compatibility

- Requires Deluge 2.x (any version with `core.get_torrents_status` and the event system — 1.3.15+ should also work but untested)
- If `core.get_enabled_plugins` fails, the extension behaves safely — `hasPlugin()` returns false, meaning Label UI is hidden. This is safer than showing UI that doesn't work.
- If `core.get_torrents_status` behaves differently than expected on your Deluge version, the next 10th-poll full update will reconcile any missed state.

---

## v2.5.0 — Pagination
*2026-04-15*

- Paginated torrent list with configurable items per page (10, 20, 50, 100, All)
- Page resets on sort/filter change; pagination bar auto-hides when not needed
- New "Torrents per page" option in Options → Extras (default: All)

---

## v2.4.0 — Test Connection Button
*2026-04-11*

- Added "Test Connection" button to Options page

---

## Older versions

See git history for v2.3.x through v2.0.x changes.