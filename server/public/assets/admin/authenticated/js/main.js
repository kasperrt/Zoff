var connection_options = {
	'sync disconnect on unload':true,
	'secure': true,
	'force new connection': true
};
var socket = io.connect(window.location.protocol + '//' + window.location.hostname + ':8080', connection_options);
var api_token_list;

$(document).ready(function(){
	 $('ul.tabs').tabs();
	 api_token_list = $("#api_token_list").clone();
	 $("#api_token_list").remove();
	 loaded();
 });

$(document).on("click", "#refresh_all", function(e){
	e.preventDefault();
	$("#descriptions_cont").empty();
	$("#thumbnails_cont").empty();
	$(".api_token_container").remove();
	$.ajax({
		type: "GET",
		url: "/api/api_token",
		success: function(response) {
			if(response.length == 0) {
				if(!$(".header-api-fields").hasClass("hide")) {
					$(".header-api-fields").addClass("hide");
				}
				return;
			}
			$(".header-api-fields").removeClass("hide");
			for(var i = 0; i < response.length; i++) {
				var to_add = api_token_list.clone();
                to_add.find(".api_token_limit").val(response[i].limit);
				to_add.attr("id", response[i]._id);
				to_add.find(".api_token_name").text(response[i].name);
                to_add.find(".api_token_origin").text(response[i].origin);
				to_add.find(".api_token_usage").text(response[i].usage);
				to_add.find(".update_api_token").attr("id", response[i]._id + "-update");
				to_add.find(".api_token_limit").attr("id", response[i]._id + "-limit");
				to_add.find(".delete_api_token").attr("id", response[i]._id + "-delete");
				to_add.find(".delete_api_token").attr("data-id", response[i]._id);
				to_add.find(".update_api_token").attr("data-id", response[i]._id);
                if(response[i].active) {
                    to_add.find(".check").removeClass("hide");
                } else {
                    to_add.find(".uncheck").removeClass("hide");
                }
				$("#api_keys").append(to_add);
			}
		},
		error: function(err) {
		}
	});

	if(!$(".channel_things").hasClass("hide")) {
		$(".channel_things").addClass("hide")
	}
	$(".preloader-wrapper").removeClass("hide");
	$.ajax({
		type: "GET",
		url: "/api/lists",
		success: function(response){
			var output_pinned = '<option value="" disabled>Channels</option>';
			var output_delete = '<option value="" disabled>Channels</option>';
			for(var x = 0; x < response.length; x++){
				if(response[x].count > 2){
					output_pinned += "<option class='" + response[x]._id + "' value='" + response[x]._id + "'>" + response[x]._id + "</option>";
				}
				output_delete += "<option class='" + response[x]._id + "' value='" + response[x]._id + "'>" + response[x]._id + "</option>";
			}

			$("#frontpage_pinned").html(output_pinned);
			$("#remove_thumbnail").html(output_delete);
			$("#remove_description").html(output_delete);
			$("#delete_list_name").html(output_delete);
			$("#delete_userpass_name").html(output_delete);
			$("#delete_channel_name").html(output_delete);
			$("select").material_select();
			$(".channel_things").removeClass("hide");
			if(!$(".preloader-wrapper").hasClass("hide")) {
		    	$(".preloader-wrapper").addClass("hide");
			}
		}
	});

	$.ajax({
		type: "GET",
		url: "/api/thumbnails",
		success: function(response){
			if(response.length > 0){
				$(".thumbnails-badge").removeClass("hide");
				$(".thumbnails-badge").text(response.length);
			}
			add_to_tab("thumbnails", response);
		}
	});

	$.ajax({
		type: "GET",
		url: "/api/descriptions",
		success: function(response){
			if(response.length > 0){
				$(".descriptions-badge").removeClass("hide");
				$(".descriptions-badge").text(response.length);
			}
			add_to_tab("descriptions", response);
		}
	});

	$("#listeners").empty();
	socket.emit("get_spread");
});

socket.on("spread_listeners", function(obj){
	$("#listeners").append("<p>Private listeners: " + obj.offline + "</p>");
	$("#listeners").append("<p>Total listeners: " + obj.total + "</p>");
	$("#listeners").append("<hr>");
	for(var x in obj.online_users){
		if(obj.online_users[x]._id != "total_users" && obj.online_users[x].hasOwnProperty("users") && obj.online_users[x].users.length > 0){
			$("#listeners").append("<p>" + obj.online_users[x]._id + ": " + obj.online_users[x].users.length + "</p>");
		}
	}
});

