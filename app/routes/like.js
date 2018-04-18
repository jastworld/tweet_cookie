module.exports = function(app, logger, Item,verifyToken) {
	app.post('/item/:itemId/like', verifyToken, function(req, res) {
		var itemID = req.params.itemId;
		var like = req.body.like;
		if (like == "false")
			like_amt = -1;
		else
			like_amt = 1;
		Item.findById(req.params.itemId, function(err, item) {
			if (like_amt == 1 || (like_amt == -1 && item.likes > 0)) {
				item.likes = item.likes + like_amt;
				item.save(function (err) {
					if (err) {
						logger.error(err);
						return res.json({ status: "error", error: err });
					} else {
						return res.json({ status: "OK"});
					};
				});
			} else {
			    return res.json({ status: "error", error: "you cannot unlike this item"});
			};
		});
	});
};
