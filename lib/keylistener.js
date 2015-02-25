var redis = require('redis');
var redisOpts = require('./config').get('redisOpts');
var subClient = redis.createClient(redisOpts);
var Listener = function(redisClient, io) {
  io.on('connection', function(socket) {
    console.log("Connection!");
    redisClient.mget(Listener.initKeys, function(err, values) {
      console.log(err, values);
      for(var i = 0; i < Listener.initKeys.length; i++) {
        socket.emit("update", Listener.initKeys[i], values[i]);
      }
    });
  });
  var subKeys = Listener.keys.map(function(key) {
    return "__keyspace@0__:cyrclebot:" + key;
  });
  subClient.subscribe(subKeys, function(err, response) {
    console.log("Subscribed!", err, response);
    subClient.on('message', function(channel, message) {
      var key = channel.split("__keyspace@0__:")[1];
      if(message == "set") {
        redisClient.get(key, function(err, value) {
          io.sockets.emit("update", key, value);
        });
      }
      else if(message == "rpush" || message == "lpop" ) {
        redisClient.lrange(key, 0, -1, function(err, list) {
          console.log(err, list);
          io.sockets.emit("update", key, list);
        });
      }
      else {
        console.log(channel, message);
      }
    });
  });
};
Listener.keys = ["nowPlaying", "playQueue", "playHistory", "byteSize", "songLength", "progress", "volume", "nowPlayingTitle"];
Listener.initKeys = ["nowPlaying", "nowPlayingTitle", "volume", "progress"].map(function(k) { return "cyrclebot:" + k; });

module.exports = Listener;
