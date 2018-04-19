module.exports = function(app, logger, User, Item,jwt,config) {
	app.post('/search', function(req, res) {		
		logger.verbose(req.body);
		var token = req.cookies.jwt;
		var currUser = null;
		jwt.verify(token, config.secret, function(err, decoded) {
			if (err) {
				logger.error(err);
			}
			if (!err && decoded != null) currUser = decoded._id;
			else currUser = null;
		});
		var timestamp = req.body.timestamp;
		var limit = req.body.limit;
		var username = req.body.username;
		var q = req.body.q;
		var following = req.body.following;
		var rank = req.body.rank;
		var parent = req.body.parent;
		var replies = req.body.replies;
		var hasMedia = req.body.hasMedia;
		//console.log(currUser);
		//console.log(typeof(currUser));
		var must_json = [];
		
		if (typeof limit == 'string' || limit instanceof String)
            limit = parseInt(limit, 10);
		if (typeof limit == 'undefined' || req.body.limit == null) {
			limit = 25;
		} else if (limit > 100)
			limit = 100;

		if (typeof timestamp == 'string' || timestamp instanceof String)
            timestamp = parseInt(timestamp, 10);

        if (timestamp != null)
            must_json.push({"range": {"timestamp": timestamp}});	
		if (username != null)
            must_json.push({"term": {"username": username }});
        if (q != 'undefined' && q != null)
            must_json.push({"match_phrase": {"content": q}});
		if (parent != null)
			must_json.push({"term": {"childType": "reply"}});
			//must_json.push({"term": {"parent": parent}});
		if (hasMedia == true)
			must_json.push({"exists": {"field": "media"}});
			//must_json.push({"term": {"hasMedia": true}});
		
		if (following == null || following == true) {
			User.findById(currUser,(err,result)=>{	
				
				if(err) {
					logger.error(err);
					return res.json({status: "ERROR", error: err})
				} else if(result == null || result.following.length == 0) {
					//console.log("No results");
					console.log("why here?");
					return res.json({ status: "OK", items: [] });
				} else {
					//console.log(result);
					must_json.push({"terms": {"username": result.following}});
					search(must_json, limit, rank, replies);
				};
			});
		} else {
			search(must_json, limit, rank, replies);
		};
			
		function search(must_json, limit, rank, replies) {
			if (replies == false)
				var must_not = {"exists": { "field": "parent"}};
			if (must_json.length != 0 && must_not)
				var filter = { "bool": { "must": must_json }};
			else if (must_json.length != 0 && !must_not)
				var filter = { "bool": { "must": must_json, "must_not": must_not }};
			else if (must_json.length == 0 && must_not)
				var filter = { "bool": { "must_not": must_not }};
			if (rank == null || rank == "interest") {
				var must = [
					{"function_score": {"field_value_factor": {"field": "likes"}}},
        			{"function_score": {"field_value_factor": {"field": "retweeted"}}}
      			];
			} else
				var sort = { "timestamp": "desc"};

			if (filter && must)
                var query = {"query": {"bool" : {"filter": filter, "must": must}}};//, "size": limit}; 
            else if (filter && !must)
                var query = {"query": {"bool" : {"filter": filter}}, "sort": sort, "size": limit};
            else if (!filter && must)
                var query = {"query": {"bool" : {"must": must}}, "size": limit};
            else
                var query = {"query" : {"match_all": {}}, "sort": sort, "size": limit};

			/*
			if (filter && must && must_not)
				var query = {"query": {"bool" : {"filter": filter, "must": must, "must_not": must_not}}, "size": limit};
			else if (filter && must && !must_not)
                var query = {"query": {"bool" : {"filter": filter, "must": must}}, "size": limit};
			else if (filter && !must && must_not)
				var query = {"query": {"bool" : {"filter": filter, "must_not": must_not}}, "sort": sort, "size": limit};
			else if (filter && !must && !must_not)
                var query = {"query": {"bool" : {"filter": filter}}, "sort": sort, "size": limit};
			else if (!filter && must && must_not)
                var query = {"query": {"bool" : {"must": must, "must_not": must_not}}, "size": limit};
			else if (!filter && must && !must_not)
                var query = {"query": {"bool" : {"must": must}}, "size": limit};
			else if (!filter && !must && must_not)
				var query = {"query": {"bool" : {"must_not": must_not}},"sort": sort, "size": limit};
			else
				var query = {"sort": sort, "size": limit};
			*///
			//console.log("LAST MUST JSON >>> "+JSON.stringify(must_json));
//			console.log("QUERY "+JSON.stringify(query, null, 4));
			Item
				.esRefresh()
				.then(function () {
					Item.esSearch(query, function(err, results) {
						if (err) {
							logger.error(err);
							return res.json({status: "ERROR", error: err});
						} else {
							console.log(results)
							var newArray = results.hits.hits.map(function(hit) {
								//console.log(hit);
								return {
									id: hit._id,
									username: hit._source.username,
									property: {
										likes: hit._source.likes
									},
									retweeted: hit._source.retweeted,
									content: hit._source.content,
									timestamp: hit._source.timestamp,
									childType: hit._source.childType,
									parent: hit._source.parent,
									media: hit._source.media
								};
							})
							return res.json({status: "OK", items: newArray});
						};
					});
				});
		};
	});
};
