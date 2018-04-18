module.exports = function(app, client, time_uuid, logger) {
	app.post('/additem', function(req, res) {
		var username = req.body.username;
		var content = req.body.content;
		var childType = req.body.childType;
		var ID = time_uuid.now();
		var timestamp = Math.floor(new Date() / 1000);
		const query = 'INSERT INTO item (id, username, likes, retweeted, content, timestamp) VALUES (?,?,?,?,?,?)';
		const params = [ID, username, 0, 0, content, timestamp];
		client.execute(query, params, {prepare: true}, function(err, result) {
			if (err) {
				console.log(err);
				return res.json({ status: "ERROR", error: err });
			} else return res.json({ status : "OK", id: ID });
		});
	});
};
