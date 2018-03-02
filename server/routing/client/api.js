var express = require('express');
var router = express.Router();
var path = require('path');
var mongojs = require('mongojs');
var ObjectId = mongojs.ObjectId;
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

router.use(function(req, res, next) {
    next(); // make sure we go to the next routes and don't stop here
});

router.route('/api/help').get(function(req, res) {
    res.redirect('https://github.com/zoff-music/zoff/blob/master/server/README.md');
    return;
})

router.route('/api/frontpages').get(function(req, res) {
    db.collection("frontpage_lists").find({frontpage: true, count: {$gt: 0}}, function(err, docs) {
        db.collection("connected_users").find({"_id": "total_users"}, function(err, tot) {
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify({channels: docs, viewers: tot[0].total_users.length}));
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
    if(!req.body.hasOwnProperty('adminpass') || !req.body.hasOwnProperty('userpass') ||
        !req.params.hasOwnProperty('channel_name') || !req.params.hasOwnProperty('video_id')) {
        res.sendStatus(400);
        return;
    }
    try {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
        var adminpass = req.body.adminpass == "" ? "" : Functions.hash_pass(crypto.createHash('sha256').update(req.body.adminpass, 'utf8').digest("hex"));
        req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("hex");
        var userpass = req.body.userpass;
        var channel_name = cleanChannelName(req.params.channel_name);
        var video_id = req.params.video_id;
        if(typeof(userpass) != "string" || typeof(adminpass) != "string") {
                throw "Wrong format";
            }
    } catch(e) {
        res.sendStatus(400);
        return;
    }

    checkTimeout(guid, res, "DELETE", function() {
        validateLogin(adminpass, userpass, channel_name, "delete", res, function(exists) {
            if(!exists) {
                res.sendStatus(404);
                return;
            }
            db.collection(channel_name).find({id:video_id, now_playing: false}, function(err, docs){
                if(docs.length == 0) {
                    res.sendStatus(404);
                    return;
                }
                dont_increment = true;
                if(docs[0]){
                    if(docs[0].type == "suggested"){
                        dont_increment = false;
                    }
                    db.collection(channel_name).remove({id:video_id}, function(err, docs){
                        io.to(channel_name).emit("channel", {type:"deleted", value: video_id});
                        if(dont_increment) {
                            db.collection("frontpage_lists").update({_id: channel_name, count: {$gt: 0}}, {$inc: {count: -1}, $set:{accessed: Functions.get_time()}}, {upsert: true}, function(err, docs){
                                updateTimeout(guid, res, "DELETE", function(err, docs) {
                                    res.sendStatus(200);
                                    return;
                                });
                            });
                        } else {
                            updateTimeout(guid, res, "DELETE", function(err, docs) {
                                res.sendStatus(200);
                                return;
                            });
                        }
                    });
                }
            });
        });
    });
});

router.route('/api/conf/:channel_name').put(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if(!req.body.hasOwnProperty('adminpass') || !req.body.hasOwnProperty('userpass') ||
        !req.params.hasOwnProperty('channel_name') || !req.body.hasOwnProperty('vote') ||
        !req.body.hasOwnProperty('addsongs') || !req.body.hasOwnProperty('longsongs') ||
        !req.body.hasOwnProperty('frontpage') || !req.body.hasOwnProperty('allvideos') ||
        !req.body.hasOwnProperty('skip') || !req.body.hasOwnProperty('shuffle') ||
        !req.body.hasOwnProperty('userpass_changed')) {
        res.sendStatus(400);
        return;
    }
    try {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
        var adminpass = req.body.adminpass == "" ? "" : Functions.hash_pass(crypto.createHash('sha256').update(req.body.adminpass, 'utf8').digest("hex"));
        req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("hex");
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
        res.sendStatus(400);
        return;
    }
    checkTimeout(guid, res, "CONFIG", function() {
        validateLogin(adminpass, userpass, channel_name, "config", res, function(exists, conf) {
            if(!exists && conf.length == 0) {
                res.sendStatus(404);
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
                    updateTimeout(guid, res, "CONFIG", function(err, docs) {
                        res.header({'Content-Type': 'application/json'});
                        res.status(200).send(JSON.stringify(obj));
                        return;
                    });
                });
            });
        });
    });
});

