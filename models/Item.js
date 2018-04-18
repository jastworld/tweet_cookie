
const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ItemSchema = new Schema({
	_id: String,
	username : {
		type: String,
		required: [true, "can't be blank"],
		es_indexed: true,
		es_type: 'keyword'
	},
	likes: {
		type: Number,
		default: 0,
		es_indexed: true,
		es_type: 'long'
	},
	retweeted: {
		type: Number,
		default: 0,
		es_indexed: true,
		es_type: 'long'
	},
	childType: {
		type: String,
		es_indexed: true,
        es_type: 'text'
	},
	parent: {
		type: mongoose.Schema.Types.ObjectId,
		es_indexed: true,
        es_type: 'keyword'
	},
	content: {
		type: String,
        required: [true, "can't be blank"],
		es_indexed: true,
		es_type: 'text'
	},
	timestamp: {
		type: Date,
		default: Math.floor(new Date() / 1000),
		es_indexed: true,
		es_type:'date'
	},
	media: {
		type: [String],
		es_indexed: true
	}
},{_id: false, collection: 'itemCollection', versionKey: false});

ItemSchema.methods.toClient = function() {
	var obj = this.toObject();
    //Rename fields
    obj.id = obj._id;
    delete obj._id;
    return obj;
};

module.exports = ItemSchema;
