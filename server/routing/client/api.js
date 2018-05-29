var express = require('express');
var router = express.Router();
var path = require('path');
var mongojs = require('mongojs');
var ObjectId = mongojs.ObjectId;
var token_db = mongojs("tokens");
var cookieParser = require("cookie-parser");

var toShowChannel = {
    start: 1,
    end: 1,
    added: 1,
    id: 1,
    title: 1,
    votes: 1,
    duration: 1,
    type: 1,
    _id: 0,
    now_playing: 1,
    type: 1,
    source: 1,
    thumbnail: 1,
};
var toShowConfig = {
    addsongs: 1,
    adminpass: 1,
    allvideos: 1,
    frontpage: 1,
    longsongs: 1,
    removeplay: 1,
    shuffle: 1,
    skip: 1,
    startTime: 1,
    userpass: 1,
    vote: 1,
    _id: 0
};

var error = {
    not_found: {
        youtube: {
            status: 404,
            error: "Couldn't find a song like that on YouTube.",
            success: false,
            results: [],
        },
        local: {
            status: 404,
            error: "Couldn't find a song like that in the channel",
            success: false,
            results: [],
        },
        list: {
            status: 404,
            error: "The list doesn't exist",
            success: false,
            results: [],
        }
    },
    not_authenticated: {
        status: 403,
        error: "Wrong adminpassword or userpassword.",
        success: false,
        results: [],
    },
    formatting: {
        status: 400,
        error: "Malformed request parameters.",
        success: false,
        results: [],
    },
    conflicting: {
        status: 409,
        error: "That element already exists.",
        success: false,
        results: [],
    },
    wrong_token: {
        status: 400,
        error: "You're using a faulty token. Try getting a new token, or send the request without the token.",
        success: false,
        results: [],
    },
    tooMany: {
        status: 429,
        error: "You're doing too many requests, check header-field Retry-After for the wait-time left.",
        success: false,
        results: [],
    },
    no_error: {
        status: 200,
        error: false,
        success: true,
        results: [],
    }
}

router.use(function(req, res, next) {
    next(); // make sure we go to the next routes and don't stop here
});

router.route('/api/help').get(function(req, res) {
    res.redirect('https://github.com/zoff-music/zoff/blob/master/server/REST.md');
    return;
})

router.route('/api/frontpages').get(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header({"Content-Type": "application/json"});
    db.collection("frontpage_lists").find({frontpage: true, count: {$gt: 0}}, function(err, docs) {
        db.collection("connected_users").find({"_id": "total_users"}, function(err, tot) {
            var to_return = error.no_error;
            to_return.results = {channels: docs, viewers: tot[0].total_users.length};
            res.status(200).send(JSON.stringify(to_return));
            return;
        });
    });
});

router.route('/api/generate_name').get(function(req, res) {
    Functions.generate_channel_name(res);
});

router.route('/api/list/:channel_name/:video_id').delete(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header({"Content-Type": "application/json"});
    if(!req.body.hasOwnProperty('adminpass') || !req.body.hasOwnProperty('userpass') ||
        !req.params.hasOwnProperty('channel_name') || !req.params.hasOwnProperty('video_id')) {
        var result = {
            adminpass: {
                expected: "string",
                got: req.body.hasOwnProperty("adminpass") ? typeof(req.body.adminpass) : undefined,
            },
            userpass: {
                expected: "string",
                got: req.body.hasOwnProperty("userpass") ? typeof(req.body.userpass) : undefined
            }
        };
        var to_send = error.formatting;
        to_send.results.push(result);
        res.status(400).send(JSON.stringify(to_send));
        return;
    }
    var token = "";
    if(req.body.hasOwnProperty("token")) {
        token = req.body.token;
    }
    try {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
        var adminpass = req.body.adminpass == "" ? "" : Functions.hash_pass(crypto.createHash('sha256').update(req.body.adminpass, 'utf8').digest("hex"));
        req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("base64");
        var userpass = req.body.userpass;
        var channel_name = cleanChannelName(req.params.channel_name);
        var video_id = req.params.video_id;
        if(typeof(userpass) != "string" || typeof(adminpass) != "string") {
                throw "Wrong format";
            }
    } catch(e) {
        var result = {
            adminpass: {
                expected: "string",
                got: req.body.hasOwnProperty("adminpass") ? typeof(req.body.adminpass) : undefined,
            },
            userpass: {
                expected: "string",
                got: req.body.hasOwnProperty("userpass") ? typeof(req.body.userpass) : undefined
            }
        };
        var to_send = error.formatting;
        to_send.results.push(result);
        res.status(400).send(JSON.stringify(to_send));
        return;
    }

    var cookie = req.cookies._uI;

    Functions.getSessionAdminUser(cookie, channel_name, function(_u, _a) {
        if(req.body.adminpass == "") {
            adminpass = Functions.hash_pass(crypto.createHash('sha256').update(Functions.decrypt_string(_a), 'utf8').digest("hex"));
        }
        if(req.body.userpass == "") {
            userpass = crypto.createHash('sha256').update(Functions.decrypt_string(_u), 'utf8').digest("base64");
        }
        token_db.collection("api_token").find({token: token}, function(err, token_docs) {
            var authorized = false;
            var origin;
            try {
                origin = req.headers.referer.split("/")[2];
            } catch(e) { origin = ""; }
            if(token_docs.length == 1 && token_docs[0].token == token && (token_docs[0].origin == "*" || origin.indexOf(token_docs[0].origin) > -1)) {
                authorized = true;
            }
            checkOveruseApiToken(authorized, token_docs, res, function() {
                checkTimeout(guid, res, authorized, "DELETE", function() {
                    if(token != "" && !authorized) {
                        updateTimeout(guid, res, authorized, "DELETE", function(err, docs) {
                            res.status(400).send(JSON.stringify(error.wrong_token));
                            return;
                        });
                    } else {
                        validateLogin(adminpass, userpass, channel_name, "delete", res, function(exists) {
                            if(!exists) {
                                res.status(404).send(JSON.stringify(error.not_found.list));
                                return;
                            }
                            db.collection(channel_name).find({id:video_id, now_playing: false}, function(err, docs){
                                if(docs.length == 0) {
                                    res.status(404).send(JSON.stringify(error.not_found.local));
                                    return;
                                }
                                var dont_increment = false;
                                if(docs[0]){
                                    if(docs[0].type == "suggested"){
                                        dont_increment = true;
                                    }
                                    db.collection(channel_name).remove({id:video_id}, function(err, docs){
                                        if(authorized) {
                                            incrementToken(token);
                                        }
                                        io.to(channel_name).emit("channel", {type:"deleted", value: video_id});
                                        if(!dont_increment) {
                                            db.collection("frontpage_lists").update({_id: channel_name, count: {$gt: 0}}, {$inc: {count: -1}, $set:{accessed: Functions.get_time()}}, {upsert: true}, function(err, docs){
                                                updateTimeout(guid, res, authorized, "DELETE", function(err, docs) {
                                                    res.status(200).send(JSON.stringify(error.no_error));
                                                    return;
                                                });
                                            });
                                        } else {
                                            updateTimeout(guid, res, authorized, "DELETE", function(err, docs) {
                                                res.status(200).send(JSON.stringify(error.no_error));
                                                return;
                                            });
                                        }
                                    });
                                }
                            });
                        });
                    }
                });
            });
        });
    });
});