if(!$(".channel_things").hasClass("hide")) {
	$(".channel_things").addClass("hide")
}
$(".preloader-wrapper").removeClass("hide");

$(document).on("click", ".update_api_token", function(e) {
	e.preventDefault();

	var id = $(this).attr("data-id");
	var limit = $("#" + id + "-limit").val();
	var that = this;
	$(that).toggleClass("disabled");
	$("#" + id + "-delete").toggleClass("disabled");
	$.ajax({
		type: "PUT",
		url: "api/api_token",
		data: {
			id: id,
			limit: limit,
		},
		success: function(response) {
			if(response == "OK") {
				Materialize.toast("Updated limit!", 2000, "green lighten");
			} else {
				Materialize.toast("Something went wrong...", 2000, "red lighten");
			}
			$(that).toggleClass("disabled");
			$("#" + id + "-delete").toggleClass("disabled");
		}
	});
});

$(document).on("click", ".delete_api_token", function(e) {
	e.preventDefault();
	var id = $(this).attr("data-id");
	var that = this;
	$(that).toggleClass("disabled");
	$("#" + id + "-limit").toggleClass("disabled");
	$.ajax({
		type: "DELETE",
		url: "api/api_token",
		data: {
			id: id
		},
		success: function(response) {
			if(response == "success") {
				Materialize.toast("Removed token!", 2000, "green lighten");
				$("#" + id).remove();
			} else {
				Materialize.toast("Something went wrong...", 2000, "red lighten");
				$(that).toggleClass("disabled");
				$("#" + id + "-limit").toggleClass("disabled");
			}
		},
	});
});

function loaded() {
	$.ajax({
		type: "GET",
		url: "/api/api_token",
		success: function(response) {
			if(response.length == 0) {
				if(!$(".header-api-fields").hasClass("hide")) {
					$(".header-api-fields").addClass("hide");
				}
				return;
			}
			$(".header-api-fields").removeClass("hide");
			for(var i = 0; i < response.length; i++) {
				var to_add = api_token_list.clone();
                to_add.find(".api_token_limit").val(response[i].limit);
				to_add.attr("id", response[i]._id);
				to_add.find(".api_token_name").text(response[i].name);
				to_add.find(".api_token_usage").text(response[i].usage);
                to_add.find(".api_token_origin").text(response[i].origin);
				to_add.find(".update_api_token").attr("id", response[i]._id + "-update");
				to_add.find(".api_token_limit").attr("id", response[i]._id + "-limit");
				to_add.find(".delete_api_token").attr("id", response[i]._id + "-delete");
				to_add.find(".delete_api_token").attr("data-id", response[i]._id);
				to_add.find(".update_api_token").attr("data-id", response[i]._id);
				if(response[i].active) {
                    to_add.find(".check").removeClass("hide");
                } else {
                    to_add.find(".uncheck").removeClass("hide");
                }
				$("#api_keys").append(to_add);
			}
		},
		error: function(err) {
		}
	});

	$.ajax({
		type: "GET",
		url: "/api/lists",
		success: function(response){
			var output_pinned = '<option value="" disabled selected>Channels</option>';
			var output_delete = '<option value="" disabled selected>Channels</option>';
			for(var x = 0; x < response.length; x++){
				if(response[x].count > 2){
					output_pinned += "<option class='" + response[x]._id + "' value='" + response[x]._id + "'>" + response[x]._id + "</option>";
				}
				output_delete += "<option class='" + response[x]._id + "' value='" + response[x]._id + "'>" + response[x]._id + "</option>";
			}

			$("#frontpage_pinned").html(output_pinned);
			$("#remove_thumbnail").html(output_delete);
			$("#remove_description").html(output_delete);
			$("#delete_list_name").html(output_delete);
			$("#delete_userpass_name").html(output_delete);
			$("#delete_channel_name").html(output_delete);
			$("select").material_select();

			if(!$(".preloader-wrapper").hasClass("hide")) {
				$(".preloader-wrapper").addClass("hide")
			}
			$(".channel_things").removeClass("hide");
		}
	});

	$.ajax({
	    type: "GET",
	    url: "/api/names",
	    success: function(response) {
			for(var i = 0; i < response.length; i++) {
				var icon = "";
				if(response[i].icon && response[i].icon != "") {
					icon = "<img class='chat-icon' src='" + response[i].icon + "' alt='" + response[i]._id + "'>";
				}
				$(".names-container").append("<div class='col s12'><div class='name-chat col s3'>" + icon + response[i]._id + "</div><input type='text' class='" + response[i]._id + "_input col s7'><a class='btn green waves-effect col s2 m1 approve_name' href='#' data-name='" + response[i]._id + "'><i class='material-icons'>check</i></a></div>");
			}
	    },
	});

	$.ajax({
		type: "GET",
		url: "/api/thumbnails",
		success: function(response){
			if(response.length > 0){
				$(".thumbnails-badge").removeClass("hide");
				$(".thumbnails-badge").text(response.length);
			}
			add_to_tab("thumbnails", response);
		}
	});

	$.ajax({
		type: "GET",
		url: "/api/descriptions",
		success: function(response){
			if(response.length > 0){
				$(".descriptions-badge").removeClass("hide");
				$(".descriptions-badge").text(response.length);
			}
			add_to_tab("descriptions", response);
		}
	});
}

