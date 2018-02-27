path = require('path'),
pathThumbnails = __dirname;
db = require(pathThumbnails + '/../handlers/db.js');

db.getCollectionNames(function(err, docs) {
    for(var i = 0; i < docs.length; i++) {
        makeNewAndDelete(docs[i]);
    }
})

/*function delete(name) {
    db.collection(name).remove(function(err, doc) {

    })
}*/

function makeNewAndDelete(name) {
    db.collection(name).find({views: {$exists: true}}, function(err, doc) {
        //console.log(doc);
        if(doc.length == 0) {
            //console.log(name);
        } else if(doc.length == 1) {
            db.collection(name + "_settings").insert(doc[0], function(err, result){
                console.log("Result insert", result);
                /*db.collection(name).remove({views: {$exists: true}}, function(err, result_del) {
                    console.log("Result delete", result_del);
                });*/
            });
        }
    });
}