router.route('/api/conf/:channel_name').put(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header({"Content-Type": "application/json"});

    try {
        if(!req.body.hasOwnProperty('adminpass') || !req.body.hasOwnProperty('userpass') ||
            !req.params.hasOwnProperty('channel_name') || !req.body.hasOwnProperty('vote') ||
            !req.body.hasOwnProperty('addsongs') || !req.body.hasOwnProperty('longsongs') ||
            !req.body.hasOwnProperty('frontpage') || !req.body.hasOwnProperty('allvideos') ||
            !req.body.hasOwnProperty('skip') || !req.body.hasOwnProperty('shuffle') ||
            !req.body.hasOwnProperty('userpass_changed')) {
            throw "Wrong format";
        }
        var token = "";
        if(req.body.hasOwnProperty("token")) {
            token = req.body.token;
        }

        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
        var adminpass = req.body.adminpass == "" ? "" : Functions.hash_pass(crypto.createHash('sha256').update(req.body.adminpass, 'utf8').digest("hex"));
        req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("base64");
        var userpass = req.body.userpass;
        var voting = req.body.vote;
        var addsongs = req.body.addsongs;
        var longsongs = req.body.longsongs;
        var frontpage = req.body.frontpage;
        var allvideos = req.body.allvideos;
        var removeplay = req.body.removeplay;
        var skipping = req.body.skip;
        var shuffling = req.body.shuffle;
        var userpass_changed = req.body.userpass_changed;
        var channel_name = cleanChannelName(req.params.channel_name);
        if(typeof(userpass) != "string" || typeof(adminpass) != "string" ||
            typeof(voting) != "boolean" || typeof(addsongs) != "boolean" ||
            typeof(longsongs) != "boolean" || typeof(frontpage) != "boolean" ||
            typeof(allvideos) != "boolean" || typeof(removeplay) != "boolean" ||
            typeof(skipping) != "boolean" || typeof(shuffling) != "boolean" ||
            typeof(userpass_changed) != "boolean") {
                throw "Wrong format";
            }
    } catch(e) {
        var result = {
            adminpass: {
                expected: "string",
                got: req.body.hasOwnProperty("adminpass") ? typeof(req.body.adminpass) : undefined,
            },
            userpass: {
                expected: "string",
                got: req.body.hasOwnProperty("userpass") ? typeof(req.body.userpass) : undefined,
            },
            vote: {
                expected: "boolean",
                got: req.body.hasOwnProperty("vote") ? typeof(req.body.vote) : undefined,
            },
            addsongs: {
                expected: "boolean",
                got: req.body.hasOwnProperty("addsongs") ? typeof(req.body.addsongs) : undefined,
            },
            longsongs: {
                expected: "boolean",
                got: req.body.hasOwnProperty("longsongs") ? typeof(req.body.longsongs) : undefined,
            },
            frontpage: {
                expected: "boolean",
                got: req.body.hasOwnProperty("frontpage") ? typeof(req.body.frontpage) : undefined,
            },
            skip: {
                expected: "boolean",
                got: req.body.hasOwnProperty("skip") ? typeof(req.body.skip) : undefined,
            },
            shuffle: {
                expected: "boolean",
                got: req.body.hasOwnProperty("shuffle") ? typeof(req.body.shuffle) : undefined,
            },
            userpass_changed: {
                expected: "boolean",
                got: req.body.hasOwnProperty("userpass_changed") ? typeof(req.body.userpass_changed) : undefined,
            }
        };
        var to_send = error.formatting;
        to_send.results.push(result);
        res.status(400).send(JSON.stringify(result));
        return;
    }
    var cookie = req.cookies._uI;
    Functions.getSessionAdminUser(cookie, channel_name, function(_u, _a) {
        if(req.body.adminpass == "") {
            adminpass = Functions.hash_pass(crypto.createHash('sha256').update(Functions.decrypt_string(_a), 'utf8').digest("hex"));
        }
        if(req.body.userpass == "") {
            userpass = crypto.createHash('sha256').update(Functions.decrypt_string(_u), 'utf8').digest("base64");
        }
        token_db.collection("api_token").find({token: token}, function(err, token_docs) {
            var authorized = false;
            var origin;
            try {
                origin = req.headers.referer.split("/")[2];
            } catch(e) { origin = ""; }
            if(token_docs.length == 1 && token_docs[0].token == token && (token_docs[0].origin == "*" || origin.indexOf(token_docs[0].origin) > -1)) {
                authorized = true;
            }
            checkOveruseApiToken(authorized, token_docs, res, function() {
                checkTimeout(guid, res, authorized, "CONFIG", function() {
                    if(token != "" && !authorized) {
                        updateTimeout(guid, res, authorized, "CONFIG", function(err, docs) {
                            res.status(400).send(JSON.stringify(error.wrong_token));
                            return;
                        });
                    } else {
                        validateLogin(adminpass, userpass, channel_name, "config", res, function(exists, conf) {
                            if(!exists && conf.length == 0) {
                                res.status(404).send(JSON.stringify(error.not_found.list));
                                return;
                            }

                            if((!userpass_changed && frontpage) || (userpass_changed && userpass == "")) {
                                userpass = "";
                            } else if(userpass_changed && userpass != "") {
                                frontpage = false;
                            }
                            var description = "";

                            var obj = {
                                addsongs:addsongs,
                                allvideos:allvideos,
                                frontpage:frontpage,
                                skip:skipping,
                                vote:voting,
                                removeplay:removeplay,
                                shuffle:shuffling,
                                longsongs:longsongs,
                                adminpass:adminpass,
                                desc: description,
                            };
                            if(userpass_changed) {
                                obj["userpass"] = userpass;
                            } else if (frontpage) {
                                obj["userpass"] = "";
                            }
                            db.collection(channel_name + "_settings").update({views:{$exists:true}}, {
                                $set:obj
                            }, function(err, docs){

                                if(obj.adminpass !== "") obj.adminpass = true;
                                if(obj.hasOwnProperty("userpass") && obj.userpass != "") obj.userpass = true;
                                else obj.userpass = false;
                                io.to(channel_name).emit("conf", [obj]);

                                db.collection("frontpage_lists").update({_id: channel_name}, {$set:{
                                    frontpage:frontpage, accessed: Functions.get_time()}
                                },
                                {upsert:true}, function(err, docs){
                                    if(authorized) {
                                        incrementToken(token);
                                    }
                                    updateTimeout(guid, res, authorized, "CONFIG", function(err, docs) {
                                        var to_return = error.no_error;
                                        to_return.results = [obj];
                                        res.status(200).send(JSON.stringify(to_return));
                                        return;
                                    });
                                });
                            });
                        });
                    }
                });
            });
        });
    });
});

