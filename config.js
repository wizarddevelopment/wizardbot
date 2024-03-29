module.exports = {
  port: process.env.PORT || 3000,
  slack: {
    domain: process.env.SLACK_DOMAIN,
    token: process.env.SLACK_TOKEN,
    room: process.env.SLACK_ROOM
  },
  hipchat: {
    token: process.env.HIPCHAT_TOKEN,
    room: process.env.HIPCHAT_ROOM
  }
};