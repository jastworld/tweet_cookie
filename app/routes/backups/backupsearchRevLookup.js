module.exports = function(app, client, asyncLoop, logger, User) {
	const async = require('async');
	app.post('/search', function(req, res) {	
		//console.log(req.body);
		var timestamp = req.body.timestamp;
		var limit = req.body.limit;
		var username = req.body.username;
        var q = req.body.q;
		var following = req.body.following;
		var currUser = req.body.currUser;
		//console.log(currUser);
		//console.log(typeof(currUser));
		if (typeof timestamp == 'string' || timestamp instanceof String)
			timestamp = parseInt(timestamp, 10);

		if (typeof limit == 'string' || limit instanceof String)
            limit = parseInt(limit, 10);
		if (typeof limit == 'undefined' || req.body.limit == null) {
			limit = 25;
		} else if (limit > 100)
			limit = 100;

		if (following == null)
			following = true;
		if (q != 'undefined' && q != null)
			q = '%' + q + '%'

		if (limit == 0 || (username != null && username == currUser) && following)
			return res.json({ status: "OK", items: [] });
		else if (following && currUser == null) {
			var err = "You must be logged in to search on following";
			logger.error(err);
			return res.json({ status: "ERROR", error: err });
		} else if (following == false && username == null) {
			queryItem(timestamp, q, limit);
		} else if (following == false && username != null) {
			const query = 'SELECT id FROM item_by_username WHERE username = ?';
			const params = [username];
			queryUser(query, params, q, limit);
		} else {
			//console.log(currUser);
			User.findOne({ username: currUser },(err,result)=>{	
				if(err) {
					logger.error(err);
					return res.json({status: "ERROR", error: err})
				} else if(result == null || result.following.length == 0) {
					//console.log("No results");
					return res.json({ status: "OK", items: [] });
				} else {
					if (username != null && result.following.indexOf(username) > -1) {
						const query = 'SELECT id FROM item_by_username WHERE username = ?';
                        const params = [username];
                        queryUser(query, params, q, limit);
					} else if (username != null && result.following.indexOf(username) <= -1) {
						return res.json({ status: "OK", items: [] });
					} else {
						const query = 'SELECT id FROM item_by_username WHERE username IN ?';
						const params = [result.following];
						queryUser(query, params, q, limit);
					};
				};
			});
		};

        function queryUser(query, params, q, limit) {
			client.execute(query, params, {prepare: true}, function(err, result) {
                if (err) {
                    logger.error(err);
                } else if (result == null || result.rows.length == 0) {
                    return res.json({ status: "OK", items: [] });
                } else {	
					console.log(result.rows[0]);
					asyncLoop(result.rows, function (curr_row, next) {
						curr_row = curr_row.id;
						next();
					}, function (err) {
            	        if (err) {
        	                logger.error(err);
    	                    return res.json({ status: "ERROR", error: err });
	                    } else {
                    		queryItem_id(timestamp, q, result.rows, limit);
						};
					});
                };
            });
        };
		
		function queryItem(timestamp, q, limit) {
			if (timestamp == null) {
				if (q == null) {
					const query = 'SELECT * FROM item LIMIT ?';
					const params = [limit];
					executeQuery(query, params);
				} else {
					const query = 'SELECT * FROM item WHERE content LIKE ? LIMIT ?';
					const params = [content, limit];
					executeQuery(query, params);
				};
			} else {
				if (q == null) {
					const query = 'SELECT * FROM item WHERE timestamp <= ? LIMIT ?';
					const params = [timestamp, limit];
					executeQuery(query, params);
				} else {
					const query = 'SELECT * FROM item WHERE timestamp <= ? AND content LIKE ? LIMIT ?';
					const params = [timestamp, q, limit];
					executeQuery(query, params);
				};
			};
		};

		function queryItem_id(timestamp, q, ids, limit) {	
			if (timestamp == null) {
				if (q == null) {
					const query = 'SELECT * FROM item WHERE id IN ? LIMIT ?';
					const params = [ids, limit];
					executeQuery(query, params);
				} else {
					const query = 'SELECT * FROM item WHERE id IN ? AND content LIKE ? LIMIT ?';
					const params = [ids, q, limit];
					executeQuery(query, params);
				};
			} else {
				if (q == null) {
					const query = 'SELECT * FROM item WHERE id IN ? AND timestamp <= ? LIMIT ?';
					const params = [ids, timestamp, limit];
					executeQuery(query, params);
				} else {
					const query = 'SELECT * FROM item WHERE id IN ? AND timestamp <= ? AND content LIKE ? LIMIT ?';
					const params = [ids, timestamp, q, limit];
					executeQuery(query, params);
				};
			};
		};		
			
		function executeQuery(query, params) {
			client.execute(query, params, {prepare: true}, function(err, result) {
                sendResult(err, result);
            });
		}		
		var sendResult = function(err, result) {	
			if (err) {
				logger.error(err);
				return res.json({ status: "ERROR", error: err });
			} else if (result.rowLength == 0) {
				return res.json({ status: "OK", items: [] });
			} else {
				var items = [];
				asyncLoop(result.rows, function (curr_row, next) {
					var id = curr_row.id;
					var username = curr_row.username;
					var likes = curr_row.likes;
					var retweeted = curr_row.retweeted;
					var content = curr_row.content;
					var timestamp = curr_row.timestamp;
					var item = {
						id: id,
						username: username,
						property: {
							likes: likes
						},
						retweeted: retweeted,
						content: content,
						timestamp: timestamp
					};
					items.push(item);
					next();
				}, function (err) {
					if (err) {
						logger.error(err);
						return res.json({ status: "ERROR", error: err });
					} else {
						return res.json({ status: "OK", items: items });
					}
				});
			};
		};
	});
};