router.route('/api/list/:channel_name/:video_id').put(function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header({"Content-Type": "application/json"});
    try {
        if(!req.body.hasOwnProperty('adminpass') || !req.body.hasOwnProperty('userpass') ||
            !req.params.hasOwnProperty('channel_name') || !req.params.hasOwnProperty('video_id')) {
            throw "Wrong format";
        }
        var token = "";
        if(req.body.hasOwnProperty("token")) {
            token = req.body.token;
        }
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
        var adminpass = req.body.adminpass == "" ? "" : Functions.hash_pass(crypto.createHash('sha256').update(req.body.adminpass, 'utf8').digest("hex"));
        req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("base64");
        var userpass = req.body.userpass;
        var channel_name = cleanChannelName(req.params.channel_name);
        var video_id = req.params.video_id;
        if(typeof(userpass) != "string" || typeof(adminpass) != "string") {
                throw "Wrong format";
            }
    } catch(e) {
        var result = {
            adminpass: {
                expected: "string",
                got: req.body.hasOwnProperty("adminpass") ? typeof(req.body.adminpass) : undefined,
            },
            userpass: {
                expected: "string",
                got: req.body.hasOwnProperty("userpass") ? typeof(req.body.userpass) : undefined
            }
        };
        var to_send = error.formatting;
        to_send.results.push(result);
        res.status(400).send(JSON.stringify(to_send));
        return;
    }
    var cookie = req.cookies._uI;
    Functions.getSessionAdminUser(cookie, channel_name, function(_u, _a) {
        if(req.body.adminpass == "") {
            adminpass = Functions.hash_pass(crypto.createHash('sha256').update(Functions.decrypt_string(_a), 'utf8').digest("hex"));
        }
        if(req.body.userpass == "") {
            userpass = crypto.createHash('sha256').update(Functions.decrypt_string(_u), 'utf8').digest("base64");
        }
        token_db.collection("api_token").find({token: token}, function(err, token_docs) {
            var authorized = false;
            var origin;
            try {
                origin = req.headers.referer.split("/")[2];
            } catch(e) { origin = ""; }
            if(token_docs.length == 1 && token_docs[0].token == token && (token_docs[0].origin == "*" || origin.indexOf(token_docs[0].origin) > -1)) {
                authorized = true;
            }
            checkOveruseApiToken(authorized, token_docs, res, function() {
                checkTimeout(guid, res, authorized, "PUT", function() {
                    if(token != "" && !authorized) {
                        updateTimeout(guid, res, authorized, "PUT", function(err, docs) {
                            res.status(400).send(JSON.stringify(error.wrong_token));
                            return;
                        });
                    } else {
                        validateLogin(adminpass, userpass, channel_name, "vote", res, function(exists) {
                            if(!exists) {
                                res.status(404).send(JSON.stringify(error.not_found.list));
                                return;
                            }
                            db.collection(channel_name).find({id: video_id, now_playing: false}, function(err, song) {
                                if(song.length == 0 || (song.hasOwnProperty("type") && song.type == "suggested")) {
                                    res.status(404).send(JSON.stringify(error.not_found.local));
                                    return;
                                } else if(song[0].guids.indexOf(guid) > -1) {
                                    res.status(409).send(JSON.stringify(error.conflicting));
                                    return;
                                } else {
                                    song[0].votes += 1;
                                    song[0].guids.push(guid);
                                    db.collection(channel_name).update({id: video_id}, {$inc:{votes:1}, $set:{added:Functions.get_time(), type: "video"}, $push :{guids: guid}}, function(err, success) {
                                        if(authorized) {
                                            incrementToken(token);
                                        }
                                        io.to(channel_name).emit("channel", {type: "vote", value: video_id, time: Functions.get_time()});
                                        List.getNextSong(channel_name, function() {
                                            updateTimeout(guid, res, authorized, "PUT", function(err, docs) {
                                                var to_return = error.no_error;
                                                to_return.results = song;
                                                res.status(200).send(JSON.stringify(to_return));
                                                return;
                                            });
                                        });
                                    });
                                }
                            })
                        });
                    }
                });
            });
        });
    });
});