router.route('/api/list/:channel_name/:video_id').put(function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if(!req.body.hasOwnProperty('adminpass') || !req.body.hasOwnProperty('userpass') ||
        !req.params.hasOwnProperty('channel_name') || !req.params.hasOwnProperty('video_id')) {
        res.sendStatus(400);
        return;
    }

    try {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
        var adminpass = req.body.adminpass == "" ? "" : Functions.hash_pass(crypto.createHash('sha256').update(req.body.adminpass, 'utf8').digest("hex"));
        req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("hex");
        var userpass = req.body.userpass;
        var channel_name = cleanChannelName(req.params.channel_name);
        var video_id = req.params.video_id;
        if(typeof(userpass) != "string" || typeof(adminpass) != "string") {
                throw "Wrong format";
            }
    } catch(e) {
        res.sendStatus(400);
        return;
    }

    checkTimeout(guid, res, "PUT", function() {
        validateLogin(adminpass, userpass, channel_name, "vote", res, function(exists) {
            if(!exists) {
                res.sendStatus(404);
                return;
            }
            db.collection(channel_name).find({id: video_id, now_playing: false, type:"video"}, function(err, song) {
                if(song.length == 0) {
                    res.sendStatus(404);
                    return;
                } else if(song[0].guids.indexOf(guid) > -1) {
                    res.sendStatus(409);
                    return;
                } else {
                    song[0].votes += 1;
                    song[0].guids.push(guid);
                    db.collection(channel_name).update({id: video_id}, {$inc:{votes:1}, $set:{added:Functions.get_time(), type: "video"}, $push :{guids: guid}}, function(err, success) {
                        io.to(channel_name).emit("channel", {type: "vote", value: video_id, time: Functions.get_time()});
                        List.getNextSong(channel_name, function() {
                            updateTimeout(guid, res, "PUT", function(err, docs) {
                                res.header({'Content-Type': 'application/json'});
                                res.status(200).send(JSON.stringify(song[0]));
                                return;
                            });
                        });
                    });
                }
            })
        });
    });
});

router.route('/api/list/:channel_name/__np__').post(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    if(!req.body.hasOwnProperty('userpass')) {
        res.sendStatus(400);
        return;
    }

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
    var channel_name = req.params.channel_name;
    req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("hex");
    var userpass = req.body.userpass;

    if(typeof(userpass) != "string") {
        res.sendStatus(400);
        return;
    }

    checkTimeout(guid, res, "POST", function() {
        db.collection(channel_name).find({now_playing: true}, toShowChannel, function(err, list) {
            if(list.length > 0) {
                db.collection(channel_name + "_settings").find({views: {$exists: true}}, function(err, conf) {
                    if(conf.length == 0) {
                        res.sendStatus(404);
                        return;
                    } else if(conf[0].userpass != userpass && conf[0].userpass != "") {
                        res.sendStatus(403);
                        return;
                    }
                    updateTimeout(guid, res, "POST", function(err, docs) {
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send(JSON.stringify(list[0]));
                    });
                });
            } else {
                res.sendStatus(404);
            }
        });
    });
});

router.route('/api/list/:channel_name/:video_id').post(function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    var fetch_only = false;
    if(req.body.hasOwnProperty('fetch_song')) {
        fetch_only = true;
    }
    if(!fetch_only && (!req.body.hasOwnProperty('adminpass') || !req.body.hasOwnProperty('userpass') ||
        !req.params.hasOwnProperty('channel_name') || !req.params.hasOwnProperty('video_id') ||
        !req.body.hasOwnProperty('duration') || !req.body.hasOwnProperty('start_time') ||
        !req.body.hasOwnProperty('end_time') || !req.body.hasOwnProperty('title'))) {
        res.sendStatus(400);
        return;
    }
    try {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
        req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("hex");
        var userpass = req.body.userpass;
        var channel_name = cleanChannelName(req.params.channel_name);
        var video_id = req.params.video_id;
        if(!fetch_only) {
            var adminpass = req.body.adminpass == "" ? "" : Functions.hash_pass(crypto.createHash('sha256').update(req.body.adminpass, 'utf8').digest("hex"));
            var duration = parseInt(req.body.duration);
            var start_time = parseInt(req.body.start_time);
            var end_time = parseInt(req.body.end_time);
            if(duration != end_time - start_time) duration = end_time - start_time;
            var title = req.body.title;
            if(typeof(userpass) != "string" || typeof(adminpass) != "string" ||
                typeof(title) != "string") {
                    throw "Wrong format";
                }
        }
    } catch(e) {
        res.sendStatus(400);
        return;
    }

    checkTimeout(guid, res, "POST", function() {
        var type = fetch_only ? "fetch_song" : "add";
        validateLogin(adminpass, userpass, channel_name, type, res, function(exists, conf, authenticated) {
            db.collection(channel_name).find({id: video_id}, function(err, result) {
                if(result.length == 0 || result[0].type == "suggested") {
                    var song_type = authenticated ? "video" : "suggested";
                    if(fetch_only && result.length == 0) {
                        res.sendStatus(404);
                        return;
                    }

                    db.collection(channel_name).find({now_playing: true}, function(err, now_playing) {
                        var set_np = false;
                        if(now_playing.length == 0 && authenticated) {
                            set_np = true;
                        }
                        var new_song = {"added": Functions.get_time(),"guids":[guid],"id":video_id,"now_playing":set_np,"title":title,"votes":1, "duration":duration, "start": parseInt(start_time), "end": parseInt(end_time), "type": song_type};
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
                            db.collection(channel_name).update(new_song, {upsert: true}, function(err, success) {
                                if(create_frontpage_lists) {
                                    db.collection("frontpage_lists").update({"_id": channel_name, "count" : 1, "frontpage": true, "accessed": Functions.get_time(), "viewers": 1}, {upsert: true}, function(err, docs) {
                                        if(authenticated) {
                                            io.to(channel_name).emit("channel", {type: "added", value: new_song});
                                        } else {
                                            io.to(coll).emit("suggested", new_song);
                                        }
                                        postEnd(channel_name, configs, new_song, guid, res);
                                    });
                                } else if(set_np) {
                                    Frontpage.update_frontpage(channel_name, video_id, title, function() {
                                        io.to(channel_name).emit("np", new_song);
                                        postEnd(channel_name, configs, new_song, guid, res);
                                    });
                                } else {
                                    db.collection("frontpage_lists").update({"_id": channel_name}, {$inc: {count: 1}}, function(err, docs) {
                                        io.to(channel_name).emit("channel", {type: "added", value: new_song});
                                        postEnd(channel_name, configs, new_song, guid, res);
                                    });
                                }
                            });
                        })
                    })
                } else if(fetch_only) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send(JSON.stringify(result[0]));
                    return;
                } else {
                    res.sendStatus(409);
                    return;
                }
            });
        });
    });
});

