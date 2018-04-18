
const winston = require('winston');

require('winston-syslog').Syslog;
var config = require('./config');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.prettyPrint(),
	transports: [
		new winston.transports.Syslog({handleExceptions: true})
	]
});

const express = require('express');
const bodyParser = require('body-parser');
const cassandra = require('cassandra-driver');
const time_uuid = cassandra.types.TimeUuid;
const asyncLoop = require('node-async-loop');
//const mongoosastic = require('mongoosastic');
const Memcached = require('memcached');
const memcached = new Memcached('127.0.0.1:11211');
const mexp = require('mongoose-elasticsearch-xp');
const mongoose = require('mongoose');
const connStr = 'mongodb://130.245.169.105:27017/twitter';
//const connStr = 'mongodb://130.245.168.77:27017/twitter';
const jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
var verifyToken   = require('./verifyToken');

mongoose.connect(connStr,{ mongos: true }, function(err) {
    if (err)
	logger.error(err);
    else
        logger.info('Successfully connected to MongoDB');
});
const User = require('./models/User');

const ItemSchema = require("./models/Item");

ItemSchema.plugin(mexp, {
    host:"130.245.168.77",
	index: "items",
    port: 9200
});

/*
ItemSchema.plugin(mongoosastic, {
	host:"130.245.168.77",
	port: 9200
});
*/
Item = mongoose.model('Item', ItemSchema);

Item.esCreateMapping(function(err, mapping) {
    if (err) {
        logger.info('error creating mapping (you can safely ignore this)');
        logger.info(err);
    } else {
        logger.info('mapping created!');
    };
});

/*
Item.createMapping(function(err, mapping) {
	if (err) {
    	console.log('error creating mapping (you can safely ignore this)');
    	console.log(err);
	} else {
    	console.log('mapping created!');
    	console.log(mapping);
	};
});
*/
//const client = new cassandra.Client({contactPoints: ['130.245.169.115'], keyspace: 'm1'});
//const client = new cassandra.Client({contactPoints: ['130.245.169.115'], keyspace: 'm2'});
//const client = new cassandra.Client({contactPoints: ['130.245.170.176'], keyspace: 'm3'});

const app = express();
const port = 80;
/*
const { EventEmitter } = require('events');
const profiles = new EventEmitter();

profiles.on('route', ({ req, elapsedMS }) => {
    logger.info(req.method, req.url, `${elapsedMS}ms`);
});

// Make sure you register this **before** other middleware
app.use(function profilerMiddleware(req, res, next) {
    const start = Date.now();
    // The 'finish' event will emit once the response is done sending
    res.once('finish', () => {
        // Emit an object that contains the original request and the elapsed time in MS
        profiles.emit('route', { req, elapsedMS: Date.now() - start });
    });
    next();
});
*/
app.use(bodyParser.urlencoded({ extended:true }));
app.use(bodyParser.json());
app.use(cookieParser());

require('./app/routes')(app, time_uuid, asyncLoop, logger, User, Item, mongoose, memcached,verifyToken,jwt,config);
app.listen(port, () => {
	logger.info('Started tweet MS');
	//console.log("Running on port " + port);
});
