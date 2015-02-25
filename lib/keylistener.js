var redis = require('redis');
var redisOpts = require('./config').get('redisOpts');
var subClient = redis.createClient(redisOpts);
var Listener = function(redisClient, io) {
  io.on('connection', function(socket) {
    console.log("Connection!");
    redisClient.mget(Listener.keys, function(err, values) {
      for(var i = 0; i < Listener.keys.length; i++) {
        socket.emit("update", Listener.keys[i], values[i]);
      }
    });
  });
  var subKeys = Listener.keys.map(function(key) {
    return "__keyspace@0__:" + key;
  });
  subClient.subscribe(subKeys, function(err, response) {
    subClient.on('message', function(channel, message) {
      var key = channel.split("__keyspace@0__:")[1];
      if(message == "set") {
        redisClient.get(key, function(err, value) {
          io.sockets.emit("update", key, value);
        });
      }
      else if(message == "rpush" || message == "lpop" ) {
        redisClient.lrange(key, 0, -1, function(err, list) {
          io.sockets.emit("update", key, list);
        });
      }
      else if(message == "del") {
        io.sockets.emit("update", key, null);
      }
      else {
        console.log(channel, message);
      }
    });
  });
};
Listener.keys = ["nowPlaying", "playQueue", "playHistory", "byteSize", "songLength", "progress", "volume", "nowPlayingTitle"].map(function(k) { return "cyrclebot:" + k; });

module.exports = Listener;
