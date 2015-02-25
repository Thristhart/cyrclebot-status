var config = require('./lib/config');
var socket = require('socket.io');

var redis = require('redis');
var redisClient = redis.createClient(config.get("redisOpts"));
var keylistener = require('./lib/keylistener');

var http = require('http');
var express = require('express');
var app = express(http);

app.use('/cyrclebot', require('serve-static')('./public'));


var server = http.createServer(app);

var io = socket(server, {
  path: "/cyrclebot/socket.io/",
});
keylistener(redisClient, io);

io.on('connection', function(socket) {
  socket.on('command', function(message) {
    redisClient.publish("cyrclebot:commands", message);
  });
});

server.listen(config.get('port'));