router.route('/api/list/:channel_name').get(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    var channel_name = req.params.channel_name;
    db.collection(channel_name).find({views: {$exists: false}}, toShowChannel, function(err, docs) {
        if(docs.length > 0) {
            db.collection(channel_name + "_settings").find({views: {$exists: true}}, function(err, conf) {
                if(conf.length == 0) {
                    res.sendStatus(404);
                    return;
                } else if(conf[0].userpass != "" && conf[0].userpass != undefined) {
                    res.sendStatus(403);
                    return;
                }
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify(docs));
            });
        } else {
            res.sendStatus(404);
        }
    });
});

router.route('/api/list/:channel_name/:video_id').get(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    var channel_name = req.params.channel_name;
    var video_id = req.params.video_id;
    var searchQuery = {id: video_id};
    if(video_id == "__np__") {
        searchQuery = {now_playing: true};
    }
    db.collection(channel_name).find(searchQuery, toShowChannel, function(err, docs) {
        if(docs.length > 0) {
            db.collection(channel_name + "_settings").find({views: {$exists: true}}, function(err, conf) {
                if(conf.length == 0) {
                    res.sendStatus(404);
                    return;
                } else if(conf[0].userpass != "" && conf[0].userpass != undefined) {
                    res.sendStatus(403);
                    return;
                }
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify(docs[0]));
                return;
            });
        } else {
            res.sendStatus(404);
            return;
        }
    });
});

router.route('/api/conf/:channel_name').get(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    var channel_name = req.params.channel_name;
    db.collection(channel_name + "_settings").find({views: {$exists: true}}, toShowConfig, function(err, docs) {
        if(docs.length > 0 && docs[0].userpass == "" || docs[0].userpass == undefined) {
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
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify(conf));
        } else if(docs.length > 0 && docs[0].userpass != "" && docs[0].userpass != undefined){
            res.sendStatus(403);
            return;
        } else {
            res.sendStatus(404);
            return;
        }
    });
});

router.route('/api/conf/:channel_name').post(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    if(!req.body.hasOwnProperty('userpass')) {
        res.sendStatus(400);
        return;
    }
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
    var channel_name = req.params.channel_name;
    req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("hex");
    var userpass = req.body.userpass;

    if(typeof(userpass) != "string") {
        res.sendStatus(400);
        return;
    }

    checkTimeout(guid, res, "POST", function() {
        db.collection(channel_name + "_settings").find({views: {$exists: true}}, toShowConfig, function(err, docs) {
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
                updateTimeout(guid, res, "POST", function(err, docs) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send(JSON.stringify(conf));
                });
            } else if(docs.length > 0 && docs[0].userpass != userpass) {
                res.sendStatus(403);
                return;
            } else {
                res.sendStatus(404);
                return;
            }
        });
    });
});

