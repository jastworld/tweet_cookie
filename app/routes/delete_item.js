module.exports = function(app, logger, Item, mongoose,verifyToken) {
	app.delete('/item/:itemId', verifyToken, function(req, res) {
		var itemID = mongoose.Types.ObjectId(req.params.itemId);	
		Item.findByIdAndRemove(itemID, function(err, result) {
			if (err) {
				logger.error(err.errmsg);
				//res.sendStatus(500);
				res.json({status: 'error', error: err})
			} else {
				//res.sendStatus(200);
				res.json({status: 'OK'})
			};
		});	
		/*
		const query = 'DELETE FROM item WHERE id = ?';
		const params = [itemID];
		client.execute(query, params, {prepare: true}, function(err, result) {
			if (err) {
				logger.error(err);
				res.sendStatus(500);
			} else {
				res.sendStatus(200);
			};
		});*/
	});
};

