/* 
Author: Adnan Abbas
This is the scheduler where we register users and their preferred morning and evening check-in times
*/
const cron = require('node-cron');
// Define an array of users with their desired message times
const users = [
  {
    //Sang
    userId: 'U06DYPCND35',
    morningTime: '09:00',
    eveningTime: '15:30',
  },
  {
    //Adnan
    userId: 'U06BE7BQRQS', // Replace with the actual user ID
    morningTime: '13:35', 
    eveningTime: '16:30' 
  },
  //Donghan
  {
    userId: 'U078PFYK8CA', // Replace with the actual user ID
    morningTime: '10:00', 
    eveningTime: '16:30' 
    
  }
  // Add more users as needed
];

// Schedule morning messages
const sendMessage = async (app, userId, message) => {
    try {
      const response = await app.client.chat.postMessage({
        token: process.env.SLACKBOT_TOKEN,
        channel: userId,
        text: message
      });
      console.log(`Message sent to ${userId}`);
      console.log(`Response from Slack API:`, response);
    } catch (error) {
      console.error(`Error sending message to ${userId}:`, error);
    }
  };
  
  // Function to schedule morning messages
const scheduleMorningMessages = (app) => {
users.forEach(user => {
    cron.schedule(`0 ${user.morningTime.split(':')[1]} ${user.morningTime.split(':')[0]} * * *`, async () => {
   
    await sendMessage(app, user.userId, 'Good morning! Have a great day.');
    });
});
};
  // Function to schedule evening messages
const scheduleEveningMessages = (app) => {
users.forEach(user => {
    cron.schedule(`0 ${user.eveningTime.split(':')[1]} ${user.eveningTime.split(':')[0]} * * *`, async () => {
    await sendMessage(app, user.userId, 'Good evening! Hope you had a productive day.');
    });
});
};



module.exports.scheduler = (app) => {
    scheduleMorningMessages(app);
    scheduleEveningMessages(app);
  };