router.route('/api/list/:channel_name').post(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    if(!req.body.hasOwnProperty('userpass')) {
        res.sendStatus(400);
        return;
    }

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var guid = Functions.hash_pass(req.get('User-Agent') + ip + req.headers["accept-language"]);
    var channel_name = req.params.channel_name;
    req.body.userpass = req.body.userpass == "" ? "" : crypto.createHash('sha256').update(req.body.userpass, 'utf8').digest("hex");
    var userpass = req.body.userpass;

    if(typeof(userpass) != "string") {
        res.sendStatus(400);
        return;
    }

    checkTimeout(guid, res, "POST", function() {
        db.collection(channel_name).find({views: {$exists: false}}, toShowChannel, function(err, list) {
            if(list.length > 0) {
                db.collection(channel_name + "_settings").find({views: {$exists: true}}, function(err, conf) {
                    if(conf.length == 0) {
                        res.sendStatus(404);
                        return;
                    } else if(conf[0].userpass != userpass && conf[0].userpass != "") {
                        res.sendStatus(403);
                        return;
                    }
                    updateTimeout(guid, res, "POST", function(err, docs) {
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send(JSON.stringify(list));
                    });
                });
            } else {
                res.sendStatus(404);
            }
        });
    });
});

router.route('/api/imageblob').post(function(req, res) {
    var Jimp = require("jimp");
    Jimp.read('https://img.youtube.com/vi/' + req.body.id + '/mqdefault.jpg', function (err, image) {
        if (err) console.log(err);
        image.blur(50)
        .write(path.join(pathThumbnails, '/public/assets/images/thumbnails/' + req.body.id + '.jpg'), function(e, r) {
            res.status(200).send(req.body.id + ".jpg");
            return;
        });
    });
});

var nodemailer = require('nodemailer');
try {
    var mailconfig = require(path.join(__dirname, '../../config/mailconfig.js'));
    var recaptcha_config = require(path.join(__dirname, '../../config/recaptcha.js'));
    var Recaptcha = require('express-recaptcha');
    var RECAPTCHA_SITE_KEY = recaptcha_config.site;
    var RECAPTCHA_SECRET_KEY = recaptcha_config.key;
    var recaptcha = new Recaptcha(RECAPTCHA_SITE_KEY, RECAPTCHA_SECRET_KEY);

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

function updateTimeout(guid, res, type, callback) {
    db.collection("timeout_api").update({type: "DELETE", guid: guid}, {
        $set: {
            "createdAt": new Date(),
            type: "DELETE",
            guid: guid,
        },
    }, {upsert: true}, function(err, docs) {
        callback(err, docs);
    });
}

function checkTimeout(guid, res, type, callback) {
    db.collection("timeout_api").find({
        type: type,
        guid: guid,
    }, function(err, docs) {
        if(docs.length > 0) {
            var date = new Date(docs[0].createdAt);
            date.setSeconds(date.getSeconds() + 2);
            var now = new Date();
            var retry_in = (date.getTime() - now.getTime()) / 1000;
            if(retry_in > 0) {
                res.header({'Retry-After': retry_in});
                res.sendStatus(429);
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
    db.collection(channel_name + "_settings").find({views: {$exists: true}}, function(err, conf) {
        var exists = false;
        if(conf.length > 0 && ((conf[0].userpass == undefined || conf[0].userpass == "" || conf[0].userpass == userpass))) {
            exists = true;
        } else if(conf.length > 0 && type != "config") {
            res.sendStatus(403);
            return;
        }

        if(
            (type == "fetch_song") ||
            (type == "add" && ((conf[0].addsongs && (conf[0].adminpass == "" || conf[0].adminpass == undefined || conf[0].adminpass == adminpass)) || !conf[0].addsongs)) ||
            (type == "delete" && (conf[0].adminpass == "" || conf[0].adminpass == undefined || conf[0].adminpass == adminpass)) ||
            (type == "vote" && ((conf[0].vote && (conf[0].adminpass == "" || conf[0].adminpass == undefined || conf[0].adminpass == adminpass)) || !conf[0].vote)) ||
            (type == "config" && (conf[0].adminpass == "" || conf[0].adminpass == undefined || conf[0].adminpass == adminpass))
        ) {
            callback(exists, conf);
        } else if(type == "add") {
            callback(exists, conf, false);
        } else {
            res.sendStatus(403);
            return;
        }
    });
}

function postEnd(channel_name, configs, new_song, guid, res) {
    if(configs != undefined) {
        io.to(channel_name).emit("conf", configs);
    }
    List.getNextSong(channel_name, function() {
        updateTimeout(guid, res, "POST", function(err, docs) {
            Search.get_correct_info(new_song, channel_name, !new_song.now_playing, function() {
                res.header({'Content-Type': 'application/json'});
                res.status(200).send(JSON.stringify(new_song));
                return;
            });
        });
    });
}

module.exports = router;