$(document).on("click", ".approve_name", function(e) {
	var that = this;
	var name = $(that).attr("data-name");
	var value = $("." + name + "_input").val();
	$.ajax({
		type: "POST",
		url: "/api/names",
		data: {
			icon: value,
			name: name,
		},
		success: function(resp) {
			if(resp == true) {
				Materialize.toast("Approved image!", 2000, "green lighten");
			} else {
				Materialize.toast("Something went wrong...", 2000, "red lighten");
			}
		}
	});
});

$(document).on("click", ".thumbnail_link", function(e) {
	e.preventDefault();
	window.open("https:" + this.value,'_blank');
});

function add_to_tab(dest, resp){
	for(var x = 0; x < resp.length; x++){
		if(dest == "thumbnails"){
			$("#" + dest + "_cont").append("<div><div class='col s4 m3'>" + resp[x].channel + "</div><input type='text' readonly class='col s4 m6 thumbnail_link' value='" + resp[x].thumbnail + "'><a class='btn green waves-effect col s2 m1 approve_" + dest + "' href='#' data-channel='" + resp[x].channel + "'><i class='material-icons'>check</i></a><a class='btn red waves-effect col s2 m1 deny_" + dest + "' href='#' data-channel='" + resp[x].channel + "'>X</a></div>");
		} else {
			$("#" + dest + "_cont").append("<div><div class='col s4 m3'>" + resp[x].channel + "</div><input type='text' readonly class='col s4 m6' value='" + resp[x].description + "'><a class='btn green waves-effect col s2 m1 approve_" + dest + "' href='#' data-channel='" + resp[x].channel + "'><i class='material-icons'>check</i></a><a class='btn red waves-effect col s2 m1 deny_" + dest + "' href='#' data-channel='" + resp[x].channel + "'>X</a></div>");
		}
	}
}

$(document).on("click", "#get_token", function(e){
	e.preventDefault();
	$.ajax({
		type: "GET",
		url: "/api/token",
		success: function(response){
			if(response != false){
				$("#new_token").val(response.token);
				$("#get_token").toggleClass("hide");
				$("#remove_token").toggleClass("hide");
			}
		}
	})
});

$(document).on("click", "#get_api_token", function(e){
	e.preventDefault();
	var name = $("#new_api_token_name").val();
	if(name == "") {
		Materialize.toast("Empty name..!", 2000, "red lighten");
		return;
	}
	$("#new_api_token_name").val("");
	$("#get_api_token").toggleClass("disabled");
	$.ajax({
		type: "POST",
		url: "/api/api_token",
		data: {
			name: name,
		},
		success: function(response){
			if(response != false){
				Materialize.toast("Gotten token", 2000, "green lighten");
				$("#new_api_token").val(response.token);
				$("#get_api_token").toggleClass("disabled");
				var to_add = api_token_list;
				to_add.attr("id", response._id);
				to_add.find(".api_token_name").text(name);
				to_add.find(".api_token_usage").text(0);
				to_add.find("#delete_api_token").attr("data-id", response._id);
				$(".channel_things").append(to_add);
			}
		}
	})
});

