var Admin = {

    beginning:true,

    pw: function(msg) {
        if(!msg) return;
        w_p = false;
        if(adminpass == undefined || adminpass == "") {
            adminpass = Crypt.get_pass(chan.toLowerCase());
        }
        names     = ["vote","addsongs","longsongs","frontpage", "allvideos",
        "removeplay", "skip", "shuffle", "userpass"];
        Crypt.set_pass(chan.toLowerCase(), Crypt.tmp_pass);

        for (var i = 0; i < names.length; i++) {
            $("input[name="+names[i]+"]").attr("disabled", false);
        }

        $(".card-action").removeClass("hide");
        $("#admin-lock").addClass("clickable");
        $("#admin-lock").html("lock_open");
        if(!Helper.mobilecheck()){
            $('#admin-lock').tooltip({
                delay: 5,
                position: "left",
                tooltip: "Logout"
            });
        }
        $("#password").val("");
        $("#password").attr("placeholder", "Change admin password");
        $(".user-password-li").removeClass("hide");
        $(".delete-all").removeClass("hide");
        if($(".password_protected").prop("checked")) {
            $(".change_user_pass").removeClass("hide");
        }
        if(!client) {
            if(!Helper.contains($(".playlist-tabs").attr("class").split(" "), "hide")) {
                $(".playlist-tabs-loggedIn").removeClass("hide");
                $(".playlist-tabs").addClass("hide");
            }
            if($(".tabs").length > 0 && !changing_to_frontpage) {
                $('ul.playlist-tabs-loggedIn').tabs('select_tab', $(".playlist-tabs li a.active").attr("href").substring(1));
            }
        }
        if($("#admin-lock").html() != "lock_open"){
            $("#admin-lock").addClass("clickable");
            $("#admin-lock").html("lock_open");
            if(!Helper.mobilecheck()){
                $('#admin-lock').tooltip({
                    delay: 5,
                    position: "left",
                    tooltip: "Logout"
                });
            }
        }
    },

    conf: function(msg) {
        if(msg[0].adminpass == ""){
            Crypt.remove_pass(chan.toLowerCase());
        }
        Admin.set_conf(msg[0]);
        if(msg[0].adminpass !== "" && (Crypt.get_pass(chan.toLowerCase()) !== undefined && Admin.beginning && Crypt.get_pass(chan.toLowerCase()) !== "")){
            emit("password", {password: Crypt.crypt_pass(Crypt.get_pass(chan.toLowerCase())), channel: chan.toLowerCase()});
            Admin.beginning = false;
        }
    },

    pass_save: function() {
        if(!w_p) {
            emit('password', {password: Crypt.crypt_pass(CryptoJS.SHA256(document.getElementById("password").value).toString()), channel: chan.toLowerCase(), oldpass: Crypt.crypt_pass(Crypt.get_pass(chan.toLowerCase()))});
        } else {
            emit('password', {password: Crypt.crypt_pass(CryptoJS.SHA256(document.getElementById("password").value).toString()), channel: chan.toLowerCase()});
        }
    },

    log_out: function() {
        before_toast();
        if(Crypt.get_pass(chan.toLowerCase())) {
            Crypt.remove_pass(chan.toLowerCase());
            Admin.display_logged_out();
            Materialize.toast("Logged out", 4000);
        } else {
            Materialize.toast("Not logged in", 4000);
        }
    },

    display_logged_out: function() {
        w_p       = true;
        adminpass = "";
        names     = ["vote","addsongs","longsongs","frontpage", "allvideos",
        "removeplay", "skip", "shuffle"];

        document.getElementById("password").value = "";
        $("#thumbnail_form").css("display", "none");
        $("#description_form").css("display", "none");
        for (i = 0; i < names.length; i++) {
            $("input[name="+names[i]+"]").attr("disabled", true);
        }

        if($("#admin-lock").html() != "lock") {
            $("#admin-lock").removeClass("clickable");
            $("#admin-lock").html("lock");
            if(!Helper.mobilecheck()) {
                $('#admin-lock').tooltip('remove');
            }
        }

        if(!$(".user-password-li").hasClass("hide")) {
            $(".user-password-li").addClass("hide")
        }

        if(!$(".delete-all").hasClass("hide")) {
          $(".delete-all").addClass("hide");
        }

        if($(".password_protected").prop("checked")) {
            $(".change_user_pass").removeClass("hide");
        }

        if(!$(".change_user_pass").hasClass("hide")) {
            $(".change_user_pass").addClass("hide");
        }
        if(!client) {
            if(!Helper.contains($(".playlist-tabs-loggedIn").attr("class").split(" "), "hide")) {
                $(".playlist-tabs-loggedIn").addClass("hide");
                $(".playlist-tabs").removeClass("hide");
            }

            if($("ul.playlist-tabs-loggedIn .playlist-tab-links.active").attr("href") == "#suggestions" && $(".tabs").length > 0 && !changing_to_frontpage)
            {
                $('ul.playlist-tabs').tabs('select_tab', 'wrapper');
                $('ul.playlist-tabs-loggedIn').tabs('select_tab', 'wrapper');
            } else if($(".tabs").length > 0 && !changing_to_frontpage){
                $('ul.playlist-tabs').tabs('select_tab', $(".playlist-tabs-loggedIn li a.active").attr("href").substring(1));
            }
        }
        $("#admin-lock").removeClass("clickable");
        $("#password").attr("placeholder", "Enter admin password");
    },

    save: function(userpass) {
        Admin.submitAdmin(document.getElementById("adminForm").elements, userpass);
    },

    set_conf: function(conf_array) {
        music     = conf_array.allvideos;
        longsongs = conf_array.longsongs;
        names     = ["vote","addsongs","longsongs","frontpage", "allvideos",
        "removeplay", "skip", "shuffle", "userpass"];


        if(conf_array.adminpass === "" || !w_p){
            hasadmin = false;
            if(!Helper.mobilecheck()) {
                //$(".playlist-tabs").removeClass("hide");
                //$("#wrapper").toggleClass("tabs_height");
            }
        }
        else hasadmin = true;

        for (var i = 0; i < names.length; i++) {
            document.getElementsByName(names[i])[0].checked = (conf_array[names[i]] === true);
            $("input[name="+names[i]+"]").attr("disabled", hasadmin);
        }

        if((hasadmin)) {
            if($("#admin-lock").html() != "lock") Admin.display_logged_out();
        } else if(!hasadmin && Crypt.get_pass(chan.toLowerCase()) === undefined) {
            if(!Helper.contains($(".playlist-tabs").attr("class").split(" "), "hide")) {
                $(".playlist-tabs-loggedIn").removeClass("hide");
                $(".playlist-tabs").addClass("hide");
            }
            $("#password").attr("placeholder", "Create admin password");
        } else {
            if($(".password_protected").prop("checked")) {
                $(".change_user_pass").removeClass("hide");
            }
        }

        if(!$(".password_protected").prop("checked") && !$(".change_user_pass").hasClass("hide")) {
            $(".change_user_pass").addClass("hide");
            Crypt.remove_userpass(chan.toLowerCase());
        }

        if(conf_array.thumbnail != undefined && conf_array.thumbnail != "") {
            $("#thumbnail_image").html("<img id='thumbnail_image_channel' src='" + conf_array.thumbnail + "' alt='thumbnail' />");
        }

        if(conf_array.description != undefined && conf_array.description != "") {
            $("#description_area").html(conf_array.description);
        }

    },

    submitAdmin: function(form, userpass_changed) {
        voting     = form.vote.checked;
        addsongs   = form.addsongs.checked;
        longsongs  = form.longsongs.checked;
        frontpage  = form.frontpage.checked;
        allvideos  = form.allvideos.checked;
        removeplay = form.removeplay.checked;
        skipping   = form.skip.checked;
        shuffling  = form.shuffle.checked;
        var pass_send = userpass == '' ? userpass : CryptoJS.SHA256(userpass).toString();
        configs = {
            channel: chan.toLowerCase(),
            voting: voting,
            addsongs: addsongs,
            longsongs: longsongs,
            frontpage: frontpage,
            allvideos: allvideos,
            removeplay: removeplay,
            adminpass: adminpass == "" ? "" : Crypt.crypt_pass(adminpass),
            skipping: skipping,
            shuffling: shuffling,
            userpass: Crypt.crypt_pass(pass_send),
            userpass_changed: userpass_changed
        };
        if(userpass_changed){
            Crypt.set_userpass(chan.toLowerCase(), CryptoJS.SHA256(userpass).toString());
        }
        emit("conf", configs);
    },

    hide_settings: function() {
        $('#settings').sideNav('hide');
    },

    shuffle: function() {
        if(!offline) {
            emit('shuffle', {adminpass: adminpass !== undefined ? Crypt.crypt_pass(adminpass) : "", channel: chan.toLowerCase(), pass: embed ? '' : Crypt.crypt_pass(Crypt.get_userpass(chan.toLowerCase()), true)});
        } else {
            for(var x = 0; x < full_playlist.length; x++){
                var num = Math.floor(Math.random()*1000000);
                full_playlist[x].added = num;
            }
            List.sortList();
            List.populate_list(full_playlist);
        }
    },

    get_admin:function() {
        return [w_p, hasadmin];
    }

};
