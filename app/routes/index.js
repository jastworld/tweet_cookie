const addItem = require('./add_item');
const deleteItem = require('./delete_item');
const item = require('./item');
const search = require('./search');
const like = require('./like');

module.exports = function(app, time_uuid, asyncLoop, logger, User, Item, mongoose, memcached,verifyToken,jwt,config) {
	addItem(app, time_uuid, logger, Item, mongoose, memcached,verifyToken);
    	deleteItem(app, logger, Item, mongoose,verifyToken);
	item(app, logger, Item, memcached);
	search(app, logger, User, Item,jwt,config);
	like(app, logger, Item,verifyToken,memcached);
};
