/* 
Author: Adnan Abbas
This file is the entrypoint for the application.
Initializes the app, registers event listeners, and calls the scheduler function that messages the users on their specific times.
*/
require ('dotenv').config();
const { App } = require('@slack/bolt');
const { registerListeners } = require('./listeners');
const { scheduler } = require('./users/scheduler');
const {analyzeConversation} = require('./openai/conversation_analyzer');
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
      // const resp = analyzeConversation('UO6BE7BQRQS', '2024-07-01')
      // console.log(resp);
    }
    catch(error){
        console.error("Unable to start App", error);
    }
})();
