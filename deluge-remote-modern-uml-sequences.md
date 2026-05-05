# Deluge Remote Modern — Sequence Diagrams

Three key runtime flows.

---

## Flow 1 — Popup open + torrent polling cycle

```mermaid
sequenceDiagram
    actor User
    participant Popup as popup.js
    participant GO as global_options.js
    participant Storage as chrome.storage.sync
    participant Torrents as torrents.js
    participant Deluge as deluge.js
    participant BG as background.js
    participant Server as Deluge Web UI

    User->>Popup: Click extension icon
    activate Popup
    Popup->>GO: load shared scripts
    GO->>Storage: chrome.storage.sync.get()
    Storage-->>GO: ExtensionConfig values
    GO->>Popup: dispatch ExtensionConfigReady
    Note over Popup: syncPerPagePopupUI()<br/>renderTable()

    Popup->>BG: sendMessage{check_status}
    BG->>Server: POST web.connected
    alt Connected
        Server-->>BG: {connected: true}
        BG-->>Popup: {connected: true}
    else Not connected
        BG->>Server: POST auth.login
        Server-->>BG: {result: true}
        BG->>Server: POST web.connected
        Server-->>BG: {connected: false}
        BG->>BG: connectToDaemon()
        BG-->>Popup: {connected: true}
    end

    loop Every refresh_interval (e.g. 3s)
        Popup->>Torrents: update()
        alt Every 10th poll OR forced
            Torrents->>Deluge: api("web.update_ui", KEYS, {})
            Deluge->>BG: sendMessage{deluge_api}
            BG->>Server: POST web.update_ui
            Server-->>BG: {torrents: {...}, ...}
            BG-->>Deluge: full snapshot
            Deluge-->>Torrents: full snapshot
            Note over Torrents: rebuild map<br/>create/update Torrent objects
        else Diff poll
            Torrents->>Deluge: api("core.get_torrents_status", [{}, KEYS, true])
            Deluge->>BG: sendMessage{deluge_api}
            BG->>Server: POST get_torrents_status
            Server-->>BG: {id1: {progress: 45.2}, id2: {state: "Paused"}}
            BG-->>Deluge: diff
            Deluge-->>Torrents: diff
            Note over Torrents: applyDiff() merges<br/>only changed fields
        end

        Torrents-->>Popup: torrents updated
        Note over Popup: renderTable()<br/>→ buildRow() for each<br/>→ DocumentFragment.appendChild
    end

    loop Every 1s (event polling)
        Popup->>Deluge: api("web.get_events")
        Deluge->>BG: sendMessage
        BG->>Server: POST web.get_events
        Server-->>BG: [TorrentAddedEvent, ...]
        BG-->>Deluge: events
        Deluge-->>Popup: events
        alt TorrentAddedEvent / TorrentRemovedEvent
            Popup->>Torrents: forceFullUpdateNext()
        end
    end
    deactivate Popup
```

---

## Flow 2 — Prowlarr search (with multi-indexer fix)

