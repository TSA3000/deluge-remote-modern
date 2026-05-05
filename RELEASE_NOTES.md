# Deluge Remote Modern — Release Notes

---

## v2.8.1 — Per-Device Credential Storage (Multi-Device Sync Fix)
*2026-05-05*

Patch release fixing a credential-sync deadlock that broke the extension on multi-device setups.

### Bug Fixes

- **Repeated password prompts when using the extension on multiple PCs sharing a Chrome account** — On a second device, the saved password field would be blank and re-entering it would cause the first device to lose its password too, in an endless loop. Root cause: the encryption key is generated per-install and stored in `storage.local` (never syncs), but the encrypted password was stored in `storage.sync` (syncs across devices). PC2 received PC1's ciphertext, couldn't decrypt it with its own key, prompted for the password, re-encrypted and synced back, which then broke PC1 — and so on. Same bug applied to the Prowlarr API key.

### New Behavior

- **New per-device option in Basic Setup: "Keep credentials on this device only"** (default: enabled). When enabled, your Deluge password and Prowlarr API key are stored encrypted in `storage.local` only, never syncing to your Chrome account. Each device manages its own credentials independently — no more loop. Helper text in the options page explains the trade-off.
- **Disabling the option** restores the v2.8.0 behavior of writing credentials to both `storage.local` and `storage.sync`. This is intended for single-device users who want their credentials backed up to their Chrome account; using it on multiple active devices simultaneously will recreate the loop (now with informed consent).
- **One-time migration on upgrade** — if you're upgrading from v2.8.0 with credentials in `storage.sync`, the migration runs automatically on next launch: the encrypted password is copied into `storage.local` and the new local-only flag is set. Your active device keeps working without a re-prompt; secondary devices get the same migration on their next launch and prompt once for the password (since their local key can't decrypt the other device's blob), then work seamlessly thereafter.

### Files Changed

| File | Change |
|---|---|
| `manifest.json` | Version bumped to `2.8.1` |
| `options.html` | New checkbox row "Keep credentials on this device only" added to Basic Setup with explanatory helper text |
| `js/global_options.js` | New `store_credentials_locally: true` default; new `CREDENTIAL_KEYS` constant; load logic merges `storage.local` and `storage.sync` and routes credential keys based on the flag; one-time upgrade migration; `onChanged` listener ignores stale sync writes for credentials when in local-only mode |
| `js/options.js` | Save logic splits writes between `storage.local` (toggle + credentials always cached) and `storage.sync` (non-credentials, plus credentials only when synced mode is selected); load logic merges both namespaces; new status message for the toggle |
| `js/background.js` | New `store_credentials_locally` default in `ExtensionConfig`; `loadConfig()` reads from both namespaces and applies the same routing; `onChanged` listener mirrors the same stale-sync filter |
| `js/crypto.js` | Header comment updated to reflect dual-namespace architecture |

### Compatibility

- **Storage schema is backward-compatible**: the new `store_credentials_locally` key lives in `storage.local`. Existing sync data is left untouched (preserved as a fallback for users who downgrade or stay in synced mode).
- **No permissions changes**.
- **Upgrades from v2.8.0 are transparent on the active device**. Secondary devices prompt once for the password after migration, then work normally.

---

## v2.8.0 — Prowlarr Integration & Optimistic Delete
*2026-04-18*

### New Features

#### Prowlarr Search Integration
Full Prowlarr indexer search from the popup — no need to leave the extension.

- **Tabbed popup** — New tab navigation: Torrents | Search Indexers | History. Tabs only appear when Prowlarr is enabled in Options.
- **Search indexers** — Enter a query, select category and indexers, get results with name, size, seeders, leechers, and age. Click to grab a release — Prowlarr forwards it to your configured download client.
- **Indexer multi-select** — Choose which indexers to search or leave blank for all. Indexer list fetched from Prowlarr API with retry on tab activation.
- **Sortable results** — Click column headers to sort by name, size, seeders, leechers, or age.
- **Search history** — Last 50 searches persisted in `chrome.storage.local` with a dedicated History tab.
- **Encrypted API key** — Prowlarr API key stored with the same AES-GCM encryption as the Deluge password.
- **Prowlarr options** — Full setup in Options page: protocol, host, port, base path, API key (with show/hide toggle), results limit, live URL preview.

