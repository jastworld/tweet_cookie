module.exports = function(app, logger, Item,verifyToken,memcached) {
	app.post('/item/:itemId/like', verifyToken, function(req, res) {	
		var itemID = req.params.itemId;
		var like = req.body.like;
		//console.log("Used me")
		/*
		if (like == false)
			like_amt = -1;
		else
			like_amt = 1;
		Item.findById(req.params.itemId, function(err, item) {
			if (like_amt == 1 || (like_amt == -1 && item.likes > 0)) {
				item.likes = item.likes + like_amt;
				//console.log(item.likes);
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
		});*/
		if(like == false){
			Item.findByIdAndUpdate(itemID,{$inc: {"likes":-1}},function(err,item){
				if(err){
					logger.error(err);
					res.json({status:"error", error: err})
				}else{
					item.likes = item.likes-1;
					//res.json({status: "OK"})
					memcached.set(itemID,item.toClient(),3600,(err,result)=>{
						if(err)
							logger.error(err)
						else res.json({status: "OK"})
					})
				}
			});
		}else{
			 Item.findByIdAndUpdate(itemID,{$inc: {"likes":1}},function(err,item){
				if(err){ 
                                        logger.error(err);
                                        res.json({status:"error", error: err})
                                }else{ 
                                        res.json({status: "OK"})
					item.likes =item.likes+1
					memcached.set(itemID,item.toClient(),3600,(err,result)=>{
                                                if(err)
                                                        logger.error(err)
						else res.json({status: "OK"})
                                        })
                                }
                        })
		}
		//return res.json({status: "OK"})
	});
};
