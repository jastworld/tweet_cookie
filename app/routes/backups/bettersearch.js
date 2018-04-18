module.exports = function(app, client, asyncLoop, logger, User) {
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
		if (typeof timestamp == 'undefined' || timestamp == null)
			timestamp = Math.floor(new Date() / 1000);

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
		} else if (following == false) {
			if (timestamp != null) {
				if (username == null && q == null) {
					const query = 'SELECT * FROM item_by_username WHERE timestamp <= ? LIMIT ?';
					const params = [timestamp, limit];
					executeQuery(query, params);
				} else if (username != null && q == null) {
					const query = 'SELECT * FROM item_by_username WHERE timestamp <= ? AND username = ? LIMIT ?';
					const params = [timestamp, username, limit];	
					executeQuery(query, params);
				} else if (username == null && q != null) {
					const query = 'SELECT * FROM item_by_username WHERE timestamp <= ? AND content LIKE ? LIMIT ?';
					const params = [timestamp, q, limit];
					executeQuery(query, params);
				} else {
					const query = 'SELECT * FROM item_by_username WHERE timestamp <= ? AND username = ? AND content LIKE ? LIMIT ?';
					const params = [timestamp, username, q, limit];
					executeQuery(query, params);
				};
			} else {
				if (username == null && q == null) {
                    const query = 'SELECT * FROM item_by_username LIMIT ?';
                    const params = [limit];
                    executeQuery(query, params);
                } else if (username != null && q == null) {
                    const query = 'SELECT * FROM item_by_username WHERE username = ? LIMIT ?';
                    const params = [username, limit]; 
                    executeQuery(query, params);
                } else if (username == null && q != null) {
                    const query = 'SELECT * FROM item_by_username WHERE content LIKE ? LIMIT ?';
                    const params = [q, limit];
                    executeQuery(query, params);
                } else {
                    const query = 'SELECT * FROM item_by_username WHERE username = ? AND content LIKE ? LIMIT ?';
                    const params = [username, q, limit];
                    executeQuery(query, params);
                };
			};
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
					users = result.following;	
					//var users = ["sponge", "bob", "meep"];
					if (timestamp != null) { 
						if (username == null && q == null) {
							const query = 'SELECT * FROM item_by_username WHERE timestamp <= ?';
							const params = [timestamp];
							executeManQuery(query, params, limit, users);	
						} else if (username != null && q == null) {
							const query = 'SELECT * FROM item_by_username WHERE timestamp <= ? AND username = ? LIMIT ?';
							const params = [timestamp, username, limit];
							executeQuery(query, params);
						} else if (username == null && q != null) {
							const query = 'SELECT * FROM item_by_username WHERE timestamp <= ? AND content LIKE ?';
							const params = [timestamp, q];
							executeManQuery(query, params, limit, users);
						} else {
							const query = 'SELECT * FROM item_by_username WHERE timestamp <= ? AND username = ? AND content LIKE ?';
							const params = [timestamp, username, q];
							executeManQuery(query, params, limit, users);	
						};
					} else {
                        if (username == null && q == null) {
                            const query = 'SELECT * FROM item_by_username WHERE username IN ? LIMIT ?';
                            const params = [users, limit];
                            executeQuery(query, params); 
                        } else if (username != null && q == null) {
                            const query = 'SELECT * FROM item_by_username WHERE username = ? LIMIT ?';
                            const params = [username, limit];
                            executeQuery(query, params);
                        } else if (username == null && q != null) {
                            const query = 'SELECT * FROM item_by_username WHERE content LIKE ?';
                            const params = [q];
                            executeManQuery(query, params, limit, users);
                        } else {
                            const query = 'SELECT * FROM item_by_username WHERE username = ? AND content LIKE ?';
                            const params = [username, q];
                            executeManQuery(query, params, limit, users);
                        };
					};
				};
			});
		};
		
		function executeManQuery(query, params, limit, users) {	
			 client.execute(query, params, {prepare: true}, function(err, result) {
				sendManResult(err, result, limit, users);
            });
		}
		var sendManResult = function(err, result, limit, users) {
			if (err) {
				logger.error(err);
				return res.json({ status: "ERROR", error: err });
			} else if (result.rowLength == 0) {
				return res.json({ status: "OK", items: [] });
			} else {
				var items = [];
				asyncLoop(result.rows, function (curr_row, next) {
					if (users.indexOf(curr_row.username) > -1) {
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
					} else {next();}
				}, function (err) {
					if (err) {
						logger.error(err);
						return res.json({ status: "ERROR", error: err });
					} else {
						items = items.slice(0, limit);
						return res.json({ status: "OK", items: items });
					}
				});
			};
		}
				
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
