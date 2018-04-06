var Search = {

    submitArray: [],
    submitArrayExpected: null,
    submitYouTubeArrayIds: [],
    submitYouTubeArray: [],
    submitYouTubeExpected: 0,
    submitYouTubeError: false,

    showSearch: function(){
        $("#search-wrapper").toggleClass("hide");
        if(Helper.mobilecheck())
        {
            $(".search_input").focus();
        }
        $("#song-title").toggleClass("hide");
        //$("#results").empty();
        if($("#search-btn i").html() == "close") {
            $("body").attr("style", "overflow-y:auto")
            $("#results").slideUp({
                complete: function() {
                    $("#results").empty();
                }
            });
            $(".search_input").val("");
            $("#search-btn i").html("search");
        } else {
            $("#search-btn i").html("close");
        }
        $("#search").focus();

    },

    search: function(search_input, retried, related, pagination){
        if(result_html === undefined || empty_results_html === undefined) {
            result_html = $("#temp-results-container");
            empty_results_html = $("#empty-results-container").html();
        }
        if(!pagination && $("#inner-results").length == 0) {
            $(".search_results").html('');
        }
        if(search_input !== ""){
            searching = true;
            var keyword= encodeURIComponent(search_input);
            var yt_url = "https://www.googleapis.com/youtube/v3/search?key="+api_key+"&videoEmbeddable=true&part=id&type=video&order=relevance&safeSearch=none&maxResults=25";
            yt_url+="&q="+keyword;
            if(music)yt_url+="&videoCategoryId=10";
            if(pagination) yt_url += "&pageToken=" + pagination;
            var vid_url = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,id&key="+api_key+"&id=";
            if(related) {
                var yt_url 	= "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&relatedToVideoId="+keyword+"&type=video&key="+api_key;
                var vid_url	= "https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,id&key="+api_key+"&id=";
            }

            if(!Helper.contains($(".search_loader_spinner").attr("class").split(" "), "active"))
            $(".search_loader_spinner").addClass("active");

            if(Helper.contains($("#results").attr("class").split(" "), "hide"))
            $("#results").removeClass("hide");

            $.ajax({
                type: "GET",
                url: yt_url,
                dataType:"jsonp",
                success: function(response){
                    var nextPageToken = response.nextPageToken;
                    var prevPageToken = response.prevPageToken;
                    if(response.items.length === 0) {
                        $("#results").empty();
                        $("#results").css("display", "block");
                        $("<div style='display:none;' id='inner-results' class='empty-inner-results'>"+empty_results_html+"</div>").appendTo($("#results")).show("blind", 83.33);
                        if(Helper.contains($(".search_loader_spinner").attr("class").split(" "), "active"))
                        $(".search_loader_spinner").removeClass("active");

                    } else if(response.items){
                        $.each(response.items, function(i,data) {
                            vid_url += data.id.videoId+",";
                        });

                        $.ajax({
                            type: "GET",
                            url: vid_url,
                            dataType:"jsonp",
                            success: function(response){

                                var output = "";
                                var pre_result = $(result_html);

                                //$("#results").append(result_html);

                                $.each(response.items, function(i,song)
                                {
                                    var duration=song.contentDetails.duration;
                                    secs=Search.durationToSeconds(duration);
                                    var _temp_duration = Helper.secondsToOther(secs);
                                    if(!longsongs || secs<720){
                                        title=song.snippet.title;
                                        enc_title=title;//encodeURIComponent(title).replace(/'/g, "\\\'");
                                        id=song.id;
                                        duration = duration.replace("PT","").replace("H","h ").replace("M","m ").replace("S","s");
                                        thumb=song.snippet.thumbnails.medium.url;

                                        //$("#results").append(result_html);
                                        var songs = pre_result;
                                        songs.find(".search-title").text(title);
                                        songs.find(".result_info").text(Helper.pad(_temp_duration[0]) + ":" + Helper.pad(_temp_duration[1]));
                                        songs.find(".thumb").attr("src", thumb);
                                        //songs.find(".add-many").attr("onclick", "submit('"+id+"','"+enc_title+"',"+secs+");");
                                        songs.find("#add-many").attr("data-video-id", id);
                                        songs.find("#add-many").attr("data-video-title", enc_title);
                                        songs.find("#add-many").attr("data-video-length", secs);
                                        //$($(songs).find("div")[0]).attr("onclick", "submitAndClose('"+id+"','"+enc_title+"',"+secs+");");
                                        songs.find("#temp-results").attr("data-video-id", id);
                                        songs.find("#temp-results").attr("data-video-title", enc_title);
                                        songs.find("#temp-results").attr("data-video-length", secs);
                                        songs.find(".open-externally").attr("href", "https://www.youtube.com/watch?v=" + id);
                                        $(songs.find(".result-end")).attr("value", secs);
                                        //$($(songs).find("div")[0]).attr("id", id)
                                        //output += undefined;
                                        if(songs.html() != undefined) {
                                            output += songs.html();
                                        }
                                    }
                                });
                                var fresh = false;
                                if($("#inner-results").length == 0) {
                                    fresh = true;
                                }
                                $(".search_results").empty();
                                if(output.length > 0) {
                                    //$(window).scrollTop(0);
                                    if(!pagination && fresh) {
                                        $(".search_results").css("display", "none");
                                    }
                                    $("#results").append(pagination_buttons_html);
                                    $("<div id='inner-results'>"+output+"</div>").prependTo($("#results"));
                                    if(!pagination && fresh) {
                                        $(".search_results").slideDown();
                                    }
                                    $("body").attr("style", "overflow-y:hidden !important")

                                    if(nextPageToken) {
                                        $(".next-results-button").attr("data-pagination", nextPageToken);
                                    } else {
                                        $(".next-results-button").addClass("disabled");
                                    }
                                    if(prevPageToken) {
                                        $(".prev-results-button").attr("data-pagination", prevPageToken);
                                    } else {
                                        $(".prev-results-button").addClass("disabled");
                                    }

                                    $(".pagination-results a").attr("data-original-search", search_input);

                                    //setTimeout(function(){$(".thumb").lazyload({container: $("#results")});}, 250);

                                    if(Helper.contains($(".search_loader_spinner").attr("class").split(" "), "active"))
                                    $(".search_loader_spinner").removeClass("active");

                                    $(".add-many").click(function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return false;
                                    });
                                } else if(!retried){
                                    Search.search(search_input, true);
                                } else {
                                    $("<div style='display:none;' id='inner-results'>"+empty_results_html+"</div>").appendTo($("#results")).show("blind", 83.33);
                                    if(Helper.contains($(".search_loader_spinner").attr("class").split(" "), "active"))
                                    $(".search_loader_spinner").removeClass("active");
                                }
                            }
                        });
                    }
                }
            });
        } else {
            $(".main").removeClass("blurT");
            $("#controls").removeClass("blurT");
            $(".main").removeClass("clickthrough");
        }
    },

    backgroundSearch: function(title, artist, length, totalNumber, current){
        var keyword= encodeURIComponent(title + " " + artist);
        var yt_url = "https://www.googleapis.com/youtube/v3/search?key="+api_key+"&videoEmbeddable=true&part=id,snippet&fields=items(id,snippet)&type=video&order=relevance&safeSearch=none&maxResults=10&videoCategoryId=10";
        yt_url+="&q="+keyword;
        var vid_url = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,id&key="+api_key+"&id=";
        artist = artist.split(" ");
        var temptitle = title.split("-");
        temptitle = temptitle.join(" ").split(" ");
        $.ajax({
            type: "GET",
            url: yt_url,
            dataType:"jsonp",
            success: function(response){
                //Helper.log(response);
                if(response.items.length === 0){
                    Search.readySubmit(false, {totalLength: totalNumber - 1});
                    Helper.log([
                        "NO MATCH FOR:",
                        "Spotify title: " + title + " " + artist.join(" "),
                        "Spotify length: " + length
                    ]);
                    var not_added_song = $("<div>" + not_import_html + "</div>");
                    not_added_song.find(".extra-add-text").text(title + " - " + artist.join(" "));
                    not_added_song.find(".extra-add-text").attr("title", title + " - " + artist.join(" "));
                    not_added_song.find(".extra-button-search").attr("data-text", title + " - " + artist.join(" "));
                    $(".not-imported-container").append(not_added_song.html());
                    $(".not-imported").removeClass("hide");
                } else if(response.items.length > 0) {
                    $.each(response.items, function(i,data)
                    {
                        vid_url += data.id.videoId+",";
                    });

                    $.ajax({
                        type: "GET",
                        url: vid_url,
                        dataType:"jsonp",
                        success: function(response){
                            if(response.items.length > 0) {
                                var matched = false;
                                $.each(response.items, function(i, data){
                                    //Helper.log(data);
                                    //var title = data.snippet.title;
                                    var duration = Search.durationToSeconds(data.contentDetails.duration);
                                    var not_matched = false;
                                    if(similarity(data.snippet.title, artist + " - " + title) > 0.75) {
                                        not_matched = false;
                                    } else {
                                        $.each(temptitle, function(i, data_title){
                                            if(data.snippet.title.toLowerCase().indexOf(data_title.toLowerCase()) == -1 || !(
                                                data.snippet.title.toLowerCase().indexOf("cover") == -1 &&
                                                title.toLowerCase().indexOf("cover") == -1 &&
                                                ((data.snippet.title.toLowerCase().indexOf("remix") == -1 &&
                                                title.toLowerCase().indexOf("remix") == -1) ||
                                                (data.snippet.title.toLowerCase().indexOf("remix") != -1 &&
                                                title.toLowerCase().indexOf("remix") != -1) || !(data.snippet.title.toLowerCase().indexOf(artist[0].toLowerCase()) == -1 &&
                                                (data.snippet.channelTitle.toLowerCase().indexOf(artist[0].toLowerCase()) == -1 &&
                                                data.snippet.channelTitle.toLowerCase().indexOf("vevo") == -1)))
                                            ))
                                            not_matched = true;
                                            else if(duration > 1800) not_matched = true;

                                            return false;
                                        });
                                    }

                                    if((!not_matched)){
                                        matched = true;
                                        Search.readySubmit(true, { id: data.id, title: data.snippet.title, duration: duration, totalLength: totalNumber - 1});
                                        return false;
                                    }
                                });
                                if(!matched){
                                    Search.readySubmit(false, {totalLength: totalNumber - 1});
                                    Helper.log([
                                        "NO MATCH FOR:",
                                        "Spotify title: " + title + " " + artist.join(" "),
                                        "Spotify length: " + length
                                    ]);
                                    var not_added_song = $("<div>" + not_import_html + "</div>");
                                    not_added_song.find(".extra-add-text").text(title + " - " + artist.join(" "));
                                    not_added_song.find(".extra-add-text").attr("title", title + " - " + artist.join(" "));
                                    not_added_song.find(".extra-button-search").attr("data-text", title + " - " + artist.join(" "));
                                    $(".not-imported-container").append(not_added_song.html());
                                    $(".not-imported").removeClass("hide");
                                }
                            }
                        }
                    });

                }
            }
        });
    },

    readySubmit: function(found, obj){
        if(Search.submitArrayExpected === null){
            Search.submitArrayExpected = obj.totalLength;
        }
        if(found){
            Search.submitArray.push(obj);
        } else {
            Search.submitArrayExpected -= 1;
        }
        if((Search.submitArray.length - 1) == Search.submitArrayExpected) {
            socket.emit("addPlaylist", {channel: chan.toLowerCase(), songs: Search.submitArray});
            /*$.each(Search.submitArray, function(i, data){
                Search.submit(data.id, data.title, data.duration, true, i, Search.submitArray.length - 1, 0, data.duration);
            });*/
            document.getElementById("import_spotify").disabled = false;
            $("#import_spotify").removeClass("hide");
            $("#playlist_loader_spotify").addClass("hide");
            Search.submitArray = [];
            Search.submitArrayExpected = null;
        }
    },

    submitAndClose: function(id,title,duration, start, end){
        Search.submit(id,title, duration, false, 0, 1, start, end);
        $("#results").html('');
        Search.showSearch();
        document.getElementById("search").value = "";
        $("body").attr("style", "overflow-y:auto")
        $("#results").html = "";
        $(".main").removeClass("blurT");
        $("#controls").removeClass("blurT");
        $(".main").removeClass("clickthrough");
    },

    importPlaylist: function(pId,pageToken){
        token = "";
        var headers;
        var datatype;
        if(pageToken !== undefined)
        token = "&pageToken="+pageToken;
        playlist_url = "https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=49&key="+api_key+"&playlistId="+pId+token;
        if(youtube_authenticated) {
            datatype = "html";
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token_data_youtube.access_token
            };
        } else {
            headers = {};//'Content-Type': 'application/json'};
            datatype = "jsonp";
        }
        $.ajax({
            type: "GET",
            url: playlist_url,
            dataType: datatype,
            //dataType:"jsonp",
            headers: headers,
            success: function(response) {
                if(response.error){
                    if(response.error.errors[0].reason == "playlistItemsNotAccessible"){
                        var nonce = Helper.randomString(29);
                        window.callback = function(data) {
                            access_token_data_youtube = data;
                            if(access_token_data_youtube.state == nonce){
                                youtube_authenticated = true;
                                setTimeout(function(){
                                    youtube_authenticated = false;
                                    access_token_data_youtube = {};
                                }, access_token_data_youtube.expires_in * 1000);
                                Search.importPlaylist(pId, pageToken);
                            } else {
                                access_token_data_youtube = "";
                                console.error("Nonce doesn't match");
                            }
                            youtube_window.close();
                            window.callback = "";
                        };
                        youtube_window = window.open("/o_callback#youtube=true&nonce=" + nonce, "", "width=600, height=600");
                    } else {
                        Helper.log([
                            "import list error: ",
                            response.error
                        ]);
                        document.getElementById("import").disabled = false;
                        $("#playlist_loader").addClass("hide");
                        $("#import").removeClass("hide");
                        before_toast();
                        M.toast({html: "It seems you've entered a invalid url.", displayLength: 4000});
                    }

                }  else {
                    var ids="";
                    var this_length = 0;
                    if(typeof(response) == "string") response = $.parseJSON(response);
                    //Search.addVideos(response.items[0].contentDetails.videoId);
                    //response.items.shift();
                    $.each(response.items, function(i,data) {
                        ids+=data.contentDetails.videoId+",";
                        Search.submitYouTubeArrayIds.push(data.contentDetails.videoId);
                        this_length += 1;
                        Search.submitYouTubeExpected += 1;
                    });

                    if(response.nextPageToken) {
                        //Search.addVideos(ids, true, 0, false, this_length);
                        Search.importPlaylist(pId, response.nextPageToken);
                    } else {
                        Search.addVideos(Search.submitYouTubeArrayIds);
                        //Search.addVideos(ids, true, Search.submitYouTubeExpected, true, this_length);
                        //Search.submitYouTubeExpected = 0;
                    }
                    document.getElementById("import").value = "";
                }
            }
        });
    },

    importSpotifyPlaylist: function(url){
        $.ajax({
            url: url,
            headers: {
                'Authorization': 'Bearer ' + access_token_data.access_token
            },
            success: function(response) {
                $.each(response.items, function(i,data)
                {
                    //ids+=data.contentDetails.videoId+",";
                    Search.backgroundSearch(data.track.name, data.track.artists.map(function(elem){return elem.name;}).join(" "), Math.floor(data.track.duration_ms/1000), response.total, i + response.offset);

                });
                if(response.next){
                    Search.importSpotifyPlaylist(response.next);
                }
            },
            error: function() {
                document.getElementById("import_spotify").disabled = false;
                $("#import_spotify").removeClass("hide");
                $("#playlist_loader_spotify").addClass("hide");
                before_toast();
                M.toast({html: "It seems you've entered a invalid url.", displayLength: 4000});
            }
        });
    },

    addVideos: function(ids){
        var more = false;
        var next_ids = [];
        var request_url="https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,id&key=AIzaSyBSxgDrvIaKR2c_MK5fk6S01Oe7bd_qGd8&id=";
        for(var i = 0; i < ids.length; i++) {
            if(i > 48) {
                more = true;
                next_ids = ids.slice(i, ids.length);
                break;
            }
            request_url += ids[i] + ",";
        }

        $.ajax({
            type: "POST",
            url: request_url,
            dataType:"jsonp",
            success: function(response){
                var x = 0;
                if(response.error) {
                    Search.submitYouTubeError = true;
                }
                $.each(response.items, function(i,song) {
                    var duration=Search.durationToSeconds(song.contentDetails.duration);
                    if(!longsongs || duration<720){
                        enc_title= song.snippet.title;//encodeURIComponent(song.snippet.title);
                        //Search.submit(song.id, enc_title, duration, playlist, i);
                        x += 1;
                        Search.submitYouTubeArray.push({id: song.id, title: enc_title, duration: duration});
                    }
                });
                if(more) Search.addVideos(next_ids);
                else {
                    socket.emit("addPlaylist", {channel: chan.toLowerCase(), songs: Search.submitYouTubeArray});
                    Search.submitYouTubeArray = [];
                    Search.submitYouTubeExpected = 0;
                }
            }
        });
    },

    submit: function(id,title,duration, playlist, num, full_num, start, end){
        if((client || Helper.mobilecheck()) && !socket_connected) {
            add_ajax(id, title, duration, playlist, num, full_num, start, end);
            return;
        }
        if(offline && document.getElementsByName("addsongs")[0].checked && document.getElementsByName("addsongs")[0].disabled){
            var found_array = [];
            found_array = $.map(full_playlist, function(obj, index) {
                if(obj.id == id) {
                    return index;
                }
            });
            if(found_array.length == 0){
                List.channel_function({type: "added", start: start, end: end, value: {added: (new Date).getTime()/1000, guids: [1], id: id, title: title, duration: duration, now_playing: false, votes: 1}});
            } else {
                List.vote(id, "pos");
            }
        } else {
            /*var u = Crypt.crypt_pass(Crypt.get_userpass(chan.toLowerCase()), true);
            if(u == undefined) u = "";*/
            emit("add", {id: id, start: start, end: end, title: title, list: chan.toLowerCase(), duration: duration});
        }//[id, decodeURIComponent(title), adminpass, duration, playlist]);
    },

    durationToSeconds: function(duration) {
        var matches = duration.match(time_regex);
        hours= parseInt(matches[12])||0;
        minutes= parseInt(matches[14])||0;
        seconds= parseInt(matches[16])||0;
        return hours*60*60+minutes*60+seconds;
    }
};
