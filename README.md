# Deluge Remote Modern

[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/okjmppgdfmooahhabhcdjdhnmnkgkila?label=Chrome%20Web%20Store)](https://chromewebstore.google.com/detail/okjmppgdfmooahhabhcdjdhnmnkgkila)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/okjmppgdfmooahhabhcdjdhnmnkgkila?label=users)](https://chromewebstore.google.com/detail/okjmppgdfmooahhabhcdjdhnmnkgkila)
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/okjmppgdfmooahhabhcdjdhnmnkgkila?label=rating)](https://chromewebstore.google.com/detail/okjmppgdfmooahhabhcdjdhnmnkgkila)
[![GitHub release](https://img.shields.io/github/v/release/TSA3000/deluge-remote-modern?label=release)](https://github.com/TSA3000/deluge-remote-modern/releases)
[![License](https://img.shields.io/github/license/TSA3000/deluge-remote-modern)](./MIT-LICENSE)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-support-FFDD00?style=flat-square&logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/tsa3000)

---

A Chrome extension for managing a remote Deluge torrent server from your browser toolbar. Fork of [YodaDaCoda/chrome-deluge-remote](https://github.com/YodaDaCoda/chrome-deluge-remote) modernized for Manifest V3 with dark mode, themes, and more.

**Chrome Web Store:** `okjmppgdfmooahhabhcdjdhnmnkgkila`
**Repo:** <https://github.com/TSA3000/deluge-remote-modern>

## Features

- **Full Deluge control** — Pause/resume, queue up/down, recheck, delete (with or without data), toggle auto-managed, set labels
- **Add torrents** — From the popup (URL/magnet), right-click links, or `.torrent` file downloads
- **Prowlarr integration** — Search private and public indexers directly from the popup, grab releases to your download client, search history
- **Search by name** — Real-time filter box (150ms debounce, Esc to clear)
- **Filters** — State, Tracker, Label
- **Pagination** — Configurable torrents per page (10, 20, 50, 100, or all)
- **Dark Mode & Themes** — Light, Dark (Midnight), Solarized Dark, Nord, Dracula, or System (auto)
- **Icon Packs** — Classic (original PNG) or Modern (SVG glyphs)
- **Test Connection** — Verify setup before saving
- **Auto-reconnect** — Automatically reconnects to daemon after restarts
- **Variable Refresh Rate** — Configure how often the popup polls your server (500ms – 30s)
- **Password encryption at rest** — Uses Web Crypto API (AES-GCM) with a per-install key

## Performance

- **Diff-based polling** — Only changed fields returned on each poll (`core.get_torrents_status` with `diff=true`) — 80-95% less data for large libraries
- **Event-driven updates** — Subscribes to Deluge events for near-instant add/remove
- **Optimistic delete** — Torrents disappear instantly on delete, reconciled on next full update
- **Trimmed payload** — Only requests fields the UI actually uses

## Version History

### 2026-05-05 v2.8.4 — Hotfix: PasswordCrypto.resolveCredential is not a function
- Fixes runtime crash in v2.8.3 that broke login and Prowlarr API calls — `js/background.js` referenced `PasswordCrypto.resolveCredential` which only exists in `js/crypto.js`, not in the service worker's embedded `PasswordCrypto` object
- Both call sites now use `PasswordCrypto.decrypt()`, which already auto-detects format (decrypts ciphertext, passes plaintext through unchanged)

### 2026-05-05 v2.8.3 — Multi-Device Credentials: Plaintext Sync with Account-Wide Toggle
- Reworks the v2.8.1 toggle so its unchecked state actually does something useful for multi-device users — and the toggle propagates across devices automatically
- Checked (default, more secure): credentials AES-GCM encrypted in `storage.local` only, never sync
- Unchecked (less secure): credentials stored as plain text in `storage.sync` and shared across all devices on the same browser account — convenience for multi-device users, with the trade-off spelled out in the helper text
- Toggle is now stored in `storage.sync.store_credentials_locally` (account-wide) — unchecking on one device propagates the mode change and the plaintext credentials to every device on the same account
- Migration on upgrade from v2.8.1 moves the toggle from `storage.local` to `storage.sync` and cleans up legacy encrypted blobs in sync

### 2026-05-05 v2.8.1 — Per-Device Credential Storage (Multi-Device Sync Fix)
- New "Keep credentials on this device only" checkbox in Basic Setup (default: enabled)
- Note: in 2.8.1 the unchecked state still encrypted credentials before sending them to sync; see v2.8.2 for the redesigned plaintext-sync behavior
- One-time migration copies legacy `storage.sync` credentials into `storage.local` on upgrade

### 2026-04-18 v2.8.0 — Prowlarr Integration & Optimistic Delete
- Full Prowlarr search from the popup — tabbed UI (Torrents / Search Indexers / History)
- Indexer multi-select, sortable results, one-click grab
- Search history (last 50 queries persisted)
- Encrypted Prowlarr API key (same AES-GCM as Deluge password)
- Optimistic torrent deletion — instant row removal with server reconciliation

### 2026-04-17 v2.7.0 — Auto-Reconnect to Daemon
- Automatic daemon reconnection when WebUI loses connection
- "Reconnecting to daemon..." overlay during attempts

### 2026-04-16 v2.6.1 — Pagination Dark Mode Fix
- Fixed pagination bar appearing light in dark themes (including System/OS dark mode)

### 2026-04-16 v2.6.0 — Performance, Search, Setup Polish
- Search by name, diff polling, events, trimmed fields
- Live URL preview, password toggle, HTTP warning, better Test Connection feedback
- AbortError bugfix, timeouts raised to 5s

### 2026-04-15 v2.5.0 — Pagination
- Paginated torrent list with configurable items per page

### 2026-04-11 v2.4.0 — Test Connection Button
- Added "Test Connection" button to Options page

For earlier versions, see `RELEASE_NOTES.md` and git history.

## Installation

### Chrome Web Store (recommended)

Install from the [Chrome Web Store listing](https://chromewebstore.google.com/detail/okjmppgdfmooahhabhcdjdhnmnkgkila).

### From source

1. Clone this repo
2. Chrome → `chrome://extensions` → Enable Developer mode → Load unpacked → select this folder
3. Open the extension's Options page and configure your Deluge address and password

## Setup

### Deluge

1. Click the extension icon, then the options gear, or right-click the icon → Options
2. Fill in your Deluge protocol (http/https), IP/hostname, port (default 8112), and password
3. Leave the "Base path" field empty unless you use a reverse proxy (e.g. `https://yourdomain.com/deluge/`)
4. Click **Test Connection** to verify — you should see "✓ Connected successfully!"
5. Save

### Prowlarr (optional)

1. In Options, check **Enable Prowlarr** under Extras
2. Fill in your Prowlarr protocol, IP/hostname, port (default 9696), and API key
3. The API key can be found in Prowlarr → Settings → General → Security
4. Save — the popup will now show Torrents / Search Indexers / History tabs

### Firefox HTTPS-Only Mode

If you use HTTP (not HTTPS) to connect, Firefox's HTTPS-Only Mode will block the request. Add an exception in `about:preferences#privacy` → HTTPS-Only Mode → Manage Exceptions → add your Deluge host.

## Privacy

See [`PRIVACY.md`](PRIVACY.md). Short version: nothing leaves your browser except API calls to your Deluge server and (if enabled) your Prowlarr server. No telemetry, no ads, no external services.

## License

MIT — see [`MIT-LICENSE`](MIT-LICENSE).

## Credits

- Original extension: [YodaDaCoda](https://github.com/YodaDaCoda/chrome-deluge-remote)
- Modernization, theming, pagination, search, performance, Prowlarr integration: Project fork maintainers
- Community feedback from the Deluge forums (ambipro and others)
- Prowlarr API patterns inspired by [cross-seed](https://github.com/cross-seed/cross-seed)