```mermaid
sequenceDiagram
    actor User
    participant ProwlarrUI as prowlarr_search.js
    participant Prowlarr as prowlarr.js
    participant BG as background.js<br/>(ProwlarrAPI)
    participant Server as Prowlarr REST
    participant Storage as storage.sync

    Note over ProwlarrUI: pub.init() reads<br/>ExtensionConfig.prowlarr_selected_indexers<br/>→ selectedIndexers = [3, 7, 12]

    ProwlarrUI->>Prowlarr: getIndexers()
    Prowlarr->>BG: sendMessage{prowlarr_api,<br/>path:"api/v1/indexer"}
    BG->>Server: GET /api/v1/indexer
    Server-->>BG: [{id:1,...}, {id:3,...}, {id:7,...}]
    BG-->>Prowlarr: indexerList
    Prowlarr-->>ProwlarrUI: indexerList

    Note over ProwlarrUI: reconcileSelectedIndexersWithList()<br/>prunes any missing IDs<br/>renderIndexerList() with checkboxes

    User->>ProwlarrUI: enter "ubuntu" + click Search

    ProwlarrUI->>Prowlarr: search("ubuntu",<br/>{indexerIds:[3,7,12], categories:[3000]})

    Note over Prowlarr: q.indexerIds = [3,7,12]<br/>(arrays, NOT joined!)<br/>q.categories = [3000]

    Prowlarr->>BG: sendMessage{prowlarr_api,<br/>path:"api/v1/search",<br/>query: {query:"ubuntu",<br/>indexerIds:[3,7,12],<br/>categories:[3000]}}

    Note over BG: buildUrl() expands arrays:<br/>?query=ubuntu<br/>&indexerIds=3<br/>&indexerIds=7<br/>&indexerIds=12<br/>&categories=3000

    BG->>Server: GET /api/v1/search?...

    alt Old comma-joined behavior
        Note over BG,Server: ❌ ?indexerIds=3,7,12<br/>→ HTTP 400
    else Fixed array expansion
        Note over BG,Server: ✅ ?indexerIds=3&indexerIds=7&indexerIds=12<br/>→ 200 OK
        Server-->>BG: [{title, size, seeders, ...}, ...]
    end

    BG-->>Prowlarr: results array
    Prowlarr-->>ProwlarrUI: results

    Note over ProwlarrUI: currentResults = sorted<br/>renderResults()<br/>→ buildRow() + DocumentFragment

    ProwlarrUI->>Storage: addToHistory({query, count, ts, ...})

    User->>ProwlarrUI: change indexer checkbox

    ProwlarrUI->>ProwlarrUI: saveSelectedIndexers()
    ProwlarrUI->>Storage: storage.sync.set({prowlarr_selected_indexers: [3,7]})

    Note over Storage: storage.onChanged fires<br/>in other open popups too
```

---

## Flow 3 — Save options (with encrypted password)

```mermaid
sequenceDiagram
    actor User
    participant OptUI as options.js<br/>(form)
    participant Crypto as crypto.js
    participant Storage as storage.sync
    participant GO as global_options.js<br/>(in popup)
    participant PopupUI as popup.js

    User->>OptUI: type new password "secret"
    User->>OptUI: click Save

    Note over OptUI: passwordChanged =<br/>("secret" !== _originalPassword)

    par Encrypt password if changed
        OptUI->>Crypto: encryptIfChanged("secret", true, "password")
        Crypto->>Crypto: getOrCreateKey() (storage.local)
        Crypto->>Crypto: AES-GCM encrypt
        Crypto-->>OptUI: '{"_encrypted":true,"iv":"...","data":"..."}'
    and Encrypt Prowlarr key if changed
        OptUI->>Crypto: encryptIfChanged(prowlarrKey, false, ...)
        Crypto-->>OptUI: null (unchanged)
    end

    Note over OptUI: doSave({<br/>  ...settings,<br/>  password: cipherJson<br/>})

    OptUI->>Storage: storage.sync.set(settings)

    Storage-->>OptUI: callback fires
    OptUI->>OptUI: status: "Settings saved (password encrypted)"

    Note over Storage: storage.onChanged event<br/>fires in all extension contexts

    par Storage onChanged event
        Storage->>GO: onChanged in popup
        GO->>GO: ExtensionConfig[key] = newValue
        GO->>PopupUI: dispatch ExtensionConfigReady
        Note over PopupUI: re-render if torrents_per_page<br/>or pagination flags changed
    and
        Storage->>OptUI: onChanged in options
        OptUI->>OptUI: show "Password updated (encrypted)"
        OptUI->>OptUI: fade after 5s
    end

    Note over PopupUI: When popup next polls,<br/>activate() will re-decrypt<br/>the password before login
```

---

## Flow 4 — Add torrent (right-click "Send to Deluge")

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant CtxMenu as Context Menu<br/>(background.js)
    participant BG as background.js
    participant Crypto as PasswordCrypto
    participant Server as Deluge

    User->>Browser: Right-click magnet link
    Browser->>CtxMenu: contextMenus.onClicked
    CtxMenu->>BG: handleAdd(url)

    BG->>Crypto: decrypt(stored cipher)
    Crypto-->>BG: plaintext password

    BG->>Server: POST auth.login
    Server-->>BG: {result: true}

    BG->>Server: POST web.add_torrents [{path:url, options:{}}]
    Server-->>BG: [[true, info_hash]]

    BG->>BG: setBadgeText("✓")
    BG->>BG: setTimeout clear badge (badge_timeout ms)
```