router.route('/api/list/:channel_name/__np__').post(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header({"Content-Type": "application/json"});
    try {
        if(!req.body.hasOwnProperty('userpass')) {
            throw "Wrong format";
        }

        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
        var channel_name = req.params.channel_name;
        req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("base64");
        var userpass = req.body.userpass;
        var token = "";
        if(req.body.hasOwnProperty("token")) {
            token = req.body.token;
        }
        if(typeof(userpass) != "string") {
            throw "Wrong format";
        }
    } catch(e) {
        var result = {
            userpass: {
                expected: "string",
                got: req.body.hasOwnProperty("userpass") ? typeof(req.body.userpass) : undefined
            }
        };
        var to_send = error.formatting;
        to_send.results.push(result);
        res.status(400).send(JSON.stringify(to_send));
        return;
    }
    var cookie = req.cookies._uI;
    Functions.getSessionAdminUser(cookie, channel_name, function(_u, _a) {
        if(req.body.userpass == "") {
            userpass = crypto.createHash('sha256').update(Functions.decrypt_string(_u), 'utf8').digest("base64");
        }
        token_db.collection("api_token").find({token: token}, function(err, token_docs) {
            var authorized = false;
            var origin;
            try {
                origin = req.headers.referer.split("/")[2];
            } catch(e) { origin = ""; }
            if(token_docs.length == 1 && token_docs[0].token == token && (token_docs[0].origin == "*" || origin.indexOf(token_docs[0].origin) > -1)) {
                authorized = true;
            }
            checkOveruseApiToken(authorized, token_docs, res, function() {
                checkTimeout(guid, res, authorized, "POST", function() {
                    if(token != "" && !authorized) {
                        updateTimeout(guid, res, authorized, "POST", function(err, docs) {
                            res.status(400).send(JSON.stringify(error.wrong_token));
                            return;
                        });
                    } else {
                        db.collection(channel_name).find({now_playing: true}, toShowChannel, function(err, list) {
                            if(list.length > 0) {
                                db.collection(channel_name + "_settings").find({ id: "config" }, function(err, conf) {
                                    if(authorized) {
                                        incrementToken(token);
                                    }
                                    if(conf.length == 0) {
                                        res.status(404).send(JSON.stringify(error.not_found.list));
                                        return;
                                    } else if(conf[0].userpass != userpass && conf[0].userpass != "" && conf[0].userpass != undefined) {
                                        res.status(403).send(JSON.stringify(error.not_authenticated));
                                        return;
                                    }
                                    updateTimeout(guid, res, authorized, "POST", function(err, docs) {
                                        var to_return = error.no_error;
                                        if(list[0].source == undefined) {
                                            list[0].source = "youtube";
                                        }
                                        if(list[0].thumbnail == undefined) {
                                            list[0].thumbnail = "https://img.youtube.com/vi/" + list[0].id + "/mqdefault.jpg"
                                        }
                                        to_return.results = list;
                                        res.status(200).send(JSON.stringify(to_return));
                                        return;
                                    });
                                });
                            } else {
                                res.status(404).send(JSON.stringify(error.not_found.list));
                                return;
                            }
                        });
                    }
                });
            });
        });
    });
});

