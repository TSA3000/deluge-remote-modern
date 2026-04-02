$(function () {
	var extensionActivated = false;
	var $overlay = $("#overlay").css({ height: $(document).height() });

	// Cache selectors used on every render
	var $torrentContainer = $("#torrent_container");
	var containerEl = $torrentContainer[0];
	var $globalInfo = $("#global-information");
	var $gAll = $(".all", $globalInfo);
	var $gDown = $(".downloading", $globalInfo);
	var $gPaused = $(".paused", $globalInfo);
	var $gSeed = $(".seeding", $globalInfo);
	var $gQueued = $(".queued", $globalInfo);

	const REFRESH_INTERVAL = 30000;
	var refreshTimer = Timer(REFRESH_INTERVAL);

	// Label options cache — rebuilt only when labels change
	var cachedLabelHtml = '<option value="">(No Label)</option>';
	var lastLabelHash = "";

	function rebuildLabelOptions() {
		var labels = Torrents.getLabels();
		var hash = labels.join("|");
		if (hash === lastLabelHash) return;
		lastLabelHash = hash;
		var parts = ['<option value="">(No Label)</option>'];
		for (var i = 0; i < labels.length; i++) {
			parts.push('<option value="' + labels[i] + '">' + labels[i] + '</option>');
		}
		cachedLabelHtml = parts.join("");
	}

	/*
	 * Build torrent row as HTML string.
	 * ~5-10x faster than jQuery element creation for large lists.
	 */
	function buildRowHtml(t) {
		var state = t.state === "Paused" ? "resume" : "pause";
		var managed = t.autoManaged ? "managed" : "unmanaged";
		var finished = t.is_finished ? " finished" : "";
		var size = (t.progress != 100 ? t.getHumanDownloadedSize() + " of " : "") + t.getHumanSize();

		return '<div class="torrent_row" data-id="' + t.id + '">' +
			'<table><tr>' +
				'<td class="table_cell_position">' + t.getPosition() + '</td>' +
				'<td class="table_cell_name">' + t.name + '</td>' +
			'</tr></table>' +
			'<table><tr>' +
				'<td class="table_cell_size">' + size + '</td>' +
				'<td class="table_cell_eta">ETA: ' + t.getEta() + '</td>' +
				'<td class="table_cell_ratio">Ratio: ' + t.getRatio() + '</td>' +
				'<td class="table_cell_peers">Peers: ' + t.num_peers + '/' + t.total_peers + '</td>' +
				'<td class="table_cell_seeds">Seeds: ' + t.num_seeds + '/' + t.total_seeds + '</td>' +
				'<td class="table_cell_label"><select class="label_select" data-torrent-id="' + t.id + '">' + cachedLabelHtml + '</select></td>' +
				'<td class="table_cell_speed">' + t.getSpeeds() + '</td>' +
			'</tr></table>' +
			'<table><tr><td class="table_cell_progress">' +
				'<div class="progress_bar">' +
					'<div class="inner ' + t.state + finished + '" style="width:' + t.getPercent() + '"></div>' +
					'<span>' + t.getPercent() + ' - ' + t.state + '</span>' +
				'</div>' +
			'</td></tr></table>' +
			'<table><tr><td class="table_cell_actions">' +
				'<div class="main_actions">' +
					'<a class="state ' + state + '" title="Pause/Resume Torrent"></a>' +
					'<a class="move_up" title="Move Torrent Up"></a>' +
					'<a class="move_down" title="Move Torrent Down"></a>' +
					'<a class="toggle_managed ' + managed + '" title="Toggle Auto-managed State"></a>' +
					'<a class="force_recheck" title="Force re-check data"></a>' +
					'<a class="delete" title="Delete Options"></a>' +
				'</div>' +
			'</td></tr></table>' +
		'</div>';
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
		$gAll.html(info.all);
		$gDown.html(info.downloading);
		$gPaused.html(info.paused);
		$gSeed.html(info.seeding);
		$gQueued.html(info.queued);
	}

	function renderTable() {
		$("#deluge_webui_link").attr("href", Deluge.endpoint());
		rebuildLabelOptions();

		// Read filters once before loop
		var fState = $("#filter_state").val();
		var fTracker = $("#filter_tracker_host").val();
		var fLabel = $("#filter_label").val();

		var torrents = Torrents.sort(localStorage.sortColumn || "position").getAll();
		if (localStorage.sortMethod === "desc") {
			torrents.reverse();
		}

		// Build all HTML in one pass
		var htmlParts = [];
		var labelValues = [];

		for (var i = 0, len = torrents.length; i < len; i++) {
			var t = torrents[i];

			// Filter with early continue (avoids deep nesting)
			if (fState !== "All" && fState !== t.state) {
				if (!(fState === "Active" && (t.speedDownload > 0 || t.speedUpload > 0))) continue;
			}
			if (fTracker !== "All" && fTracker !== t.tracker_host) {
				if (!(fTracker === "Error" && t.tracker_status.indexOf("Error") > -1)) continue;
			}
			if (fLabel !== "All" && fLabel !== t.label) continue;

			htmlParts.push(buildRowHtml(t));
			labelValues.push({ id: t.id, label: t.label || "" });
		}

		// Single DOM write
		containerEl.innerHTML = htmlParts.join("");

		// Set label dropdown values
		for (var j = 0, jlen = labelValues.length; j < jlen; j++) {
			var sel = containerEl.querySelector('.label_select[data-torrent-id="' + labelValues[j].id + '"]');
			if (sel) sel.value = labelValues[j].label;
		}
	}

	// ── Event Handlers (delegated, set up once) ─────────────────────────
	(function () {
		function getRowData(el) {
			var row = el.closest(".torrent_row");
			var id = row ? row.getAttribute("data-id") : null;
			return { torrentId: id, torrent: Torrents.getById(id) };
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
				});
		}

		// Label change
		$torrentContainer.on("change", ".label_select", function () {
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

		// Action buttons (native classList, faster than jQuery .hasClass)
		$torrentContainer.on("click", ".main_actions a", function () {
			if (this.classList.contains("delete")) return;

			var rowData = getRowData(this);
			if (!rowData.torrent) return;

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

		// Delete — show options
		$torrentContainer.on("click", ".main_actions .delete", function () {
			pauseTableRefresh();
			var $td = $(this).closest("td");
			$td.find(".main_actions").fadeOut(function () {
				$td.append(
					'<div class="delete-options">' +
						'<a class="rm_cancel" title="Cancel"></a>' +
						'<a class="rm_torrent_data" title="Delete with data"></a>' +
						'<a class="rm_torrent" title="Remove torrent only"></a>' +
					'</div>'
				).hide().fadeIn();
			});
		});

		// Delete option clicks
		$torrentContainer.on("click", ".delete-options a", function () {
			var torrent = getRowData(this).torrent;

			function removeButtons() {
				$(".delete-options").fadeOut(function () {
					resumeTableRefresh();
					$(this).closest("td").find(".main_actions").fadeIn(function () {
						updateTable();
					});
				});
			}

			if (this.classList.contains("rm_torrent")) {
				DelugeMethod("core.remove_torrent", torrent, false);
			} else if (this.classList.contains("rm_torrent_data")) {
				DelugeMethod("core.remove_torrent", torrent, true);
			}

			removeButtons();
			return false;
		});
	}());

	// ── Add Torrent Dialog ──────────────────────────────────────────────
	(function () {
		var $dialog = $("#add-torrent-dialog");
		var $inputBox = $("#manual_add_input");
		var $addButton = $("#manual_add_button");

		$("#add-torrent").click(function (e) {
			e.preventDefault();
			$dialog.show();
		});

		$dialog.click(function () { $dialog.hide(); });
		$dialog.find(".inner").click(function (e) { e.stopPropagation(); });
		$dialog.find(".close").click(function (e) { e.preventDefault(); $dialog.hide(); });

		setTimeout(function () { $("#add-torrent").blur(); }, 50);

		$inputBox.keydown(function (event) {
			if (event.keyCode === 13) {
				event.preventDefault();
				$addButton.click();
			}
		});

		$addButton.on("click", function (e) {
			e.preventDefault();
			var url = $inputBox.val();

			if (/\/(download|get)\//.test(url) || /\.torrent$/.test(url)) {
				chrome.runtime.sendMessage({ method: "add_torrent_from_url", url: url });
			} else if (/magnet:/.test(url)) {
				chrome.runtime.sendMessage({ method: "add_torrent_from_magnet", url: url });
			}

			$inputBox.val("");
			$dialog.hide();
		});
	}());

	// ── Sort & Filters ──────────────────────────────────────────────────
	(function () {
		$("#sort").val(localStorage.sortColumn || "position");
		$("#sort_invert").attr("checked", (localStorage.sortMethod === "desc"));
		$("#filter_state").val(localStorage["filter_state"] || "All");
		$("#filter_tracker_host").val(localStorage["filter_tracker_host"] || "All");
		$("#filter_label").val(localStorage["filter_label"] || "All");

		$("#sort").on("change", function () {
			localStorage.sortColumn = this.value;
			renderTable();
		});

		$("#sort_invert").on("change", function () {
			localStorage.sortMethod = this.checked ? "desc" : "asc";
			renderTable();
		});

		$("#filter_state, #filter_tracker_host, #filter_label").on("change", function () {
			localStorage[this.id] = this.value;
			renderTable();
		});
	}());

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
				var msg = (response.reason === "auth_failed")
					? chrome.i18n.getMessage("error_unauthenticated")
					: chrome.i18n.getMessage("error_generic");
				$("span", $overlay).removeClass().addClass("error").html(msg);
				$overlay.show();
			}
		});
	}

	function activated() {
		if (!extensionActivated) {
			extensionActivated = true;
			$overlay.hide();
			updateTable();
		}
	}

	function deactivated() {
		extensionActivated = false;
	}

	function autoLoginFailed() {
		$("span", $overlay).addClass("error").html(
			chrome.i18n.getMessage("error_unauthenticated")
		);
		$overlay.show();
	}

	chrome.runtime.onMessage.addListener(function (request) {
		if (request.msg === "extension_activated") activated();
		else if (request.msg === "extension_deactivated") deactivated();
		else if (request.msg === "auto_login_failed") autoLoginFailed();
	});

	checkStatus();
});
