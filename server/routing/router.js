var express = require('express');
var router = express.Router();
var path = require('path');
var mongo_db_cred = {config: 'mydb'};
var mongojs = require('mongojs');
var db = mongojs(mongo_db_cred.config);

router.use(function(req, res, next) {
    next(); // make sure we go to the next routes and don't stop here
});

router.route('/:channel_name').get(function(req, res, next){
    channel(req, res, next);
});

router.route('/').get(function(req, res, next){
    root(req, res, next);
});

router.route('/').post(function(req, res, next){
    root(req, res, next);
});

function root(req, res, next) {
    try{
        var url = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'] : req.headers.host.split(":")[0];
        var subdomain = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'].split(".") : req.headers.host.split(":")[0].split(".");
        if(url != "zoff.me" && url != "remote.zoff.me" && url != "fb.zoff.me" && url != "remote.localhost" && url != "localhost") {
            res.redirect("https://zoff.me");
            return;
        }
        if(subdomain[0] == "remote") {
            var data = {
                year: 2017,
                javascript_file: "remote.min.js"
            }
            res.render('layouts/remote', data);
        } else if(subdomain[0] == "www") {
            res.redirect("https://zoff.me");
        } else {
            var data = {
                year: 2017,
                javascript_file: "main.min.js",
            }
            res.render('layouts/frontpage', data);
        }
    } catch(e) {
        //console.log(e);
        //res.redirect("https://zoff.me");
    }
}

function channel(req, res, next) {
    try{
        var url = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'] : req.headers.host.split(":")[0];
        var subdomain = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'].split(".") : req.headers.host.split(":")[0].split(".");
        if(url != "zoff.me" && url != "remote.zoff.me" && url != "fb.zoff.me" && url != "remote.localhost" && url != "localhost") {
            res.redirect("https://zoff.me");
            return;
        }
        if(subdomain[0] == "remote") {
            var data = {
                year: 2017,
                javascript_file: "remote.min.js"
            }
            res.render('layouts/remote', data);
        } else if(subdomain.length >= 2 && subdomain[0] == "www") {
            res.redirect("https://zoff.me");
        } else {
            if(req.params.channel_name == "_embed") {
                res.sendFile(path.join(pathThumbnails, '/public/assets/html/embed.html'));
            } else if(req.params.channel_name == "o_callback") {
                res.sendFile(path.join(pathThumbnails, '/public/assets/html/callback.html'));
            } else {
                var data = {
                    list_name: capitalizeFirstLetter(req.params.channel_name),
                    year: 2017,
                    javascript_file: "main.min.js"
                }
                res.render('layouts/channel', data);
            }
        }
    } catch(e) {
      res.redirect("https://zoff.me");
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = router;
