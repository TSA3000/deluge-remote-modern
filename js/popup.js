document.addEventListener("DOMContentLoaded", function () {
	var extensionActivated = false;
	var overlay = document.getElementById("overlay");
	overlay.style.height = document.documentElement.scrollHeight + "px";

	var torrentContainer = document.getElementById("torrent_container");
	var globalAll = document.querySelector("#global-information .all");
	var globalDownloading = document.querySelector("#global-information .downloading");
	var globalPaused = document.querySelector("#global-information .paused");
	var globalSeeding = document.querySelector("#global-information .seeding");
	var globalQueued = document.querySelector("#global-information .queued");

	var REFRESH_INTERVAL = ExtensionConfig.refresh_interval || 1000;
	var refreshTimer = Timer(REFRESH_INTERVAL);

	// Labels cache — AMO-safe pattern: cache array of label strings, then
	// build real <option> DOM nodes in buildRow(). Previously cached an
	// HTML string and assigned via innerHTML.
	var cachedLabelValues = [];  // array of label strings (not including "No Label")
	var lastLabelHash = "";
	// Pagination
	var currentPage = 0;
	var totalPages = 1;
	var TORRENTS_PER_PAGE = ExtensionConfig.torrents_per_page || 0;

	// Keep the per-page dropdown and its visibility in sync with ExtensionConfig.
	// Called on popup open, storage changes, and config updates.
	function syncPerPagePopupUI() {
		var sel = document.getElementById("per_page_popup");
		if (!sel) return;
		sel.value = String(ExtensionConfig.torrents_per_page || 0);
		sel.style.display = ExtensionConfig.show_per_page_in_popup ? "" : "none";
	}

	function rebuildLabelOptions() {
		var labels = Torrents.getLabels();
		var hash = labels.join("|");
		if (hash === lastLabelHash) return;
		lastLabelHash = hash;
		cachedLabelValues = labels.slice();
	}

	// Builds and returns a fresh <select class="label_select"> DOM node with
	// "(No Label)" and every cached label as <option> children.
	function buildLabelSelect(torrentId) {
		var sel = document.createElement("select");
		sel.className = "label_select";
		sel.dataset.torrentId = torrentId;

		var noLabel = document.createElement("option");
		noLabel.value = "";
		noLabel.textContent = "(No Label)";
		sel.appendChild(noLabel);

		for (var i = 0; i < cachedLabelValues.length; i++) {
			var opt = document.createElement("option");
			opt.value = cachedLabelValues[i];
			opt.textContent = cachedLabelValues[i];
			sel.appendChild(opt);
		}
		return sel;
	}

	// Small helper: createElement with className + optional textContent
	function el(tag, className, text) {
		var n = document.createElement(tag);
		if (className) n.className = className;
		if (text !== undefined && text !== null) n.textContent = text;
		return n;
	}

	function buildRow(torrent) {
		var state = torrent.state === "Paused" ? "resume" : "pause";
		var managed = torrent.autoManaged ? "managed" : "unmanaged";
		var finishedClass = torrent.is_finished ? " finished" : "";
		var sizeText = (torrent.progress != 100 ? torrent.getHumanDownloadedSize() + " of " : "") + torrent.getHumanSize();

		// Outer row container
		var row = document.createElement("div");
		row.className = "torrent_row";
		row.dataset.id = torrent.id;

		// ── Row 1: position + name ──────────────────────────────────
		var tbl1 = document.createElement("table");
		var tr1  = document.createElement("tr");
		tr1.appendChild(el("td", "table_cell_position", String(torrent.getPosition())));
		tr1.appendChild(el("td", "table_cell_name", torrent.name));
		tbl1.appendChild(tr1);
		row.appendChild(tbl1);

		// ── Row 2: size / eta / ratio / peers / seeds / label / speed
		var tbl2 = document.createElement("table");
		var tr2  = document.createElement("tr");
		tr2.appendChild(el("td", "table_cell_size",   sizeText));
		tr2.appendChild(el("td", "table_cell_eta",    "ETA: "   + torrent.getEta()));
		tr2.appendChild(el("td", "table_cell_ratio",  "Ratio: " + torrent.getRatio()));
		tr2.appendChild(el("td", "table_cell_peers",  "Peers: " + torrent.num_peers + "/" + torrent.total_peers));
		tr2.appendChild(el("td", "table_cell_seeds",  "Seeds: " + torrent.num_seeds + "/" + torrent.total_seeds));

		var labelCell = el("td", "table_cell_label");
		labelCell.appendChild(buildLabelSelect(torrent.id));
		tr2.appendChild(labelCell);

		tr2.appendChild(el("td", "table_cell_speed",  torrent.getSpeeds()));
		tbl2.appendChild(tr2);
		row.appendChild(tbl2);

		// ── Row 3: progress bar ─────────────────────────────────────
		var tbl3 = document.createElement("table");
		var tr3  = document.createElement("tr");
		var progCell = el("td", "table_cell_progress");
		var progBar  = el("div", "progress_bar");
		var progInner = el("div", "inner " + torrent.state + finishedClass);
		progInner.style.width = torrent.getPercent();
		var progSpan = el("span", null, torrent.getPercent() + " - " + torrent.state);
		progBar.appendChild(progInner);
		progBar.appendChild(progSpan);
		progCell.appendChild(progBar);
		tr3.appendChild(progCell);
		tbl3.appendChild(tr3);
		row.appendChild(tbl3);

		// ── Row 4: actions ──────────────────────────────────────────
		var tbl4 = document.createElement("table");
		var tr4  = document.createElement("tr");
		var actionsCell = el("td", "table_cell_actions");
		var actionsDiv  = el("div", "main_actions");

		var btnState = el("a", "state " + state);
		btnState.title = "Pause/Resume Torrent";
		actionsDiv.appendChild(btnState);

		var btnUp = el("a", "move_up");
		btnUp.title = "Move Torrent Up";
		actionsDiv.appendChild(btnUp);

		var btnDown = el("a", "move_down");
		btnDown.title = "Move Torrent Down";
		actionsDiv.appendChild(btnDown);

		var btnManaged = el("a", "toggle_managed " + managed);
		btnManaged.title = "Toggle Auto-managed State";
		actionsDiv.appendChild(btnManaged);

		var btnRecheck = el("a", "force_recheck");
		btnRecheck.title = "Force re-check data";
		actionsDiv.appendChild(btnRecheck);

		var btnDelete = el("a", "delete");
		btnDelete.title = "Delete Options";
		actionsDiv.appendChild(btnDelete);

		actionsCell.appendChild(actionsDiv);
		tr4.appendChild(actionsCell);
		tbl4.appendChild(tr4);
		row.appendChild(tbl4);

		return row;
	}

	function updateTableDelay(ms) {
		setTimeout(updateTable, ms);
	}

	function updateTable() {
		refreshTimer.unsubscribe(updateTable);
		Torrents.update()
			.success(function () {
				renderTable();
				renderGlobalInformation();
				refreshTimer.subscribe(updateTable);
			})
			.error(function () {
				checkStatus();
			});
	}

	function pauseTableRefresh() {
		refreshTimer.unsubscribe(updateTable);
	}

	function resumeTableRefresh() {
		refreshTimer.unsubscribe(updateTable);
		refreshTimer.subscribe(updateTable);
	}

	function renderGlobalInformation() {
		var info = Torrents.getGlobalInformation();
		globalAll.textContent = info.all;
		globalDownloading.textContent = info.downloading;
		globalPaused.textContent = info.paused;
		globalSeeding.textContent = info.seeding;
		globalQueued.textContent = info.queued;
	}

	function renderTable() {
		var link = document.getElementById("deluge_webui_link");
		if (link) link.href = Deluge.endpoint();

		rebuildLabelOptions();

		var filterState = document.getElementById("filter_state");
		var filterTracker = document.getElementById("filter_tracker_host");
		var filterLabel = document.getElementById("filter_label");
		var searchEl = document.getElementById("search_name");
		var fState = filterState ? filterState.value : "All";
		var fTracker = filterTracker ? filterTracker.value : "All";
		var fLabel = filterLabel ? filterLabel.value : "All";
		var fSearch = searchEl ? searchEl.value.trim().toLowerCase() : "";

		var torrents = Torrents.sort(localStorage.sortColumn || "position").getAll();
		if (localStorage.sortMethod === "desc") {
			torrents.reverse();
		}

		// Filter torrents first
		var filtered = [];
		for (var i = 0, len = torrents.length; i < len; i++) {
			var torrent = torrents[i];

			if (fState !== "All" && fState !== torrent.state) {
				if (!(fState === "Active" && (torrent.speedDownload > 0 || torrent.speedUpload > 0))) {
					continue;
				}
			}
			if (fTracker !== "All" && fTracker !== torrent.tracker_host) {
				if (!(fTracker === "Error" && torrent.tracker_status.indexOf("Error") > -1)) {
					continue;
				}
			}
			if (fLabel !== "All" && fLabel !== torrent.label) {
				continue;
			}
			if (fSearch && torrent.name.toLowerCase().indexOf(fSearch) === -1) {
				continue;
			}
			filtered.push(torrent);
		}

		// Pagination
		TORRENTS_PER_PAGE = ExtensionConfig.torrents_per_page || 0;
		if (TORRENTS_PER_PAGE === 0) {
			// 0 means show all
			totalPages = 1;
			currentPage = 0;
		} else {
			totalPages = Math.max(1, Math.ceil(filtered.length / TORRENTS_PER_PAGE));
			if (currentPage >= totalPages) currentPage = totalPages - 1;
			if (currentPage < 0) currentPage = 0;
		}

		var startIdx = (TORRENTS_PER_PAGE === 0) ? 0 : currentPage * TORRENTS_PER_PAGE;
		var endIdx = (TORRENTS_PER_PAGE === 0) ? filtered.length : startIdx + TORRENTS_PER_PAGE;
		var pageItems = filtered.slice(startIdx, endIdx);

		// AMO-safe DOM construction — DocumentFragment batches insertions
		// into a single reflow. Much better perf than loop-appending to
		// the live DOM, and no innerHTML.
		var frag = document.createDocumentFragment();
		var labelValues = [];
		for (var p = 0; p < pageItems.length; p++) {
			frag.appendChild(buildRow(pageItems[p]));
			labelValues.push({ id: pageItems[p].id, label: pageItems[p].label || "" });
		}

		torrentContainer.textContent = "";
		torrentContainer.appendChild(frag);

		for (var j = 0, jlen = labelValues.length; j < jlen; j++) {
			var sel = torrentContainer.querySelector('.label_select[data-torrent-id="' + labelValues[j].id + '"]');
			if (sel) sel.value = labelValues[j].label;
		}

		// Update pagination controls
		updatePaginationControls(filtered.length);
	}

	function updatePaginationControls(totalFiltered) {
		var pageInfo = document.getElementById("page_info");
		var prevBtn = document.getElementById("page_prev");
		var nextBtn = document.getElementById("page_next");
		var paginationDiv = document.getElementById("pagination");

		var showPerPageSel = !!ExtensionConfig.show_per_page_in_popup;
		var alwaysShowBar  = !!ExtensionConfig.always_show_pagination;
		var needsPagination = (TORRENTS_PER_PAGE !== 0 && totalFiltered > TORRENTS_PER_PAGE);

		// Hide the whole bar only if pagination isn't needed, the per-page
		// selector isn't requested, and the user hasn't opted to always
		// keep the bar visible.
		if (!needsPagination && !showPerPageSel && !alwaysShowBar) {
			paginationDiv.style.display = "none";
			return;
		}

		paginationDiv.style.display = "";

		if (needsPagination) {
			pageInfo.style.display = "";
			prevBtn.style.display = "";
			nextBtn.style.display = "";
			pageInfo.textContent = "Page " + (currentPage + 1) + " / " + totalPages + " (" + totalFiltered + " torrents)";
			prevBtn.disabled = (currentPage <= 0);
			nextBtn.disabled = (currentPage >= totalPages - 1);
		} else if (alwaysShowBar) {
			// Show Prev/Next disabled, plus a summary line
			pageInfo.style.display = "";
			prevBtn.style.display = "";
			nextBtn.style.display = "";
			pageInfo.textContent = "Page 1 / 1 (" + totalFiltered + " torrent" + (totalFiltered === 1 ? "" : "s") + ")";
			prevBtn.disabled = true;
			nextBtn.disabled = true;
		} else {
			// Bar shown only for the per-page dropdown
			pageInfo.style.display = "none";
			prevBtn.style.display = "none";
			nextBtn.style.display = "none";
		}
	}

	// ── Event Handlers (delegated) ──────────────────────────────────────
	function getRowData(element) {
		var row = element.closest(".torrent_row");
		if (!row) return null;
		var torrentId = row.getAttribute("data-id");
		return { torrentId: torrentId, torrent: Torrents.getById(torrentId) };
	}

	function DelugeMethod(method, torrent, rmdata) {
		pauseTableRefresh();
		var actions;
		if (method === "core.set_torrent_auto_managed") {
			actions = [torrent.id, !torrent.autoManaged];
		} else if (method === "core.remove_torrent") {
			actions = [torrent.id, rmdata];
		} else {
			actions = [[torrent.id]];
		}

		Deluge.api(method, actions)
			.success(function () {
				debug_log("Success: " + method);
				updateTableDelay(250);
			})
			.error(function () {
				debug_log("Failed: " + method);
				// Refresh on error too so the UI re-syncs with the server.
				// After an optimistic removal that the server rejected,
				// forceFullUpdateNext() has already been called, so this
				// refresh will re-fetch the full list and restore the row.
				updateTableDelay(250);
			});
	}

	// Label click — pause refresh so dropdown stays open
	DomHelper.on(torrentContainer, "mousedown", ".label_select", function () {
		pauseTableRefresh();
	});

	// Label closed without change — resume after short delay
	DomHelper.on(torrentContainer, "focusout", ".label_select", function () {
		setTimeout(resumeTableRefresh, 300);
	});

	// Label change — set label via API
	DomHelper.on(torrentContainer, "change", ".label_select", function () {
		var torrentId = this.getAttribute("data-torrent-id");
		var newLabel = this.value;

		Deluge.api("label.set_torrent", [torrentId, newLabel])
			.success(function () {
				debug_log("Label set successfully");
				updateTableDelay(500);
			})
			.error(function () {
				debug_log("Failed to set label");
				updateTableDelay(250);
			});
	});

	// Action buttons
	DomHelper.on(torrentContainer, "click", ".main_actions a", function () {
		if (this.classList.contains("delete")) return;

		var rowData = getRowData(this);
		if (!rowData || !rowData.torrent) return;

		var method, rmdata = false;

		if (this.classList.contains("state")) {
			method = rowData.torrent.state === "Paused" ? "core.resume_torrent" : "core.pause_torrent";
		} else if (this.classList.contains("move_up")) {
			method = "core.queue_up";
		} else if (this.classList.contains("move_down")) {
			method = "core.queue_down";
		} else if (this.classList.contains("toggle_managed")) {
			method = "core.set_torrent_auto_managed";
		} else if (this.classList.contains("force_recheck")) {
			method = "core.force_recheck";
		} else if (this.classList.contains("rm_torrent_data")) {
			method = "core.remove_torrent";
			rmdata = true;
		} else if (this.classList.contains("rm_torrent")) {
			method = "core.remove_torrent";
		} else {
			return;
		}
		DelugeMethod(method, rowData.torrent, rmdata);
	});

	// Delete button — show options
	DomHelper.on(torrentContainer, "click", ".main_actions .delete", function () {
		// 1. Get the torrent data for this specific row
		var rowData = getRowData(this);
		if (!rowData || !rowData.torrent) return;

		// 2. GUARD: Prevent opening the delete menu if moving or allocating
		var blockedStates = ["Moving", "Allocating"];
		if (blockedStates.includes(rowData.torrent.state)) {
			alert("Cannot delete a torrent while it is moving data on the disk. Please wait.");
			return; // Stop the function here so the menu doesn't open
		}

		// 3. If it is safe, proceed with opening the delete menu
		pauseTableRefresh();
		var td = this.closest("td");
		var actions = td.querySelector(".main_actions");

		DomHelper.fadeOut(actions, 200, function () {
			var div = document.createElement("div");
			div.className = "delete-options";

			var cancel = document.createElement("a");
			cancel.className = "rm_cancel";
			cancel.title = "Cancel";
			div.appendChild(cancel);

			var rmData = document.createElement("a");
			rmData.className = "rm_torrent_data";
			rmData.title = "Delete with data";
			div.appendChild(rmData);

			var rmOnly = document.createElement("a");
			rmOnly.className = "rm_torrent";
			rmOnly.title = "Remove torrent only";
			div.appendChild(rmOnly);

			td.appendChild(div);
			DomHelper.hide(td);
			DomHelper.fadeIn(td, 200);
		});
	});

	// Delete option clicks
	DomHelper.on(torrentContainer, "click", ".delete-options a", function (e) {
		e.preventDefault();

		var td = this.closest("td");
		var deleteOpts = td.querySelector(".delete-options");

		// Prevent double-clicks that cause the Deluge server to crash
		if (!deleteOpts || deleteOpts.dataset.clicked) return;
		deleteOpts.dataset.clicked = "true";

		var rowData = getRowData(this);
		if (!rowData) return;

		var isCancel = this.classList.contains("rm_cancel");
		var isDelete = this.classList.contains("rm_torrent") || this.classList.contains("rm_torrent_data");
		var row      = this.closest(".torrent_row");

		if (this.classList.contains("rm_torrent")) {
			DelugeMethod("core.remove_torrent", rowData.torrent, false);
		} else if (this.classList.contains("rm_torrent_data")) {
			DelugeMethod("core.remove_torrent", rowData.torrent, true);
		}

		// Optimistic removal — the existing update pipeline uses diff
		// updates that never delete stale torrents, and event polling can
		// take up to ~1s. Drop the row from local state and the DOM right
		// away so the user sees the torrent disappear immediately. If the
		// server ends up rejecting the delete, the forced full update
		// (queued below via forceFullUpdateNext) will re-add it.
		if (isDelete) {
			Torrents.removeById(rowData.torrent.id);
			Torrents.forceFullUpdateNext();
			renderGlobalInformation();
			if (row) {
				DomHelper.fadeOut(row, 200, function () { row.remove(); });
			}
			return;
		}

		// Cancel path: just hide the delete options and restore the main
		// action buttons.
		DomHelper.fadeOut(deleteOpts, 200, function () {
			deleteOpts.remove();
			var actions = td.querySelector(".main_actions");
			if (actions) {
				DomHelper.fadeIn(actions, 200, function () {
					if (isCancel) {
						resumeTableRefresh();
						updateTable();
					}
				});
			}
		});
	});

	// ── Add Torrent Dialog ──────────────────────────────────────────────
	(function () {
		var dialog = document.getElementById("add-torrent-dialog");
		var inputBox = document.getElementById("manual_add_input");
		var addButton = document.getElementById("manual_add_button");
		var addTorrentLink = document.getElementById("add-torrent");

		addTorrentLink.addEventListener("click", function (e) {
			e.preventDefault();
			DomHelper.show(dialog);
		});

		dialog.addEventListener("click", function () {
			DomHelper.hide(dialog);
		});

		dialog.querySelector(".inner").addEventListener("click", function (e) {
			e.stopPropagation();
		});

		var closeBtn = dialog.querySelector(".close");
		if (closeBtn) {
			closeBtn.addEventListener("click", function (e) {
				e.preventDefault();
				DomHelper.hide(dialog);
			});
		}

		setTimeout(function () { addTorrentLink.blur(); }, 50);

		inputBox.addEventListener("keydown", function (e) {
			if (e.keyCode === 13) {
				e.preventDefault();
				addButton.click();
			}
		});

		addButton.addEventListener("click", function (e) {
			e.preventDefault();
			var url = inputBox.value;

			if (/\/(download|get)\//.test(url) || /\.torrent$/.test(url)) {
				chrome.runtime.sendMessage({ method: "add_torrent_from_url", url: url });
			} else if (/magnet:/.test(url)) {
				chrome.runtime.sendMessage({ method: "add_torrent_from_magnet", url: url });
			}

			inputBox.value = "";
			DomHelper.hide(dialog);
		});
	}());

	// ── Sort & Filters ──────────────────────────────────────────────────
	(function () {
		var sortEl = document.getElementById("sort");
		var sortInvert = document.getElementById("sort_invert");
		var filterState = document.getElementById("filter_state");
		var filterTracker = document.getElementById("filter_tracker_host");
		var filterLabel = document.getElementById("filter_label");

		sortEl.value = localStorage.sortColumn || "position";
		sortInvert.checked = (localStorage.sortMethod === "desc");

		if (filterState) filterState.value = localStorage["filter_state"] || "All";
		if (filterTracker) filterTracker.value = localStorage["filter_tracker_host"] || "All";
		if (filterLabel) filterLabel.value = localStorage["filter_label"] || "All";

		sortEl.addEventListener("change", function () {
			localStorage.sortColumn = this.value;
			currentPage = 0;
			renderTable();
		});

		sortInvert.addEventListener("change", function () {
			localStorage.sortMethod = this.checked ? "desc" : "asc";
			currentPage = 0;
			renderTable();
		});

		[filterState, filterTracker, filterLabel].forEach(function (el) {
			if (el) {
				el.addEventListener("change", function () {
					localStorage[this.id] = this.value;
					currentPage = 0;
					renderTable();
				});
			}
		});
	}());

	// ── Search Box ─────────────────────────────────────────────────────
	(function () {
		var searchEl = document.getElementById("search_name");
		if (!searchEl) return;

		// Restore last search from session (not persisted across reopens)
		var clearBtn = null;

		var debounceTimer = null;
		searchEl.addEventListener("input", function () {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(function () {
				currentPage = 0;
				renderTable();
			}, 150);
		});

		// Clear search on Escape
		searchEl.addEventListener("keydown", function (e) {
			if (e.keyCode === 27 && this.value) {
				this.value = "";
				currentPage = 0;
				renderTable();
				e.preventDefault();
			}
		});
	}());

	// ── Pagination Controls ────────────────────────────────────────────
	(function () {
		var prevBtn = document.getElementById("page_prev");
		var nextBtn = document.getElementById("page_next");
		var perPageSel = document.getElementById("per_page_popup");

		prevBtn.addEventListener("click", function () {
			if (currentPage > 0) {
				currentPage--;
				renderTable();
			}
		});

		nextBtn.addEventListener("click", function () {
			if (currentPage < totalPages - 1) {
				currentPage++;
				renderTable();
			}
		});

		if (perPageSel) {
			perPageSel.addEventListener("change", function () {
				var val = parseInt(perPageSel.value, 10) || 0;
				TORRENTS_PER_PAGE = val;
				ExtensionConfig.torrents_per_page = val;
				currentPage = 0;
				chrome.storage.sync.set({ torrents_per_page: val });
				renderTable();
			});
		}

		syncPerPagePopupUI();
		// ExtensionConfig is populated asynchronously from storage — re-sync
		// once it's ready so the dropdown reflects the real saved state.
		document.addEventListener("ExtensionConfigReady", syncPerPagePopupUI);
	}());

	// Keep dropdown in sync when settings change (e.g. Options page edited)
	chrome.storage.onChanged.addListener(function (changes) {
		if (changes.torrents_per_page || changes.show_per_page_in_popup || changes.always_show_pagination) {
			if (changes.torrents_per_page) {
				ExtensionConfig.torrents_per_page = changes.torrents_per_page.newValue;
			}
			if (changes.show_per_page_in_popup) {
				ExtensionConfig.show_per_page_in_popup = changes.show_per_page_in_popup.newValue;
			}
			if (changes.always_show_pagination) {
				ExtensionConfig.always_show_pagination = changes.always_show_pagination.newValue;
			}
			syncPerPagePopupUI();
			renderTable();
		}
	});

	// ── Event Polling ──────────────────────────────────────────────────
	// Poll Deluge events between full/diff updates to catch add/remove quickly
	var eventPollInterval = null;
	function startEventPolling() {
		if (eventPollInterval) return;
		eventPollInterval = setInterval(function () {
			if (!extensionActivated) return;
			var req = Torrents.pollEvents();
			if (req && req.success) {
				req.success(function () {
					// Re-render in case events changed the torrent list
					if (Torrents.getAll().length > 0) {
						renderTable();
						renderGlobalInformation();
					}
				});
			}
		}, 1000);
	}
	function stopEventPolling() {
		if (eventPollInterval) {
			clearInterval(eventPollInterval);
			eventPollInterval = null;
		}
	}

	// ── Status Checking ─────────────────────────────────────────────────
	function checkStatus() {
		chrome.runtime.sendMessage({ method: "check_status" }, function (response) {
			if (chrome.runtime.lastError) {
				setTimeout(checkStatus, 2000);
				return;
			}
			if (response && response.connected) {
				activated();
			} else if (response) {
				var message = (response.reason === "auth_failed")
					? chrome.i18n.getMessage("error_unauthenticated")
					: chrome.i18n.getMessage("error_generic");
				var span = overlay.querySelector(".overlay_inner span");
				if (span) {
					span.className = "error";
					span.textContent = message;
				}
				DomHelper.show(overlay);
			}
		});
	}

	function activated() {
		if (!extensionActivated) {
			extensionActivated = true;
			DomHelper.hide(overlay);
			updateTable();
			startEventPolling();
		}
	}

	function deactivated() {
		extensionActivated = false;
		stopEventPolling();
	}

	function autoLoginFailed() {
		var span = overlay.querySelector(".overlay_inner span");
		if (span) {
			span.classList.add("error");
			span.textContent = chrome.i18n.getMessage("error_unauthenticated");
		}
		DomHelper.show(overlay);
	}

	chrome.runtime.onMessage.addListener(function (request) {
		if (request.msg === "extension_activated") activated();
		else if (request.msg === "extension_deactivated") deactivated();
		else if (request.msg === "auto_login_failed") autoLoginFailed();
	});

	// ── Tab Navigation ─────────────────────────────────────────────────
	// Second & third tabs ("Search Indexers" and "History") are only shown
	// when Prowlarr is enabled.
	(function () {
		var tabNav     = document.getElementById("tab_nav");
		var searchTab  = tabNav ? tabNav.querySelector('[data-tab="search"]')  : null;
		var historyTab = tabNav ? tabNav.querySelector('[data-tab="history"]') : null;
		var torrentsTab = tabNav ? tabNav.querySelector('[data-tab="torrents"]') : null;
		if (!tabNav || !searchTab || !historyTab || !torrentsTab) return;

		function applyProwlarrVisibility() {
			var enabled = !!ExtensionConfig.prowlarr_enabled;
			if (enabled) {
				tabNav.classList.add("has-tabs");
				searchTab.style.display  = "";
				historyTab.style.display = "";
				if (typeof ProwlarrSearch !== "undefined") ProwlarrSearch.init();
			} else {
				searchTab.style.display  = "none";
				historyTab.style.display = "none";
				// If the user just disabled it while sitting on one of the
				// Prowlarr tabs, bounce them back to the torrents view.
				if (searchTab.classList.contains("active") ||
				    historyTab.classList.contains("active")) {
					activateTab("torrents");
				}
				tabNav.classList.remove("has-tabs");
			}
		}

		function activateTab(name) {
			var tabs   = tabNav.querySelectorAll(".tab");
			var panels = document.querySelectorAll(".tab-panel");
			for (var i = 0; i < tabs.length; i++) {
				tabs[i].classList.toggle("active", tabs[i].getAttribute("data-tab") === name);
			}
			for (var j = 0; j < panels.length; j++) {
				panels[j].classList.toggle("active", panels[j].id === "tab-" + name);
			}
			if (name === "search") {
				document.dispatchEvent(new Event("ProwlarrTabActivated"));
			} else if (name === "history") {
				document.dispatchEvent(new Event("ProwlarrHistoryTabActivated"));
			}
		}

		tabNav.addEventListener("click", function (e) {
			var t = e.target.closest(".tab");
			if (!t) return;
			e.preventDefault();
			var name = t.getAttribute("data-tab");
			if (name) activateTab(name);
		});

		// Allow other modules (e.g. history-replay) to request a tab switch
		document.addEventListener("SwitchTab", function (e) {
			if (e && e.detail) activateTab(e.detail);
		});

		chrome.storage.onChanged.addListener(function (changes) {
			if (changes.prowlarr_enabled) applyProwlarrVisibility();
		});

		if (typeof ExtensionConfig !== "undefined" &&
			Object.prototype.hasOwnProperty.call(ExtensionConfig, "prowlarr_enabled")) {
			applyProwlarrVisibility();
		}
		document.addEventListener("ExtensionConfigReady", applyProwlarrVisibility);
	}());

	checkStatus();
});