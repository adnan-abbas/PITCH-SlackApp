const cron = require('node-cron');
// Define an array of users with their desired message times
const users = [
  {
    //Adnan
    userId: 'U06BE7BQRQS', // Replace with the actual user ID
    morningTime: '11:30', // 9 AM
    eveningTime: '16:38' // 4 PM
  },
  {
    //Sang
    userID: 'U06DYPCND35',
    morningTime: '11:30',
    eveningTime: '15:30',
  },
  {
    userId: 'U06BSRZHYSV', // Replace with the actual user ID
    morningTime: '09:05', // 9 AM
    eveningTime: '16:38' // 4 PM
  },
  // Add more users as needed
];

// Schedule morning messages
const sendMessage = async (app, userId, message) => {
    try {
      await app.client.chat.postMessage({
        token: process.env.SLACKBOT_TOKEN,
        channel: userId,
        text: message
      });
      console.log(`Message sent to ${userId}`);
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


scheduleMorningMessages();
scheduleEveningMessages();

module.exports.scheduler = (app) => {
    scheduleMorningMessages(app);
    scheduleEveningMessages(app);
  };