#### Optimistic Torrent Deletion
- When you delete a torrent, the row fades out and disappears immediately instead of waiting for the next poll to confirm the removal. If the server rejects the delete, the next forced full update restores the row.
- New `Torrents.removeById()` method drops a torrent from local state
- New `Torrents.forceFullUpdateNext()` forces next poll to be a full refresh to reconcile with server

### Technical Details

- `ProwlarrAPI` in background.js — mirrors `DelugeAPI` pattern with endpoint builder, fetch wrapper, AbortController support, and `waitForConfig()` cold-start guard
- `Prowlarr` module (js/prowlarr.js) — popup-side API client, proxies all calls through the background service worker
- `ProwlarrSearch` module (js/prowlarr_search.js) — handles search tab UI, indexer loading, result rendering, history management
- `currentProwlarrSearchController` — allows cancelling in-flight searches from the popup
- `_configReady` promise in background.js — prevents Prowlarr calls from firing before `loadConfig()` completes during cold start

### Files Changed

| File | Change |
|---|---|
| `js/prowlarr.js` | New — Prowlarr API client module |
| `js/prowlarr_search.js` | New — Search/History tab controller |
| `css/prowlarr.css` | New — Tab navigation + search UI styling |
| `js/background.js` | Added `ProwlarrAPI`, `_configReady` promise, Prowlarr message handlers |
| `js/popup.js` | Tab switching, Prowlarr visibility, optimistic delete with `removeById()` |
| `js/torrents.js` | Added `removeById()`, `forceFullUpdateNext()` |
| `js/options.js` | Prowlarr setup section, API key encryption, URL preview |
| `js/global_options.js` | Prowlarr defaults (protocol, ip, port, base, api_key, results_limit) |
| `popup.html` | Tab nav, search/history tab panels, Prowlarr script includes |
| `options.html` | Prowlarr fieldset with all config fields |
| `manifest.json` | Version bumped to `2.8.0` |

---

## v2.7.0 — Auto-Reconnect to Daemon
*2026-04-17*

### New Features

- **Automatic daemon reconnection** — When the Deluge WebUI loses its connection to the daemon (e.g. after a daemon restart), the extension automatically fetches the host list via `web.get_hosts()` and reconnects. Previously this showed a generic error.

### Files Changed

| File | Change |
|---|---|
| `js/background.js` | `connectToDaemon()` with host discovery, `checkStatus()` reconnection flow |
| `js/popup.js` | `showReconnecting()` overlay, `daemon_reconnecting` message handler |
| `css/popup.css` | `.reconnecting` style |
| `manifest.json` | Version bumped to `2.7.0` |

---

## v2.6.1 — Pagination Dark Mode Fix
*2026-04-16*

### Bug Fixes

- **Pagination bar appeared light in dark themes** — Added explicit overrides for all dark themes plus `@media (prefers-color-scheme: dark)` for System theme.

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
New search input at the top of the popup filters the torrent list in real time (150ms debounce). Press `Escape` to clear.

#### Setup Page Polish
- **Live URL preview** — Shows the exact endpoint URL as you type
- **Password show/hide toggle** — Eye icon next to the password field
- **Clearer base path help** — Inline hint for reverse proxy usage
- **HTTP warning panel** — Appears when HTTP selected, explains HTTPS-Only Mode fix
- **Enhanced Test Connection feedback** — Color-coded result with specific error messages

### Performance

- **Diff-based polling** — `core.get_torrents_status` with `diff=true` (80-95% less data)
- **Event-driven updates** — Subscribes to 6 Deluge events, polls `web.get_events` every second
- **Trimmed payload** — Removed 5 unused fields (~22% less data per torrent)

### Bug Fixes

- Fixed `AbortError: signal is aborted without reason` uncaught rejection
- Raised API timeouts from 1500-2000ms to 5000ms

### Files Changed

| File | Change |
|---|---|
| `js/torrents.js` | Diff polling, events, trimmed KEYS |
| `js/popup.js` | Search filter, event polling |
| `js/deluge.js` | Silent default catch, AbortError normalization |
| `js/options.js` | URL preview, password toggle, enhanced test feedback |
| `popup.html` | Search input |
| `options.html` | Polished Basic Setup fieldset |
| `css/popup.css` | Search box styling |
| `css/options.css` | Setup page styles |
| `css/theme-base.css` | Dark theme counterparts |
| `manifest.json` | Version bumped to `2.6.0` |

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
