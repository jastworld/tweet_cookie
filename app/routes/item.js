module.exports = function(app, logger, Item, memcached) {
	app.get('/item/:itemId', function(req, res,next) {
		console.log(">>>>>>>>>>>>>>>"+req.params.itemId);
		var itemID = req.params.itemId;
		memcached.get(itemID, function (err, cached_item) {
			if (err) {
				logger.error(err);
				return res.json({ status: "ERROR", error: err }).end();
			} else if (cached_item != null) {
				cached_item.id = itemID;
				delete cached_item._id;	
				return res.json({ status: "OK", item: cached_item }).end();
			} else {
				Item.findById(req.params.itemId, function (err, item) {
					if (err) {
						logger.error(err.errmsg);
						return res.json({ status: "ERROR", error: err }).end();
					} else {
						if (item == null)
							return res.json({ status: "ERROR", error: "item does not exist" }).end();
						else { 
 				
							//return res.json({ status: "OK", item: item.toClient() });
							memcached.add(itemID, item, 60, function (err) {
								if (err) {
									logger.error(err);
								} else {
									return res.json({ status: "OK", item: item.toClient() }).end();
								};
							});
						}
					};
				});
			};
		});
		/*
		const query = 'SELECT username, likes, retweeted, content, timestamp FROM item WHERE id = ? ALLOW FILTERING';
		const params = [itemID];
		client.execute(query, params, {prepare: true}, function(err, result) {
			if (err) {
				return res.json({ status: "ERROR", error: err });
			} else if (result.rowLength == 0) {
				return res.json({ status: "ERROR", error: "Item does not exist" });
			} else {	
				var username = result.rows[0].username;
				var likes = result.rows[0].likes;
				var retweeted = result.rows[0].retweeted;
				var content = result.rows[0].content;
				var timestamp = result.rows[0].timestamp;
				var item = {
					id: itemID,
					username: username,
					property: {
						likes: likes
					},
					retweeted: retweeted,
					content: content,
					timestamp: timestamp
				};
				return res.json({ status: "OK", item: item });
			}
		});
		*/
	});
};
