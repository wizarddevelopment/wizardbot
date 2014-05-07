var config = require('./config');

var express = require('express');
var morgan  = require('morgan');
var bodyParser = require('body-parser');

var web = express();
web.use(morgan());
web.use(bodyParser());
web.listen(config.port);
wlog("Listening for http on " + config.port);

var Slack = require('node-slack');
var slackbot = new Slack(config.slack.domain, config.slack.token);

var Hipchat = require('node-hipchat');
var hipbot = new Hipchat(config.hipchat.token);

web.get('/', function(req, res){
  res.end("I AM WIZARDBOT");
});

web.post('/messages', function(req,res) {
  sendHipChatMessage(req.body);
  res.end("");
});

function wlog () {
  var args = [].slice.apply(arguments);
  args.unshift("WIZARDBOT:");
  console.log.apply(console, args);
}

// slackbot.send({
//     text: 'Howdy!',
//     channel: '#test',
//     username: 'Bot'
// });

var sendHipChatMessage = function(msg) {
  hipbot.sendMessage({
    room: config.hipchat.room,
    from: msg.user_name + " (bot)",
    message: msg.text,
    message_format: 'text'
  });
};

var getHipChatMessages = function (cb) {

  var ignorebot = function(data, err){
    if (err) { return cb(err, data); }

    // filter out messages from the api, eg the bot
    data = data.messages.filter(function(msg){
      return msg.from.user_id !== 'api';
    });

    data = data.map(function(msg) {
      msg.username = msg.from.name;
      msg.text = msg.message;
      return msg;
    });

    cb(err, data);
  };

  hipbot.getHistory({
    room: config.hipchat.room
  }, ignorebot);
};

// getHipChatMessages(function(err, data){
//   if (err) { return console.error(err); }
//   console.log(data);
// });
