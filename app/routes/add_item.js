module.exports = function(app, time_uuid, logger, Item, mongoose, memcached,verifyToken) {
        
	const request = require('request');
	app.post('/additem', verifyToken, function(req, res) {
		//console.log(req.body);
		if (req.body.parent != null && req.body.parent.length == 0)
			req.body.parent = null;
		var ID = mongoose.Types.ObjectId();
		var item = new Item ({
			_id: ID,
			username: req.user.username,
			content: req.body.content,
        		childType: req.body.childType,
			content: req.body.content,
			parent: req.body.parent,
			media: req.body.media
		});
		memcached.add(ID, item, 60, function (err) {
			if (err) {
				logger.error(err);
				return res.json({ status: "ERROR", error: err });
			} else {
				//logger.info("sent response for" + ID);
				//console.log("sent response for" + ID);
				res.json({ status: "OK", id: ID});
			};
		});
		item.save(function(err) {
			if (err) {
				logger.error(err);
				return res.json({status: "ERROR", error: err});	
			} else {
				item.on('es-indexed', function(err,res) {
					if (err)
						logger.error(err);
					//logger.info("indexed" + ID);
					//console.log("indexed" + ID);
				});
				//return res.json({ status: "OK", id: ID});
			}
		});
		//not synchronous
		
		if (req.body.parent != null && req.body.childType == "retweet") {
			Item.findByIdAndUpdate(req.body.parent, { $inc: { retweeted: 1 }}, {new: true}, function (err, item) {
				if (err) {
					logger.error(err.errmsg);
					//return res.json({ status: "ERROR", error: err.errmsg });
				} else {
					//return res.json({ status: "OK"});
				};
			});			
		};
		
		if (req.body.media != null) {
			medias = req.body.media;
			for (var i = 0; i < medias.length; i++) {
				var new_host = 'http://130.245.169.149/insertmedia/' + medias[i];
				request(new_host, function (err, response) {
					if (err) {
						logger.error(err);
						if (err.code === 'ECONNREFUSED') err = "MS refused connections";
						//return res.json({ status: "ERROR", error: err });
					}
					else
						logger.info(response);
				});
		}
		};
	});
};