router.route('/api/list/:channel_name/:video_id').post(function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header({"Content-Type": "application/json"});
    var fetch_only = false;
    if(req.body.hasOwnProperty('fetch_song')) {
        fetch_only = true;
    }
    var token = "";
    if(req.body.hasOwnProperty("token")) {
        token = req.body.token;
    }
    try {
        if(!fetch_only && (!req.body.hasOwnProperty('adminpass') || !req.body.hasOwnProperty('userpass') ||
            !req.params.hasOwnProperty('channel_name') || !req.params.hasOwnProperty('video_id') ||
            !req.body.hasOwnProperty('duration') || !req.body.hasOwnProperty('start_time') ||
            !req.body.hasOwnProperty('end_time') || !req.body.hasOwnProperty('title') ||
            !req.body.hasOwnProperty('source'))) {
            throw "Wrong format";
        }

        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
        req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("base64");
        var userpass = req.body.userpass;
        var channel_name = cleanChannelName(req.params.channel_name);
        var video_id = req.params.video_id;
        if(!fetch_only) {
            var adminpass = req.body.adminpass == "" ? "" : Functions.hash_pass(crypto.createHash('sha256').update(req.body.adminpass, 'utf8').digest("hex"));
            var duration = parseInt(req.body.duration);
            var start_time = parseInt(req.body.start_time);
            var end_time = parseInt(req.body.end_time);
            var source = req.body.source;
            if(source == "soundcloud" && !req.body.hasOwnProperty("thumbnail")) {
                throw "Wrong format";
            }
            if(duration != end_time - start_time) duration = end_time - start_time;
            var title = req.body.title;
            if(typeof(userpass) != "string" || typeof(adminpass) != "string" ||
                typeof(title) != "string" || isNaN(duration) || isNaN(start_time) || isNaN(end_time)) {
                    throw "Wrong format";
                }
        }
    } catch(e) {
        var result = {
            adminpass: {
                expected: "string",
                got: req.body.hasOwnProperty("adminpass") ? typeof(req.body.adminpass) : undefined,
            },
            userpass: {
                expected: "string",
                got: req.body.hasOwnProperty("userpass") ? typeof(req.body.userpass) : undefined
            },
            title: {
                expected: "string",
                got: req.body.hasOwnProperty("title") ? typeof(req.body.title) : undefined
            },
            start_time: {
                expected: "number or string that can be cast to int",
                got: !req.body.hasOwnProperty("start_time") ? undefined : isNaN(req.body.start_time) ? "uncastable string" : typeof(req.body.start_time)
            },
            end_time: {
                expected: "number or string that can be cast to int",
                got: !req.body.hasOwnProperty("end_time") ? undefined : isNaN(req.body.end_time) ? "uncastable string" : typeof(req.body.end_time)
            },
            duration: {
                expected: "number or string that can be cast to int",
                got: !req.body.hasOwnProperty("duration") ? undefined : isNaN(req.body.duration) ? "uncastable string" : typeof(req.body.duration)
            }
        };
        var to_send = error.formatting;
        to_send.results.push(result);
        res.status(400).send(JSON.stringify(to_send));
        return;
    }
    var cookie = req.cookies._uI;
    Functions.getSessionAdminUser(cookie, channel_name, function(_u, _a) {
        if(req.body.adminpass == "") {
            adminpass = Functions.hash_pass(crypto.createHash('sha256').update(Functions.decrypt_string(_a), 'utf8').digest("hex"));
        }
        if(req.body.userpass == "") {
            userpass = crypto.createHash('sha256').update(Functions.decrypt_string(_u), 'utf8').digest("base64");
        }
        token_db.collection("api_token").find({token: token}, function(err, token_docs) {
            var authorized = false;
            var origin;
            try {
                origin = req.headers.referer.split("/")[2];
            } catch(e) { origin = ""; }
            if(token_docs.length == 1 && token_docs[0].token == token && (token_docs[0].origin == "*" || origin.indexOf(token_docs[0].origin) > -1)) {
                authorized = true;
            }
            checkOveruseApiToken(authorized, token_docs, res, function() {
                checkTimeout(guid, res, authorized, "POST", function() {
                    if(token != "" && !authorized) {
                        updateTimeout(guid, res, authorized, "POST", function(err, docs) {
                            res.status(400).send(JSON.stringify(error.wrong_token));
                            return;
                        });
                    } else {
                        var type = fetch_only ? "fetch_song" : "add";
                        validateLogin(adminpass, userpass, channel_name, type, res, function(exists, conf, authenticated) {
                            db.collection(channel_name).find({id: video_id}, function(err, result) {
                                if(result.length == 0 || result[0].type == "suggested") {
                                    var song_type = authenticated ? "video" : "suggested";
                                    if(fetch_only && result.length == 0) {
                                        res.status(404).send(JSON.stringify(error.not_found.local));
                                        return;
                                    }
                                    db.collection(channel_name).find({now_playing: true}, function(err, now_playing) {
                                        var set_np = false;
                                        if(now_playing.length == 0 && authenticated) {
                                            set_np = true;
                                        }
                                        var new_song = {"added": Functions.get_time(),"guids":[guid],"id":video_id,"now_playing":set_np,"title":title,"votes":1, "duration":duration, "start": parseInt(start_time), "end": parseInt(end_time), "type": song_type, "source": source};
                                        var runFunction = Search.get_correct_info;
                                        if(source == "soundcloud") {
                                            if(req.body.thumbnail.thumbnail.indexOf("https://i1.sndcdn.com") > -1 || req.body.thumbnail.thumbnail.indexOf("https://w1.sndcdn.com") > -1) {
                                                new_song.thumbnail = req.body.thumbnail.thumbnail;
                                            } else {
                                                new_song.thumbnail = "https://img.youtube.com/vi/404_notfound/mqdefault.jpg";
                                            }
                                            runFunction = function(new_song, foo_2, foo_3, callback) {
                                                callback(new_song, true);
                                            }
                                        } else if(source == "youtube") new_song.thumbnail = "https://img.youtube.com/vi/" + new_song.id + "/mqdefault.jpg";
                                        runFunction(new_song, channel_name, false, function(element, found) {
                                            if(!found) {
                                                res.status(404).send(JSON.stringify(error.not_found.youtube));
                                                return;
                                            }
                                            new_song = element;
                                            db.collection("frontpage_lists").find({"_id": channel_name}, function(err, count) {
                                                var create_frontpage_lists = false;
                                                if(count.length == 0) {
                                                    create_frontpage_lists = true;
                                                }
                                                if(!exists) {
                                                    var configs = {"addsongs":false, "adminpass":"", "allvideos":true, "frontpage":true, "longsongs":false, "removeplay": false, "shuffle": true, "skip": false, "skips": [], "startTime":Functions.get_time(), "views": [], "vote": false, "desc": ""};
                                                    db.collection(channel_name + "_settings").insert(configs, function(err, docs){
                                                        io.to(channel_name).emit("conf", configs);
                                                    });
                                                }
                                                db.collection(channel_name).update({"id": new_song.id}, new_song, {upsert: true}, function(err, success) {
                                                    if(authorized) {
                                                        incrementToken(token);
                                                    }
                                                    if(create_frontpage_lists) {
                                                        db.collection("frontpage_lists").update({"_id": channel_name, "count" :  (authenticated ? 1 : 0), "frontpage": true, "accessed": Functions.get_time(), "viewers": 1}, {upsert: true}, function(err, docs) {
                                                            if(authenticated) {
                                                                io.to(channel_name).emit("channel", {type: "added", value: new_song});
                                                            } else {
                                                                io.to(channel_name).emit("suggested", new_song);
                                                            }
                                                            postEnd(channel_name, configs, new_song, guid, res, authenticated, authorized);
                                                        });
                                                    } else if(set_np) {
                                                        var thumbnail = req.body.thumbnail != undefined ? req.body.thumbnail : undefined;
                                                        Frontpage.update_frontpage(channel_name, video_id, title, thumbnail, source, function() {
                                                            io.to(channel_name).emit("np", {np: [new_song], conf: [conf]});
                                                            postEnd(channel_name, configs, new_song, guid, res, authenticated, authorized);
                                                        });
                                                    } else {
                                                        db.collection("frontpage_lists").update({"_id": channel_name}, {$inc: {count: (authenticated ? 1 : 0)}}, function(err, docs) {
                                                            if(authenticated) {
                                                                io.to(channel_name).emit("channel", {type: "added", value: new_song});
                                                            } else {
                                                                io.to(channel_name).emit("suggested", new_song);
                                                            }
                                                            postEnd(channel_name, configs, new_song, guid, res, authenticated, authorized);
                                                        });
                                                    }
                                                });
                                            })
                                        });
                                    });
                                } else if(fetch_only) {
                                    var to_return = error.no_error;
                                    to_return.results = result;
                                    res.status(200).send(JSON.stringify(to_return));
                                    return;
                                } else {
                                    res.status(409).send(JSON.stringify(error.conflicting));
                                    return;
                                }
                            });
                        });
                    }
                });
            });
        });
    });
});

router.route('/api/list/:channel_name').get(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header({"Content-Type": "application/json"});

    /*

    var project_object = {
        "id": 1,
        "added": 1,
        "guids": { "$literal": [] },
        "now_playing": 1,
        "title": 1,
        "votes": { "$literal": 0 },
        "start": 1,
        "duration": 1,
        "end": 1,
        "type": 1,
        "source": 1,
        "thumbnail": 1
    };
db.collection(new_channel).aggregate([
                            {
                                "$match": { type: "video" }
                            },
                            {
                                "$project": project_object
                            }
                        ]

                        */
    var project_object = {
        "_id": 0,
        "id": 1,
        "added": 1,
        "now_playing": 1,
        "title": 1,
        "votes": 1,
        "start": 1,
        "duration": 1,
        "end": 1,
        "type": 1,
        "source": { $ifNull: [ "$source", "youtube" ] },
        "thumbnail": {
            $ifNull: [ "$thumbnail", {
                $concat : [ "https://img.youtube.com/vi/", "$id", "/mqdefault.jpg"]
            } ]
        }
    };
    var channel_name = req.params.channel_name;
    db.collection(channel_name).aggregate([
        {
            "$match": { }
        },
        {
            "$project": project_object
        }
    ], function(err, docs) {
    //db.collection(channel_name).find({views: {$exists: false}}, toShowChannel, function(err, docs) {
        if(docs.length > 0) {
            db.collection(channel_name + "_settings").find({ id: "config" }, function(err, conf) {
                if(conf.length == 0) {
                    res.status(404).send(JSON.stringify(error.not_found.list));
                    return;
                } else if(conf[0].userpass != "" && conf[0].userpass != undefined) {
                    res.status(403).send(JSON.stringify(error.not_authenticated));
                    return;
                }
                var to_return = error.no_error;
                to_return.results = docs;
                res.status(200).send(JSON.stringify(to_return));
            });
        } else {
            res.status(404).send(JSON.stringify(error.not_found.list));
        }
    });
});

