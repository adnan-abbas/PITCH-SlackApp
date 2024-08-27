/* 
Author: Adnan Abbas
This file is the entrypoint for the application.
Initializes the app, registers event listeners, and calls the scheduler function that messages the users on their specific times.
*/
require ('dotenv').config();
const { App } = require('@slack/bolt');
const { registerListeners } = require('./listeners');
const { scheduler } = require('./users/scheduler');
const fs = require('fs');
const path = require('path');
const users = require('./users/users_info');



const winston = require('winston');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Setup winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logDir, 'app.log') })
  ]
});

// Override console.log globally
console.log = function(...args) {
  logger.info(args.join(' '));
};

console.error = function(...args) {
  logger.error(args.join(' '));
};
const app = new App({
    signingSecret: process.env.SIGNING_SECRET,
    token: process.env.SLACKBOT_TOKEN,
   // socketMode: true,
   // appToken: process.env.APP_LEVEL_TOKEN,
  });
registerListeners(app);
scheduler(app);
// Start the app
(async () => {

    try{
      await app.start(8888);
      console.log('⚡️ Bolt app is running!');
    }
    catch(error){
        console.error("Unable to start App", error);
    }
})();
