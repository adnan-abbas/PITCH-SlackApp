/* 
Author: Adnan Abbas
This is the scheduler where we register users and their preferred morning and evening check-in times
*/
const cron = require('node-cron');
const {getMorningAIResponse} = require('../openai/morning_bot');
const {getEveningAIResponse} = require('../openai/evening_bot');
const { users } = require('../users/users_info');

// Schedule morning messages
const sendMessage = async (app, userId, message) => {
    try {
      const response = await app.client.chat.postMessage({
        token: process.env.SLACKBOT_TOKEN,
        channel: userId,
        text: message
      });
    } catch (error) {
      console.error(`Error sending message to ${userId}:`, error);
    }
  };
  
  // Function to schedule morning messages
const scheduleMorningMessages = async (app) => {

  Object.entries(users).forEach(async ([userId, user]) => {
    const [hour, minute] = user.morningTime.split(':');
    cron.schedule(`0 ${minute} ${hour} * * *`, async () => {
    var response = "";
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
        response = await getMorningAIResponse(userId, 'I am a worker beginning my workday. Please initiate the conversation by asking me a question. Start by a greeting.');
      } else {
        response = await getMorningAIResponse(userId, 'Please initiate the conversation by asking me a question. Today is the weekend so I dont want to talk about work. Start by a greeting.');
      }
    await sendMessage(app, userId, response);
    });
  });
};
  // Function to schedule evening messages
const scheduleEveningMessages = async (app) => {

  Object.entries(users).forEach(async ([userId, user]) => {
    const [hour, minute] = user.eveningTime.split(':');
    cron.schedule(`0 ${minute} ${hour} * * *`, async () => {
      const response = await getEveningAIResponse(userId, 'Initiate the conversation. Start by a greeting.')
      await sendMessage(app, userId, response);
      });
  });
};



module.exports.scheduler = (app) => {
    scheduleMorningMessages(app);
    scheduleEveningMessages(app);
};