$(document).on("click", ".approve_thumbnails", function(e){
	e.preventDefault();
	var channel = $(this).attr("data-channel");
	if(!channel) {
		Materialize.toast("Something went wrong...", 2000, "red lighten");
		return;
	}
	var that = this;
	$.ajax({
		type: "POST",
		url: "/api/approve_thumbnail",
		data: {
			channel: channel
		},
		success: function(response){
			if(response){
				$(that).parent().remove();
				var length = parseInt($(".thumbnails-badge").text());
				length = length - 1;
				$(".thumbnails-badge").text(length);
				if(length <= 0 && !$(".thumbnails-badge").hasClass("hide")){
					$(".thumbnails-badge").addClass("hide");
				}
				Materialize.toast("Approved Thumbnail!", 2000, "green lighten");
			} else {
				Materialize.toast("Something went wrong...", 2000, "red lighten");
			}
		}
	});
});

$(document).on("click", ".deny_thumbnails", function(e){
	e.preventDefault();
	var channel = $(this).attr("data-channel");
	if(!channel) {
		Materialize.toast("Something went wrong...", 2000, "red lighten");
		return;
	}
	var that = this;
	$.ajax({
		type: "POST",
		url: "/api/deny_thumbnail",
		data: {
			channel: channel
		},
		success: function(response){
			if(response){
				$(that).parent().remove();
				var length = parseInt($(".thumbnails-badge").text());
				length = length - 1;
				$(".thumbnails-badge").text(length);
				if(length <= 0 && !$(".thumbnails-badge").hasClass("hide")){
					$(".thumbnails-badge").addClass("hide");
				}
				Materialize.toast("Denied thumbnail!", 2000, "green lighten");
			} else {
				Materialize.toast("Something went wrong...", 2000, "red lighten");
			}
		}
	});
});

$(document).on("click", ".approve_descriptions", function(e){
	e.preventDefault();
	var channel = $(this).attr("data-channel");
	if(!channel) {
		Materialize.toast("Something went wrong...", 2000, "red lighten");
		return;
	}
	var that = this;
	$.ajax({
		type: "POST",
		url: "/api/approve_description",
		data: {
			channel: channel
		},
		success: function(response){
			if(response){
				$(that).parent().remove();
				var length = parseInt($(".descriptions-badge").text());
				length = length - 1;
				$(".descriptions-badge").text(length);
				if(length <= 0 && !$(".descriptions-badge").hasClass("hide")){
					$(".descriptions-badge").addClass("hide");
				}
				Materialize.toast("Approved description!", 2000, "green lighten");
			} else {
				Materialize.toast("Something went wrong...", 2000, "red lighten");
			}
		}
	});
});

$(document).on("click", ".deny_descriptions", function(e){
	e.preventDefault();
	var channel = $(this).attr("data-channel");
	if(!channel) {
		Materialize.toast("Something went wrong...", 2000, "red lighten");
		return;
	}
	var that = this;
	$.ajax({
		type: "POST",
		url: "/api/deny_description",
		data: {
			channel: channel
		},
		success: function(response){
			if(response){
				$(that).parent().remove();
				var length = parseInt($(".descriptions-badge").text());
				length = length - 1;
				$(".descriptions-badge").text(length);
				if(length <= 0 && !$(".descriptions-badge").hasClass("hide")){
					$(".descriptions-badge").addClass("hide");
				}
				Materialize.toast("Denied description!", 2000, "green lighten");
			} else {
				Materialize.toast("Something went wrong...", 2000, "red lighten");
			}
		}
	});
});

$(document).on("click", "#remove_description_button", function(e){
	e.preventDefault();
	var channel = $("#remove_description").val();
	if(!channel) {
		Materialize.toast("Something went wrong...", 2000, "red lighten");
		return;
	}
	var that = this;
	$.ajax({
		type: "POST",
		url: "/api/remove_description",
		data: {
			channel: channel
		},
		success: function(response){
			if(response){
				Materialize.toast("Removed description!", 2000, "green lighten");
			} else {
				Materialize.toast("Something went wrong...", 2000, "red lighten");
			}
		}
	});
});