router.route('/api/list/:channel_name/:video_id').get(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header({"Content-Type": "application/json"});

    var channel_name = req.params.channel_name;
    var video_id = req.params.video_id;
    var searchQuery = {id: video_id};
    if(video_id == "__np__") {
        searchQuery = {now_playing: true};
    }
    db.collection(channel_name).find(searchQuery, toShowChannel, function(err, docs) {
        db.collection(channel_name + "_settings").find({ id: "config" }, function(err, conf) {
            if(conf.length == 0) {
                res.status(404).send(JSON.stringify(error.not_found.list));
                return;
            } else if(conf[0].userpass != "" && conf[0].userpass != undefined) {
                res.status(403).send(JSON.stringify(error.not_authenticated));
                return;
            }
            if(docs.length == 0) {
                res.status(404).send(JSON.stringify(error.not_found.local));
                return;
            }
            var to_return = error.no_error;
            if(docs[0].source == undefined) {
                docs[0].source = "youtube";
            }
            if(docs[0].thumbnail == undefined) {
                docs[0].thumbnail = "https://img.youtube.com/vi/" + docs[0].id + "/mqdefault.jpg"
            }
            to_return.results = docs;
            res.status(200).send(JSON.stringify(to_return));
            return;
        });
    });
});

router.route('/api/conf/:channel_name').get(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header({"Content-Type": "application/json"});

    var channel_name = req.params.channel_name;
    db.collection(channel_name + "_settings").find({ id: "config" }, toShowConfig, function(err, docs) {
        if(docs.length > 0 && docs[0].userpass == "" || docs[0].userpass == undefined) {
            var conf = docs[0];
            if(conf.adminpass != "") {
                conf.adminpass = true;
            } else {
                conf.adminpass = false;
            }
            if(conf.userpass != "" && conf.userpass != undefined) {
                conf.userpass = true;
            } else {
                conf.userpass = false;
            }
            var to_return = error.no_error;
            to_return.results = [conf];
            res.status(200).send(JSON.stringify(to_return));
        } else if(docs.length > 0 && docs[0].userpass != "" && docs[0].userpass != undefined){
            res.status(403).send(JSON.stringify(error.not_authenticated));
            return;
        } else {
            res.status(404).send(JSON.stringify(error.not_found.list));
            return;
        }
    });
});

router.route('/api/conf/:channel_name').post(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header({"Content-Type": "application/json"});

    try {
        if(!req.body.hasOwnProperty('userpass')) {
            throw "Wrong format"
        }
        var token = "";
        if(req.body.hasOwnProperty("token")) {
            token = req.body.token;
        }
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
        var channel_name = req.params.channel_name;
        req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("base64");
        var userpass = req.body.userpass;

        if(typeof(userpass) != "string") {
            throw "Wrong format";
        }
    } catch(e) {
        var result = {
            userpass: {
                expected: "string",
                got: req.body.hasOwnProperty("userpass") ? typeof(req.body.userpass) : undefined
            }
        };
        var to_send = error.formatting;
        to_send.results.push(result);
        res.status(400).send(JSON.stringify(to_send));
        return;
    }
    var cookie = req.cookies._uI;
    Functions.getSessionAdminUser(cookie, channel_name, function(_u, _a) {
        if(req.body.userpass == "") {
            userpass = crypto.createHash('sha256').update(Functions.decrypt_string("", _u), 'utf8').digest("base64");
        }

        token_db.collection("api_token").find({token: token}, function(err, token_docs) {
            var authorized = false;
            var origin;
            try {
                origin = req.headers.referer.split("/")[2];
            } catch(e) { origin = ""; }
            if(token_docs.length == 1 && token_docs[0].token == token && (token_docs[0].origin == "*" || origin.indexOf(token_docs[0].origin) > -1)) {
                authorized = true;
            }
            checkOveruseApiToken(authorized, token_docs, res, function() {
                checkTimeout(guid, res, authorized, "POST", function() {
                    if(token != "" && !authorized) {
                        updateTimeout(guid, res, authorized, "DELETE", function(err, docs) {
                            res.status(400).send(JSON.stringify(error.wrong_token));
                            return;
                        });
                    } else {
                        db.collection(channel_name + "_settings").find({ id: "config" }, toShowConfig, function(err, docs) {
                            if(docs.length > 0 && docs[0].userpass == userpass) {
                                var conf = docs[0];
                                if(conf.adminpass != "") {
                                    conf.adminpass = true;
                                } else {
                                    conf.adminpass = false;
                                }
                                if(conf.userpass != "") {
                                    conf.userpass = true;
                                } else {
                                    conf.userpass = false;
                                }
                                if(authorized) {
                                    incrementToken(token);
                                }
                                updateTimeout(guid, res, authorized, "POST", function(err, docs) {
                                    var to_return = error.no_error;
                                    to_return.results = [conf];
                                    res.status(200).send(JSON.stringify(to_return));
                                });
                            } else if(docs.length > 0 && docs[0].userpass != userpass) {
                                res.status(403).send(JSON.stringify(error.not_authenticated));
                                return;
                            } else {
                                res.status(404).send(JSON.stringify(error.not_found.list));
                                return;
                            }
                        });
                    }
                });
            });
        });
    });
});

function checkOveruseApiToken(authorized, token_docs, res, callback) {
    if(!authorized || (authorized && token_docs[0].limit == 0)) {
        callback();
        return;
    }
    db.collection("timeout_api").find({guid: token_docs[0].token}, function(e, doc) {
        if(doc.length == 1) {
            var this_doc = doc[0];
            var date = new Date(this_doc[0].createdAt);
            date.setSeconds(date.getSeconds() + 1);
            var now = new Date();
            var retry_in = (date.getTime() - now.getTime()) / 1000;
            if(this_doc.used > token_docs[0].limit && retry_in > 0) {
                res.header({'Retry-After': retry_in});
                res.status(429).send(JSON.stringify(error.tooMany));
                return;
            } else {
                db.collection("timeout_api").update({guid: token_docs[0].token}, {$inc: {used: 1}}, function(e, d) {
                    callback();
                });
            }
        } else {
            db.collection("timeout_api").insert({guid: token_docs[0].token, used: 0, createdAt: new Date(), type: "ALL"}, function(e, d) {
                callback();
            });
        }
    });
}

