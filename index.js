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

// messages from slack
web.post('/messages', function(req,res) {
  sendHipChatMessage(req.body);
  res.end("");
});

function wlog () {
  var args = [].slice.apply(arguments);
  args.unshift("WIZARDBOT:");
  console.log.apply(console, args);
}

var sendHipChatMessage = function(msg) {
  wlog("relaying to hipchat " + msg.user_name + ": " + msg.text);
  hipbot.postMessage({
    room: config.hipchat.room,
    from: msg.user_name + " (bot)",
    message: msg.text,
    message_format: 'text'
  }, function(data,err){
    if (err) {
      wlog("Error sending message from " + msg.user_name, err);
    }
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
      msg.user_name = msg.from.name;
      msg.text = msg.message;
      return msg;
    });

    cb(err, data);
  };

  hipbot.getHistory({
    room: config.hipchat.room
  }, ignorebot);
};

var sendSlackMessage = function (msg) {

  slackbot.send({
      text: msg.text,
      channel: config.slack.room,
      username: msg.user_name + ' (bot)'
  });

};

var hipchatMessages = [];
var pollHipChat = function(){
  wlog("checking for hipchat");

  getHipChatMessages(function(err, data){
    if (err) {
      wlog("Error polling hipchat backing off 30 seconds");
      setTimeout(pollHipChat, 30000);
      return;
    }

    var newMessages = data.filter(function(msg){
      for (var i =0; i < hipchatMessages.length; i++){
        var oldmsg = hipchatMessages[i];
        if (msg.username === oldmsg.username && msg.text === oldmsg.text) {
          return false;
        }
      }
      return true;
    });

    newMessages.forEach(sendSlackMessage);
    hipchatMessages = hipchatMessages.concat(newMessages);
    wlog("found " + newMessages.length + " new messags");

    setTimeout(pollHipChat, 2000);
  });

};

pollHipChat();
