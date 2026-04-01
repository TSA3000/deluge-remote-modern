$(function () {
	var extensionActivated = false;
	var $overlay = $("#overlay").css({ height: $(document).height() });

	const REFRESH_INTERVAL = 30000;
	var refreshTimer = Timer(REFRESH_INTERVAL);

	function progressBar(torrent) {
		var $bar = $(document.createElement("div")).addClass("progress_bar");
		$(document.createElement("div"))
			.addClass("inner")
			.addClass(torrent.state)
			.addClass((torrent.is_finished ? "finished" : ""))
			.css("width", torrent.getPercent())
			.appendTo($bar);

		$(document.createElement("span"))
			.html(torrent.getPercent() + " - " + torrent.state)
			.appendTo($bar);

		return $bar;
	}

	function actionLinks(torrent) {
		var state = torrent.state === "Paused" ? "resume" : "pause";
		var managed = torrent.autoManaged ? "managed" : "unmanaged";

		return $(document.createElement("div"))
			.addClass("main_actions")
			.append(
				$(document.createElement("a")).addClass("state").addClass(state).prop("title", "Pause/Resume Torrent"),
				$(document.createElement("a")).addClass("move_up").prop("title", "Move Torrent Up"),
				$(document.createElement("a")).addClass("move_down").prop("title", "Move Torrent Down"),
				$(document.createElement("a")).addClass("toggle_managed").addClass(managed).prop("title", "Toggle Auto-managed State"),
				$(document.createElement("a")).addClass("force_recheck").prop("title", "Force re-check data"),
				$(document.createElement("a")).addClass("delete").prop("title", "Delete Options")
			);
	}

	function updateTableDelay(ms) {
		setTimeout(updateTable, ms);
	}

	function updateTable() {
		refreshTimer.unsubscribe();
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
		refreshTimer.unsubscribe();
	}

	function resumeTableRefresh() {
		refreshTimer.unsubscribe();
		refreshTimer.subscribe(updateTable);
	}

	function renderGlobalInformation() {
		var information = Torrents.getGlobalInformation();
		var $globalInformation = $("#global-information");

		debug_log(Torrents);
		debug_log(information);

		$(".all", $globalInformation).html(information.all);
		$(".downloading", $globalInformation).html(information.downloading);
		$(".paused", $globalInformation).html(information.paused);
		$(".seeding", $globalInformation).html(information.seeding);
		$(".queued", $globalInformation).html(information.queued);
	}

	function renderTable() {
		$("#deluge_webui_link").attr("href", Deluge.endpoint());
		$("#torrent_container").empty();

		var torrents = Torrents.sort(localStorage.sortColumn || "position").getAll();
		if (localStorage.sortMethod === "desc") {
			torrents.reverse();
		}

		for (var i = 0; i < torrents.length; i++) {
			var torrent = torrents[i];

			var filter_state = $("#filter_state").val();
			var filter_tracker_host = $("#filter_tracker_host").val();
			var filter_label = $("#filter_label").val();

			if (filter_state == "All" || filter_state == torrent.state || (filter_state == "Active" && (torrent.speedDownload > 0 || torrent.speedUpload > 0))) {
				if (filter_tracker_host == "All" || filter_tracker_host == torrent.tracker_host || (filter_tracker_host == "Error" && (torrent.tracker_status.indexOf("Error") > -1))) {
					if (filter_label == "All" || filter_label == torrent.label) {

						$("#torrent_container").append($("<div>")
							.data({ id: torrent.id })
							.addClass("torrent_row")
							.append(
								$("<table>").append($("<tr>").append(
									$("<td>").addClass("table_cell_position").html(torrent.getPosition()),
									$("<td>").addClass("table_cell_name").html(torrent.name)
								)),
								$("<table>").append($("<tr>").append(
									$("<td>").addClass("table_cell_size").html((torrent.progress != 100 ? torrent.getHumanDownloadedSize() + " of " : "") + torrent.getHumanSize()),
									$("<td>").addClass("table_cell_eta").html("ETA: " + torrent.getEta()),
									$("<td>").addClass("table_cell_ratio").html("Ratio: " + torrent.getRatio()),
									$("<td>").addClass("table_cell_peers").html("Peers: " + torrent.num_peers + "/" + torrent.total_peers),
									$("<td>").addClass("table_cell_seeds").html("Seeds: " + torrent.num_seeds + "/" + torrent.total_seeds),
									$("<td>").addClass("table_cell_speed").html(torrent.getSpeeds())
								)),
								$("<table>").append($("<tr>").append(
									$("<td>").addClass("table_cell_progress").html(progressBar(torrent))
								)),
								$("<table>").append($("<tr>").append(
									$("<td>").addClass("table_cell_actions").append(actionLinks(torrent))
								))
							)
						);
					}
				}
			}
		}
	}

	(function () {
		function getRowData(element) {
			var parent = $(element).parents(".torrent_row");
			var torrentId = parent.data("id");
			var torrent = Torrents.getById(torrentId);
			return { torrentId: torrentId, torrent: torrent };
		}

		function DelugeMethod(method, torrent, rmdata) {
			pauseTableRefresh();
			var actions;
			if (method == "core.set_torrent_auto_managed") {
				actions = [torrent.id, !torrent.autoManaged];
			} else if (method == "core.remove_torrent") {
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

		$("#torrent_container").on("click", ".main_actions *", function () {
			var rowData = getRowData(this);
			var method;
			var rmdata = false;
			if ($(this).hasClass("state")) {
				method = rowData.torrent.state === "Paused" ? "core.resume_torrent" : "core.pause_torrent";
			} else if ($(this).hasClass("move_up")) {
				method = "core.queue_up";
			} else if ($(this).hasClass("move_down")) {
				method = "core.queue_down";
			} else if ($(this).hasClass("toggle_managed")) {
				method = "core.set_torrent_auto_managed";
			} else if ($(this).hasClass("force_recheck")) {
				method = "core.force_recheck";
			} else if ($(this).hasClass("rm_torrent_data")) {
				method = "core.remove_torrent";
				rmdata = true;
			} else if ($(this).hasClass("rm_torrent")) {
				method = "core.remove_torrent";
				rmdata = false;
			} else {
				return;
			}
			DelugeMethod(method, rowData.torrent, rmdata);
		});

		$("#torrent_container").on("click", ".main_actions .delete", function () {
			pauseTableRefresh();
			$(".main_actions", $(this).parents("td")).fadeOut(function () {
				$(this).parents("td").append(
					$("<div>")
						.addClass("delete-options")
						.append($("<a>").addClass("rm_cancel").prop("title", "Cancel"))
						.append($("<a>").addClass("rm_torrent_data").prop("title", "Delete with data"))
						.append($("<a>").addClass("rm_torrent").prop("title", "Remove torrent only"))
				).hide().fadeIn();
			});
		});

		$("#torrent_container").on("click", ".delete-options a", function () {
			var torrent = getRowData(this).torrent;

			function removeButtons() {
				$(".delete-options").fadeOut(function () {
					resumeTableRefresh();
					$(".main_actions", $(this).parents("td")).fadeIn(function () {
						updateTable();
					});
				});
			}

			if ($(this).hasClass("rm_cancel")) {
				// cancel
			} else if ($(this).hasClass("rm_torrent")) {
				DelugeMethod("core.remove_torrent", torrent, false);
			} else if ($(this).hasClass("rm_torrent_data")) {
				DelugeMethod("core.remove_torrent", torrent, true);
			} else {
				return false;
			}

			removeButtons();
			return false;
		});
	}());

	(function () {
		$("#add-torrent").click(function (e) {
			e.preventDefault();
			$("#add-torrent-dialog").show();
			$("#add-torrent-dialog").click(function (e) {
				$(this).hide();
			});
			$("#add-torrent-dialog .inner").click(function (e) {
				e.stopPropagation();
			});
		});

		setTimeout(function () { $("#add-torrent").blur(); }, 50);

		$("#add-torrent-dialog .close").click(function (e) {
			e.preventDefault();
			$("#add-torrent-dialog").hide();
		});

		var $inputBox = $("#manual_add_input"),
			$addButton = $("#manual_add_button");

		$inputBox.keydown(function (event) {
			if (event.keyCode === 13) {
				event.preventDefault();
				$addButton.click();
			}
		});

		$addButton.on("click", function (e) {
			e.preventDefault();
			var url = $inputBox.val();

			if (url.search(/\/(download|get)\//) > 0 || url.search(/\.torrent$/) > 0) {
				chrome.runtime.sendMessage({ method: "add_torrent_from_url", url: url });
			} else if (url.search(/magnet:/) != -1) {
				chrome.runtime.sendMessage({ method: "add_torrent_from_magnet", url: url });
			}

			$inputBox.val("");
			$("#add-torrent-dialog").hide();
		});
	}());

	$(function () {
		$("#sort").val(localStorage.sortColumn || "position");
		$("#sort_invert").attr("checked", (localStorage.sortMethod == "desc"));

		$("#filter_state").val(localStorage["filter_state"] || "All");
		$("#filter_tracker_host").val(localStorage["filter_tracker_host"] || "All");
		$("#filter_label").val(localStorage["filter_label"] || "All");

		$("#sort").on("change", function () {
			localStorage.sortColumn = $(this).val();
			renderTable();
		});

		$("#sort_invert").on("change", function () {
			localStorage.sortMethod = ($(this).is(":checked")) ? "desc" : "asc";
			renderTable();
		});

		$("#filter_state, #filter_tracker_host, #filter_label").on("change", function () {
			localStorage[$(this).attr("id")] = $(this).val();
			renderTable();
		});
	}());

	function checkStatus() {
		chrome.runtime.sendMessage({ method: "check_status" }, function (response) {
			if (chrome.runtime.lastError) {
				setTimeout(checkStatus, 2000);
				return;
			}
			if (response && response.connected) {
				activated();
			} else if (response) {
				var message;
				if (response.reason === "auth_failed") {
					message = chrome.i18n.getMessage("error_unauthenticated");
				} else {
					message = chrome.i18n.getMessage("error_generic");
				}
				$("span", $overlay).removeClass().addClass("error").html(message);
				$overlay.show();
			}
		});
	}

	function activated() {
		if (!extensionActivated) {
			debug_log("Deluge: ACTIVATED");
			extensionActivated = true;
			$overlay.hide();
			updateTable();
		}
	}

	function deactivated() {
		extensionActivated = false;
	}

	function autoLoginFailed() {
		var message = chrome.i18n.getMessage("error_unauthenticated");
		$("span", $overlay).addClass("error").html(message);
		$overlay.show();
	}

	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
		debug_log(request.msg);
		if (request.msg === "extension_activated") {
			activated();
		} else if (request.msg === "extension_deactivated") {
			deactivated();
		} else if (request.msg === "auto_login_failed") {
			autoLoginFailed();
		}
	});

	checkStatus();
});