$(document).on("click", "#remove_thumbnail_button", function(e){
	e.preventDefault();
	var channel = $("#remove_thumbnail").val();
	if(!channel) {
		Materialize.toast("Something went wrong...", 2000, "red lighten");
		return;
	}
	var that = this;
	$.ajax({
		type: "POST",
		url: "/api/remove_thumbnail",
		data: {
			channel: channel
		},
		success: function(response){
			if(response){
				Materialize.toast("Removed thumbnail!", 2000, "green lighten");
			} else {
				Materialize.toast("Something went wrong...", 2000, "red lighten");
			}
		}
	});
});

$(document).on("submit", "#delete_channel", function(e){
	e.preventDefault();
	var to_delete = $("#delete_channel_name").val();
	if(!to_delete) {
		Materialize.toast("Something went wrong...", 2000, "red lighten");
		return;
	}
	var r = confirm("Delete list " + to_delete + "?");
	if (r == true) {
		$.ajax({
			type: "POST",
			url: "/api/delete",
			data: {
				_id: to_delete
			},
			success: function(response){
				if(response == true){
					$.ajax({
						type: "GET",
						url: "/api/lists",
						success: function(response){
							var output_pinned = "";
							var output_delete = "";
							for(var x = 0; x < response.length; x++){
								if(response[x].count > 5){
									output_pinned += "<option class='" + response[x]._id + "' value='" + response[x]._id + "'>" + response[x]._id + "</option>";
								}
								output_delete += "<option class='" + response[x]._id + "' value='" + response[x]._id + "'>" + response[x]._id + "</option>";
							}

							$("#frontpage_pinned").html(output_pinned);
							$("#delete_list_name").html(output_delete);
							$("#delete_userpass_name").html(output_delete);
							$("#delete_channel_name").html(output_delete);
							$("select").material_select();
						}
					});
					Materialize.toast("Deleted channel!", 2000, "green lighten");
				} else {
					Materialize.toast("Something went wrong...", 2000, "red lighten");
				}
			}
		})
	}
});

$(document).on("click", "#delete_channel_button", function(e){
	e.preventDefault();
	$("#delete_channel").submit();
});

$(document).on("click", "#remove_token", function(e){
	e.preventDefault();
	$.ajax({
		type: "GET",
		url: "/api/remove_token",
		success: function(response){
			if(response != false){
				$("#new_token").val("");
				$("#get_token").toggleClass("hide");
				$("#remove_token").toggleClass("hide");
			}
		}
	})
});

$(document).on("submit", "#change_pinned", function(e){
	e.preventDefault();
	var to_pin = $("#frontpage_pinned").val();
	if(!to_pin) {
		Materialize.toast("Something went wrong...", 2000, "red lighten");
		return;
	}
	$.ajax({
		type: "POST",
		url: "/api/pinned",
		data: {
			_id: to_pin
		},
		success: function(response){
			if(response == true){
				Materialize.toast("Pinned channel!", 2000, "green lighten");
			} else {
				Materialize.toast("Something went wrong...", 2000, "red lighten");
			}
		}
	})
});

$(document).on("click", "#change_pinned_button", function(){
	$("#change_pinned").submit();
});

$(document).on("click", "#delete_admin_button", function(){
	$("#delete_list").submit();
});

$(document).on("click", "#delete_userpass_button", function(){
	$("#delete_userpass").submit();
});

$(document).on("submit", "#delete_list", function(e){
	e.preventDefault();
	var to_remove_password = $("#delete_list_name").val();
	if(!to_remove_password) {
		Materialize.toast("Something went wrong...", 2000, "red lighten");
		return;
	}
	$.ajax({
		type: "POST",
		url: "/api/admin",
		data: {
			_id: to_remove_password
		},
		success: function(response){
			if(response == true){
				Materialize.toast("Removed admin password!", 2000, "green lighten");
			} else {
				Materialize.toast("Something went wrong...", 2000, "red lighten");
			}
		}
	})
});

$(document).on("submit", "#delete_userpass", function(e){
	e.preventDefault();
	var to_remove_password = $("#delete_userpass_name").val();
	if(!to_remove_password) {
		Materialize.toast("Something went wrong...", 2000, "red lighten");
		return;
	}
	$.ajax({
		type: "POST",
		url: "/api/userpass",
		data: {
			_id: to_remove_password
		},
		success: function(response){
			if(response == true){
				Materialize.toast("Removed userpass password!", 2000, "green lighten");
			} else {
				Materialize.toast("Something went wrong...", 2000, "red lighten");
			}
		}
	})
});

socket.emit("get_spread");