router.route('/api/list/:channel_name').post(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header({"Content-Type": "application/json"});
    try {
        if(!req.body.hasOwnProperty('userpass')) {
            throw "Wrong format";
        }

        var token = "";
        if(req.body.hasOwnProperty("token")) {
            token = req.body.token;
        }
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
        var channel_name = req.params.channel_name;
        req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("base64");
        var userpass = req.body.userpass;

        if(typeof(userpass) != "string") {
            throw "Wrong format";
        }
    } catch(e) {
        var result = {
            userpass: {
                expected: "string",
                got: req.body.hasOwnProperty("userpass") ? typeof(req.body.userpass) : undefined
            }
        };
        var to_send = error.formatting;
        to_send.results.push(result);
        res.status(400).send(JSON.stringify(to_send));

        return;
    }
    var cookie = req.cookies._uI;
    Functions.getSessionAdminUser(cookie, channel_name, function(_u, _a) {
        if(req.body.userpass == "") {
            //userpass = Functions.hash_pass(Functions.hash_pass(Functions.decrypt_string(_u)))
            userpass = crypto.createHash('sha256').update(Functions.decrypt_string(_u), 'utf8').digest("base64");
        }

        token_db.collection("api_token").find({token: token}, function(err, token_docs) {
            var authorized = false;
            var origin;
            try {
                origin = req.headers.referer.split("/")[2];
            } catch(e) { origin = ""; }
            if(token_docs.length == 1 && token_docs[0].token == token && (token_docs[0].origin == "*" || origin.indexOf(token_docs[0].origin) > -1)) {
                authorized = true;
            }
            checkOveruseApiToken(authorized, token_docs, res, function() {
                checkTimeout(guid, res, authorized, "POST", function() {
                    if(token != "" && !authorized) {
                        updateTimeout(guid, res, authorized, "POST", function(err, docs) {
                            res.status(400).send(JSON.stringify(error.wrong_token));
                            return;
                        });
                    } else {
                        var project_object = {
                            "_id": 0,
                            "id": 1,
                            "added": 1,
                            "now_playing": 1,
                            "title": 1,
                            "votes": 1,
                            "start": 1,
                            "duration": 1,
                            "end": 1,
                            "type": 1,
                            "source": { $ifNull: [ "$source", "youtube" ] },
                            "thumbnail": {
                                $ifNull: [ "$thumbnail", {
                                    $concat : [ "https://img.youtube.com/vi/", "$id", "/mqdefault.jpg"]
                                } ]
                            }
                        };
                        var channel_name = req.params.channel_name;
                        db.collection(channel_name).aggregate([
                            {
                                "$match": { }
                            },
                            {
                                "$project": project_object
                            }
                        ], function(err, list) {
                        //db.collection(channel_name).find({views: {$exists: false}}, toShowChannel, function(err, list) {
                            if(list.length > 0) {
                                db.collection(channel_name + "_settings").find({ id: "config" }, function(err, conf) {
                                    if(conf.length == 0) {
                                        res.status(404).send(JSON.stringify(error.not_found.list));
                                        return;
                                    } else if(conf[0].userpass != userpass && conf[0].userpass != "" && conf[0].userpass != undefined) {
                                        res.status(403).send(JSON.stringify(error.not_authenticated));
                                        return;
                                    }
                                    if(authorized) {
                                        incrementToken(token);
                                    }
                                    updateTimeout(guid, res, authorized, "POST", function(err, docs) {
                                        var to_return = error.no_error;
                                        to_return.results = list;
                                        res.status(200).send(JSON.stringify(to_return));
                                        return;
                                    });
                                });
                            } else {
                                res.status(404).send(JSON.stringify(error.not_found.list));
                                return;
                            }
                        });
                    }
                });
            });
        });
    });
});

function incrementToken(token) {
    token_db.collection("api_token").update({token: token}, {$inc: {usage: 1}}, function(err, doc) {

    });
}

router.route('/api/color').post(function(req, res) {
    try {
        var origin = req.get("origin").replace("https://", "").replace("http://", "");
        var allowed = ["client.localhost", "localhost", "zoff.me", "client.zoff.me", "zoff.no", "client.zoff.no"];
        if(allowed.indexOf(origin) < 0) {
            throw "Wrong origin";
        }
    } catch(e) {
        res.sendStatus(403);
        return;
    }
    if(!req.body.hasOwnProperty("id") || typeof(req.body.id) != "string") {
        res.sendStatus(400);
        return;
    }
    List.sendColor(false, undefined, req.body.id, true, res);
});

router.route('/api/imageblob').post(function(req, res) {
    var Jimp = require("jimp");
    try {
        var origin = req.get("origin").replace("https://", "").replace("http://", "");
        var allowed = ["client.localhost", "localhost", "zoff.me", "client.zoff.me", "zoff.no", "client.zoff.no"];
        if(allowed.indexOf(origin) < 0) {
            throw "Wrong origin";
        }
    } catch(e) {
        res.sendStatus(403);
        return;
    }

    Jimp.read('https://img.youtube.com/vi/' + req.body.id + '/mqdefault.jpg', function (err, image) {
        if (err) {
            console.log(err);
            res.sendStatus(404);
            return;
        }
        image.blur(50)
        .write(path.join(pathThumbnails, '/public/assets/images/thumbnails/' + req.body.id + '.jpg'), function(e, r) {
            res.status(200).send(req.body.id + ".jpg");
            return;
        });
    });
});

