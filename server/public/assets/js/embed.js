
var song_title = "";
var paused = false;
var player_ready = false;
var list_html = $("#list-song-html").html();
var w_p		= true;
var lazy_load	= false;
var embed = true;
var vol	= 100;
var adminpass = "";
var mobile_beginning = false;
var durationBegun = false;
var chromecastAvailable = false;
var private_channel = false;
var offline = false;
var from_frontpage = false;
var seekTo;
var socket;
var video_id;
var previous_video_id;
var hash = window.location.hash.substring(1).split("&");
var chan = hash[0];
var autoplay = false;
var color = "#808080";
var dragging = false;
var user_auth_started = false;
var user_auth_avoid = false;

var connection_options = {
	'sync disconnect on unload':true,
	'secure': true,
	'force new connection': true
};

$(document).ready(function(){

	if(hash.length == 3 && hash[2] == "autoplay"){
		autoplay = true;
	}else{
		paused = true;
	}

	$("#locked_channel").modal({
		dismissible: false
	});
	color = "#" + hash[1];
	add = "https://zoff.me";
	socket = io.connect(''+add+':8080', connection_options);

	socket.on('auth_required', function() {
		$("#locked_channel").modal('open');
	});

	socket.on("get_list", function(){
		setTimeout(function(){socket.emit('list', {channel: chan.toLowerCase(), pass: ''});},1000);
	});

	socket.on("viewers", function(view)
	{
		viewers = view;

		if(song_title !== undefined)
		Player.getTitle(song_title, viewers);
	});


	setup_youtube_listener();
	setup_list_listener();

	window.onYouTubeIframeAPIReady = Player.onYouTubeIframeAPIReady;

	Player.loadPlayer();

	Playercontrols.initSlider();

	window.setVolume = setVolume;
	$("#controls").css("background-color", color);
	$("#playlist").css("background-color", color);
});


function setup_youtube_listener(){
	socket.on("np", Player.youtube_listener);
}

function setup_list_listener(){
	socket.on("channel", List.channel_function);
}

function setVolume(val) {
	$("#volume").slider('value', val);
	Playercontrols.setVolume(val);
}

$(document).on( "click", "#zoffbutton", function(e){
	window.open("https://zoff.me/" + chan.toLowerCase() + "/", '_blank');
});

$(document).on( "click", ".vote-container", function(e){
	var id = $(this).attr("data-video-id");
	List.vote(id, "pos");
});

$(document).on("click", ".prev_page", function(e){
	e.preventDefault();
	List.dynamicContentPage(-1);
});

$(document).on("click", ".next_page", function(e){
	e.preventDefault();
	List.dynamicContentPage(1);
});
