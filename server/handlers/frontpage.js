function frontpage_lists(msg, socket) {
    if(msg == undefined || !msg.hasOwnProperty('version') || msg.version != VERSION || msg.version == undefined) {
        var result = {
            version: {
                expected: VERSION,
                got: msg.hasOwnProperty("version") ? msg.version : undefined,
            }
        };
        socket.emit('update_required', result);
        return;
    }

    db.collection("frontpage_lists").find({frontpage:true}, function(err, docs){
        db.collection("connected_users").find({"_id": "total_users"}, function(err, tot){
            socket.compress(true).emit("playlists", {channels: docs, viewers: tot[0].total_users.length});
        });
    });
}

function update_frontpage(coll, id, title, thumbnail, callback) {
    coll = coll.replace(/ /g,'');
    db.collection("frontpage_lists").update({_id: coll}, {$set: {
        id: id,
        title: title,
        thumbnail: thumbnail,
        accessed: Functions.get_time()}
    },{upsert: true}, function(err, returnDocs){
        if(typeof(callback) == "function") callback();
    });
}

module.exports.frontpage_lists = frontpage_lists;
module.exports.update_frontpage = update_frontpage;
