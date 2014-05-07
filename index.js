var config = require('./config');

var express = require('express');
var morgan  = require('morgan');
var web = express();
web.use(morgan());
web.listen(config.port);
wlog("Listening for http on " + config.port);

var Slack = require('node-slack');
var slackbot = new Slack(config.slack.domain, config.slack.token);

var Hipchat = require('node-hipchat');
var hipbot = new Hipchat(config.hipchat.token);

web.get('/', function(req, res){
  res.end("I AM WIZARDBOT");
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

getHipChatMessages(function(err, data){
  if (err) { return console.error(err); }
  console.log(data);
});

// hipchatter.get_room(config.hipchat.room, console.log);

// hipchatter.notify('test',{
//   message: '<b>I AM A ROBOT</b>',
//   token: 'O82nQQEk88uFR6PYAec2JsFs3r6RGol0RRM569SG',
// }, console.log);