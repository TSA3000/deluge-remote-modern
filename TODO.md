# Deluge Remote Modern — TODO

Active backlog of features and improvements for the Chrome extension.

---

## 🚀 Next Release (v2.9.0)

### Remaining Prowlarr UI Work

**1. Prowlarr result pagination + per-page selector**
- Apply the same paginated pattern from the Torrents tab to Prowlarr search results
- Add "Results per page" dropdown (5 / 10 / 20 / 50 / 100 / All) on the Prowlarr tab
- Prev / Next buttons + page info (`Page 1 / 5`)
- Reset to page 1 on new search or sort change
- **Files**: `popup.html` (pagination bar inside `#tab-search`), `js/prowlarr_search.js` (slice `currentResults` by page, `updateResultsPagination()`), `css/prowlarr.css` (styling — reuse pagination pattern)
- **Est**: 1.5 hours
- **Storage key**: `prowlarr_results_per_page` (default 20)

**2. Prowlarr result filter (client-side)**
- Add a small filter input above the results table
- Real-time filter by release title (150ms debounce, Esc to clear)
- Filters the already-fetched `currentResults` array — no new API call
- Same UX as the torrent search filter
- **Files**: `popup.html` (add `<input id="prowlarr_results_filter">`), `js/prowlarr_search.js` (filter function), `css/prowlarr.css`
- **Est**: 45 min

**3. Prowlarr history pagination + per-page selector**
- Same treatment for History tab — paginate with per-page dropdown (5 / 10 / 20 / 50 / 100 / All)
- Filter box for searching across history entries (by query text)
- **Files**: `popup.html` (pagination bar inside `#tab-history`), `js/prowlarr_search.js` (`renderHistory` pages through `_historyCache`), `css/prowlarr.css`
- **Est**: 1 hour
- **Storage key**: `prowlarr_history_per_page` (default 20)

**4. Persist last Prowlarr search across popup close/reopen**
- Currently `currentResults` lives in memory only — closing the popup wipes the last search, forcing a re-run
- Store the last search state in `chrome.storage.session` so re-opening the popup shows the same results until the user runs a new search
- State to persist: `query`, `category`, `indexerIds`, `results` array, `ts` timestamp, `sortColumn`, `sortDesc`
- Storage key: `prowlarr_last_search`
- On popup open, restore state into `currentResults`, repopulate the query input + filters, call `renderResults()`
- On new search, overwrite the stored state; on "Clear results" button, remove the key
- `chrome.storage.session` auto-clears on browser restart so stale data doesn't accumulate
- Show a subtle indicator (e.g. "Last search: 'ubuntu' · 3 min ago") above the results when restoring cached results
- **Files**: `js/prowlarr_search.js` (`saveLastSearch()`, `restoreLastSearch()` on `pub.init`), possibly `popup.html` (tiny "restored" label)
- **Est**: 1 hour
- **Note**: Pairs with the already-shipped #6 (remember indexers) — together they mean "popup reopens exactly as you left it"

---

## 📋 Community Feedback Backlog

### Quick wins (~30 min each)

- **Auto-set port on protocol change** — http → 8112, https → 443 (configurable default)
- **Better label copy** — "Context menu" → "Send to Deluge right-click menu"
- **Badge timeout** → "Action notification duration"
- **Debug mode tooltip** — Explain what it does
- **Additional sort options** — Add Label, Tracker, State, Error to sort dropdown

### Medium features

- **Right-click context menu on torrent rows** — Quick actions without opening the row
- **In-popup debug pane** — Live API request/response view for troubleshooting
- **Free space indicator** — Show Deluge disk free space in popup footer (`core.get_free_space`)
- **Global pause/resume session** — One button to pause/resume everything (`core.pause_session` / `core.resume_session`)
- **Force reannounce button** — Per-torrent (`core.force_reannounce`)
- **Queue top/bottom buttons** — Not just up/down one step (`core.queue_top` / `core.queue_bottom`)
- **Move storage** — Right-click → Move Storage dialog (`core.move_storage`)
- **Metadata event subscription** — Subscribe to `TorrentMetadataReceivedEvent` so magnet torrents update their name/size as soon as metadata resolves (currently waits for next 10th-poll full update)

### Big features

- **File browser dialog** — Browse torrent files, select which to download
- **Virtual scrolling** — Biggest perf win for 8k+ torrent libraries. Replace pagination with windowed rendering so only visible rows are in DOM.

---

## 🐛 Known Issues

- **Magnet torrents from some indexers stay stuck at info-hash name with 0 bytes size** — Not an extension bug; Deluge itself fails to fetch metadata when the indexer returns a tracker-less magnet (seen with TorrentDownload indexer). Same behavior in native Deluge Web UI. Workaround: use a different indexer, or add default public trackers in Deluge → Preferences → BitTorrent.

---

## ✅ Recently Completed (post-v2.8.0)

- **Per-page selector in popup** — Dropdown (5 / 10 / 20 / 50 / 100 / All) in the popup pagination bar, gated by a new Options checkbox. Added "Always show pagination bar" option for users who want the bar visible even when not needed. Added "5" as a new per-page option.
- **Remember selected indexers** — Prowlarr indexer selection persists across popup close/reopen via `chrome.storage.sync`. Stale IDs pruned after each `loadIndexers()`. Live-syncs between popups and devices via `storage.onChanged`.
- **Refactor options.js** — Extracted `encryptIfChanged()` and `bindVisibilityToggle()` helpers. Both password and Prowlarr API key encryption run in parallel via `Promise.all`. Dedup status messages on bulk save.
- **Fix: size display `0.0 KiB of 0.0 KiB`** — `torrent.js` now prefers Deluge's authoritative `total_done` and `total_wanted` fields over calculation from `total_size × progress`. Matches native Deluge Web UI behavior.
- **Fix: HTTP 400 on multi-indexer Prowlarr search** — Prowlarr's `/api/v1/search` expects repeated `indexerIds` / `categories` query params, not comma-joined. `buildUrl()` now expands arrays to repeated params.
- **background.js section banners** — 7 labeled regions with table of contents. Makes the 664-line service worker easier to navigate via editor code folding.

### Pre-v2.8.0

- **v2.8.0** — Prowlarr integration, optimistic delete, auto-reconnect
- **v2.7.0** — Auto-reconnect to daemon
- **v2.6.0** — Search, diff polling, events, setup polish, plugin detection
- **v2.5.0** — Pagination
- **v2.4.0** — Test Connection button

---

## 💡 Ideas (unprioritized)

- Keyboard shortcuts (`/` to focus search, `j`/`k` to navigate rows, etc.)
- Bulk actions (multi-select torrents via shift-click, apply action to all)
- Torrent grouping by label/tracker (collapsible sections)
- Progress notifications for completed torrents (browser notifications API)
- Stats tab — Aggregate session stats, graphs via Chart.js
- Import/export extension settings as JSON
- Theme editor (custom accent colors)
- Multi-language support (already have `_locales/en/messages.json` — add more)
- **Split `background.js` into modules via `importScripts`** — Consider once file exceeds ~1000 lines or if a new contributor finds it hard to navigate. Extract `DelugeAPI`, `ProwlarrAPI`, `PasswordCrypto` into their own files. ~2 hours, low risk, reversible.