try {
    var nodemailer = require('nodemailer');
    var mailconfig = require(path.join(__dirname, '../../config/mailconfig.js'));
    var recaptcha_config = require(path.join(__dirname, '../../config/recaptcha.js'));
    var Recaptcha = require('express-recaptcha');
    var RECAPTCHA_SITE_KEY = recaptcha_config.site;
    var RECAPTCHA_SECRET_KEY = recaptcha_config.key;
    var recaptcha = new Recaptcha(RECAPTCHA_SITE_KEY, RECAPTCHA_SECRET_KEY);

    router.route('/api/apply').post(recaptcha.middleware.verify, function(req, res) {
        if(req.body.email == "" || req.body.email == undefined) {
            res.send("failed");
            return;
        }
        if(req.recaptcha.error == null) {
            var origin = "*";
            if(req.body.origin != undefined && req.body.origin != "") origin = req.body.origin;
            var name = req.body.email;
            var id = crypto.createHash('sha256').update(uniqid()).digest('base64');
            var uniqid_link = crypto.createHash('sha256').update(uniqid()).digest('hex');
            token_db.collection("api_token").find({name: name}, function(err, results_find) {
                var token = "";
                if(results_find.length > 0) {
                    token = results_find[0].token;
                }
                token_db.collection("api_links").find({token: token}, function(e, d) {
                    if(results_find.length == 0 || (d.length == 0 && results_find.length > 0 && !results_find[0].active)) {
                        token_db.collection("api_token").insert({name: name, origin: origin, token: id, usage: 0, active: false, limit: 100}, function(err, docs){
                           token_db.collection("api_links").insert({id: uniqid_link, token: id, createdAt: new Date()}, function(err, docs) {
                               let transporter = nodemailer.createTransport(mailconfig);

                               transporter.verify(function(error, success) {
                                   if (error) {
                                       token_db.collection("api_links").remove({id: uniqid_link}, function(e,d) {
                                           res.send("failed");
                                           return;
                                       })
                                   } else {
                                       var subject = 'ZOFF: API-key';
                                       var message = "Link to API-key: <a href='https://zoff.me/api/apply/" + uniqid_link + "'/>https://zoff.me/api/apply/" + uniqid_link + "</a>\n\nThis link expires in 1 day.";
                                       var msg = {
                                           from: mailconfig.from,
                                           to: name,
                                           subject: subject,
                                           text: message,
                                           html: message,
                                       }
                                       transporter.sendMail(msg, (error, info) => {
                                           if (error) {
                                               res.status(400).send("failed");
                                               transporter.close();
                                               return;
                                           }
                                           res.status(200).send("success");
                                           transporter.close();
                                           return;
                                       });
                                   }
                               });
                           })
                        });
                    } else {
                        res.send("failed");
                        return;
                    }
                });
            })
        } else {
            res.send("failed");
            return;
        }
    });

    router.route('/api/mail').post(recaptcha.middleware.verify, function(req, res) {
        if(req.recaptcha.error == null) {
            let transporter = nodemailer.createTransport(mailconfig);

            transporter.verify(function(error, success) {
                if (error) {
                    res.sendStatus(500);
                    return;
                } else {
                    var subject = 'ZOFF: Contact form webpage';
                    if(req.body.error_report) {
                        subject = 'ZOFF: Error report';
                    }
                    var from = req.body.from;
                    var message = req.body.message;
                    var msg = {
                        from: mailconfig.from,
                        to: mailconfig.to,
                        subject: subject,
                        text: message,
                        html: message,
                        replyTo: from
                    }
                    transporter.sendMail(msg, (error, info) => {
                        if (error) {
                            res.status(500).send("failed");
                            transporter.close();
                            return;
                        }
                        res.status(200).send("success");
                        transporter.close();
                    });
                }
            });
        } else {
            res.status(500).send("failed");
            return;
        }
    });
} catch(e) {
    console.log("Mail is not configured and wont work");
    console.log("Seems you forgot to create a mailconfig.js in /server/config/. Have a look at the mailconfig.example.js.");
    router.route('/api/mail').post(function(req, res) {
        console.log("Someone tried to send a mail, but the mailsystem hasn't been enabled..")
        res.status(500).send("failed");
        return;
    });
}

function updateTimeout(guid, res, authorized, type, callback) {
    if(authorized) {
        callback(null, null);
        return;
    }
    db.collection("timeout_api").update({type: type, guid: guid}, {
        $set: {
            "createdAt": new Date(),
            type: type,
            guid: guid,
        },
    }, {upsert: true}, function(err, docs) {
        callback(err, docs);
    });
}

function checkTimeout(guid, res, authorized, type, callback) {
    if(authorized) {
        callback();
        return;
    }
    db.collection("timeout_api").find({
        type: type,
        guid: guid,
    }, function(err, docs) {
        if(docs.length > 0) {
            var date = new Date(docs[0].createdAt);
            date.setSeconds(date.getSeconds() + 1);
            var now = new Date();
            var retry_in = (date.getTime() - now.getTime()) / 1000;
            if(retry_in > 0) {
                res.header({'Retry-After': retry_in});
                res.status(429).send(JSON.stringify(error.tooMany));
                return;
            }
        }
        callback();
    });
}

function cleanChannelName(channel_name) {
    var coll = emojiStrip(channel_name).toLowerCase();
    coll = coll.replace("_", "");
    coll = encodeURIComponent(coll).replace(/\W/g, '');
    coll = filter.clean(coll);
    return coll;
}

function validateLogin(adminpass, userpass, channel_name, type, res, callback) {
    db.collection(channel_name + "_settings").find({ id: "config" }, function(err, conf) {
        var exists = false;
        if(conf.length > 0 && ((conf[0].userpass == undefined || conf[0].userpass == "" || conf[0].userpass == userpass))) {
            exists = true;
        } else if(conf.length > 0 && type == "config") {
            res.status(404).send(JSON.stringify(error.not_found.list));
            return;
        } else if(conf.length == 0) {
            res.status(404).send(JSON.stringify(error.not_found.list));
            return;
        }

        if(
            (type == "fetch_song") ||
            (type == "add" && ((conf[0].addsongs && (conf[0].adminpass == "" || conf[0].adminpass == undefined || conf[0].adminpass == adminpass)) || !conf[0].addsongs)) ||
            (type == "delete" && (conf[0].adminpass == "" || conf[0].adminpass == undefined || conf[0].adminpass == adminpass)) ||
            (type == "vote" && ((conf[0].vote && (conf[0].adminpass == "" || conf[0].adminpass == undefined || conf[0].adminpass == adminpass)) || !conf[0].vote)) ||
            (type == "config" && (conf[0].adminpass == "" || conf[0].adminpass == undefined || conf[0].adminpass == adminpass))
        ) {
            callback(exists, conf, true);
        } else if(type == "add") {
            callback(exists, conf, false);
        } else {
            res.status(403).send(JSON.stringify(error.not_authenticated));
            return;
        }
    });
}

function postEnd(channel_name, configs, new_song, guid, res, authenticated, authorized) {
    if(configs != undefined) {
        io.to(channel_name).emit("conf", configs);
    }
    List.getNextSong(channel_name, function() {
        updateTimeout(guid, res, authorized, "POST", function(err, docs) {
            var to_return = error.no_error;
            if(!authenticated) {
                to_return = error.not_authenticated;
                to_return.success = true;
            }
            to_return.results = [new_song];
            res.status(authenticated ? 200 : 403).send(JSON.stringify(to_return));
            return;
        });
    });
}

module.exports = router;
