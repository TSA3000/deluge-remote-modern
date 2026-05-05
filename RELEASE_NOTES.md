# Deluge Remote Modern — Release Notes

---

## v2.8.4 — Hotfix: PasswordCrypto.resolveCredential is not a function
*2026-05-05*

Hotfix for a runtime crash in v2.8.3 that broke login and Prowlarr API calls.

### Bug Fixed

- **`PasswordCrypto.resolveCredential is not a function` thrown from `js/background.js:253`** — and a second time from the login function. v2.8.3 introduced a `resolveCredential` helper in `js/crypto.js` (used by the options/popup pages) but the service worker's `js/background.js` embeds its own separate `PasswordCrypto` object that never received the new method. Two call sites in the service worker referenced it, immediately crashing on every login attempt and every Prowlarr search.

### Fix

Both call sites reverted to `PasswordCrypto.decrypt()`, which the service worker's embedded `PasswordCrypto` already implements with format auto-detection: encrypted blobs are decrypted, plaintext passes through unchanged. Same end result, no method ambiguity.

### Files Changed

| File | Change |
|---|---|
| `manifest.json` | Version bumped to `2.8.4` |
| `js/background.js` | Two `PasswordCrypto.resolveCredential(...)` calls reverted to `PasswordCrypto.decrypt(...)` (Prowlarr `call()` and `login()`); comments referencing the removed helper updated |

### Compatibility

- No storage schema changes.
- No permissions changes.
- Upgrades from v2.8.3 are transparent and immediate (login/Prowlarr start working again on next service worker startup).

---

## v2.8.3 — Multi-Device Credentials: Plaintext Sync with Account-Wide Toggle
*2026-05-05*

Patch release reworking how the **"Keep credentials on this device only"** checkbox (added in v2.8.1) actually behaves, so that the multi-device convenience mode genuinely works across devices without the password-prompt loop or per-device manual setup.

### What Was Wrong in 2.8.1

v2.8.1 introduced the toggle but treated both modes as encrypted: the only difference was whether the encrypted blob was *also* mirrored into `storage.sync`. Two problems:

1. **The toggle was a no-op for its stated purpose.** Mirroring the encrypted blob to sync didn't help multi-device users because the AES-GCM encryption key is per-install (lives in `storage.local`, never syncs). PC2 received PC1's ciphertext but couldn't decrypt it — same as before the toggle existed.
2. **Even if 2.8.1's "unchecked" mode had stored plaintext** (it didn't), the toggle itself was per-device — PC1 unchecking wouldn't have flipped PC2's mode, so PC2 would have ignored any plaintext arriving via sync.

### What's Fixed in 2.8.3

The two modes are now genuinely different, and the toggle is now account-wide:

- **Checked (default, more secure)** — Your Deluge password and Prowlarr API key are AES-GCM encrypted with a key unique to each device, and the encrypted blobs are kept in `storage.local` only. Credentials never leave this device.

- **Unchecked (less secure, multi-device convenience)** — Your password and API key are stored as **plain text** in `storage.sync` and shared across every device signed into the same browser account. Anyone with access to your browser account can read them.

- **The toggle itself syncs.** Storing it in `storage.sync.store_credentials_locally` means unchecking on PC1 propagates the mode change to every device on the same account. PC2 receives the toggle flip and the new plaintext credentials together, switches to plaintext mode automatically, and clears its now-stale encrypted blob from `storage.local`. No per-device manual setup needed.

> **Heads up — re-checking the toggle:** When you switch *back* from plaintext-sync to encrypted-local on any one device, that device re-encrypts the plaintext with its own per-device key, and the plaintext is wiped from sync. Other devices see the toggle flip too and switch back to encrypted mode, but they don't have an encrypted blob of their own yet — you'll need to re-enter the password once on each device after re-enabling encrypted mode. This is unavoidable: per-device keys can't decrypt each other's blobs, and re-encrypting on a device's behalf without explicit user action would defeat the security point.

The helper text under the checkbox now states the trade-off plainly and notes that the setting is account-wide.

### Storage Layout

- `storage.sync.store_credentials_locally` — toggle (account-wide as of 2.8.3)
- `storage.sync.password_plain` — plaintext password (when toggle off)
- `storage.sync.prowlarr_api_key_plain` — plaintext API key (when toggle off)
- `storage.local.password` — encrypted blob (when toggle on)
- `storage.local.prowlarr_api_key` — encrypted blob (when toggle on)
- `storage.local.encryption_key_jwk` — per-device AES-GCM key (never syncs)

The `_plain` suffix on the plaintext fields makes the storage format unambiguous from the key name alone — code can never accidentally treat plaintext as ciphertext or vice versa.

### Migration on Upgrade

- **From v2.8.1** — your existing toggle setting is preserved and moved from `storage.local` to `storage.sync`. Encrypted blobs already in `storage.local` keep working in encrypted mode. Legacy encrypted blobs in `storage.sync` get cleaned up. If your toggle was off in 2.8.1, you'll need to re-enter the password once after upgrading (the previously-synced encrypted blob is unreadable on other devices anyway).
- **From v2.8.0 or earlier** — the toggle defaults to checked (secure mode) and goes straight into `storage.sync`. Legacy encrypted blobs in `storage.sync` get copied into `storage.local` on first launch and removed from sync. The active device works seamlessly without a re-prompt; secondary devices prompt once for the password.

### Files Changed

| File | Change |
|---|---|
| `manifest.json` | Version bumped to `2.8.3` |
| `options.html` | New helper text under the toggle spells out the security trade-off and the account-wide scope |
| `js/global_options.js` | Toggle resolution prefers `storage.sync` with `storage.local` legacy fallback; onChanged maps `password_plain`/`prowlarr_api_key_plain` to runtime fields and clears stale encrypted blobs from local when toggle flips off; migration moves the toggle from local to sync |
| `js/options.js` | Save logic encrypts to `storage.local` or writes plaintext to `storage.sync` depending on toggle; toggle write goes to `syncSettings`; aggressively cleans up the unused namespace on every Apply; legacy `store_credentials_locally` in `storage.local` removed each Apply |
| `js/background.js` | `loadConfig()` resolves credentials from the active mode's namespace; `onChanged` listener applies the same routing |
| `js/crypto.js` | Header documents the account-wide-toggle, dual-format model; new `PasswordCrypto.resolveCredential(value, localOnly)` helper that returns plaintext regardless of mode so runtime code stays mode-agnostic |
| `RELEASE_NOTES.md` | This entry |
| `README.md` | Version history note |

### Compatibility

- Storage schema is forward-compatible. The `_plain` field names and the sync-located toggle are both new in 2.8.3.
- No permissions changes.

---

## v2.8.1 — Per-Device Credential Storage (Multi-Device Sync Fix)
*2026-05-05*

Patch release adding the **"Keep credentials on this device only"** toggle.

- New per-device option in Basic Setup: when enabled (default), the password and Prowlarr API key are stored encrypted in `storage.local` only. Note: in 2.8.1 the unchecked state still encrypted credentials before sending them to sync — see v2.8.2 for the redesigned plaintext-sync behavior.
- One-time migration on upgrade copies any existing `storage.sync` credentials into `storage.local`.

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
