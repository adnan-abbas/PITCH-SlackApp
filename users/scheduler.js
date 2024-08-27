/* 
Author: Adnan Abbas
This is the scheduler where we register users and their preferred morning and evening check-in times
*/
const cron = require('node-cron');
const {getMorningAIResponse, initializeMorningBot} = require('../openai/morning_bot');
const {getEveningAIResponse, initializeEveningBot} = require('../openai/evening_bot');
const { getAllUsers, updateUser, getUser, addUser } = require('../database/db_models');
const { DateTime } = require('luxon');

let appInstance = null;
const userCronJobs = new Map();
const dailySurveyLink = "https://forms.gle/zKMYYZR9QZj1aXsU9";
async function userUpdate(userId, morningTime, eveningTime) {
  // Update user information
      await updateUser(userId, {
        morningGoals: [
          'help this worker to incorporate active listening in their day',
          'help this worker to understand their self-efficacy',
          'help this worker to think about strategies rather than efforts that can make their agenda successful'
  ],
        eveningGoals: [ ,
      'help this worker to think about their self-regulation in a way that it helps them to look at their thoughts (metacognition)',
      'help this worker to think about their self-efficacy (beliefs about their ability to succeed). Ways to improve self-efficacy are to: 1. remember firsthand experience, 2. watching others succeed, 3. not being anxious.',
      'help this worker to analyze their mindset whether its fixed or growth mindset.',
      'help this worker to come up with effective stratgies for success. Help them to strategize about their goals if they are failing at it since both strategy+efforts result in success',
      'help this worker to reflect on any feedback they received during their day and understand how they reacted'
  ],
  morningUsedGoals:['help this worker externalize their plan on one task that they want to finish today.',
  'help this worker block a time for deep work in a distraction-free environment.',
  'help this worker identify potential tasks that they can either delegate or defer.', 
  'help this worker recognize if what they plan to do for the day is an urgent and important task or an urgent but not important task.',
  'help this worker incorporate regular physical activity into their daily routine to improve physical health and reduce stress.',
  'help this worker be mindful to manage stress and enhance mental clarity',
  'help this worker identify obstacles in the realization of their plans and think about alternate strategies if the obstacle comes in the way of their plan',
  'help this worker be mindful to manage stress and enhance mental clarity',
  'help this worker set boundaries between work and personal life to ensure they have time for relaxation and personal activities.',
  'help this worker schedule and take good breaks to refresh their mind, prevent burnout, and/or improve their concentration.',],
  eveningUsedGoals:[   'help this worker identify what their core values at work are.',
  'help this worker understand how they can change behaviors for productivity.',
  'help this worker be more organized in their task management.',
  'help this worker recognize good habits that they want to establish for their productivity.',
  'help this worker change their perception of themselves for their mental health.', 
  'help this worker be compassionate to themselves at work.',
  'help this worker understand how they can change behaviors for mental well-being.', 
  'help this worker accomplish a good work-life balance.'],
  });
}
// Schedule morning messages
const sendMessage = async (app, userId, message) => {
  const parsedMessage = message;
  if (parsedMessage["is_broken"] === true){
    try {
      const response = await app.client.chat.postMessage({
        token: process.env.SLACKBOT_TOKEN,
        channel: userId,
        text: parsedMessage["sentence_1"]
      });    
    } catch (error) {
      console.error(`Error sending message to ${userId}:`, error);
    }
    try {
      const response = await app.client.chat.postMessage({
        token: process.env.SLACKBOT_TOKEN,
        channel: userId,
        text: parsedMessage["sentence_2"]
      });    
    } catch (error) {
      console.error(`Error sending message to ${userId}:`, error);
    }  
  }
  else{
    try {
      const response = await app.client.chat.postMessage({
        token: process.env.SLACKBOT_TOKEN,
        channel: userId,
        text: parsedMessage["sentence_1"]
      });    
    } catch (error) {
      console.error(`Error sending message to ${userId}:`, error);
    }

  }
  };

  const sendSurveyMessage = async (app, userId, message) => {
    try {
      const response = await app.client.chat.postMessage({
        token: process.env.SLACKBOT_TOKEN,
        channel: userId,
        blocks: message,
        text: "Survey Form",
      });    
    } catch (error) {
      console.error(`Error sending message to ${userId}:`, error);
    }
  };
  // Function to schedule morning messages
const scheduleMorningMessages = async (app, user) => {
  const [hour, minute] = user.morningTime.split(':');
  console.log(user.userName, user.morningTime);
  const randomMinute = Math.floor(Math.random() * 60);
  const morningJob = await cron.schedule(`0 ${randomMinute} ${hour} * * *`, async () => {
    var response = "";
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    console.log("day of week is: ", dayOfWeek);
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
      // this is where a fresh morning session is initiated. You want a new conversation here with a fresh messageCounter and the messages object.
      await initializeMorningBot(user.userId);
      response = await getMorningAIResponse(user.userId, 'I am a worker beginning my workday. Please initiate the conversation by asking me a question. Start by a greeting.');
      } else {
        await initializeMorningBot(user.userId);
        response = await getMorningAIResponse(user.userId, 'Please initiate the conversation by asking me a question. Today is the weekend so I dont want to talk about work. Start by a greeting.');
      }
    console.log("in the schelder", response);
    await sendMessage(app, user.userId, response);
  });
  return morningJob;
};
  // Function to schedule evening messages
const scheduleEveningMessages = async (app, user) => {
  const [hour, minute] = user.eveningTime.split(':');
  console.log(user.userName, user.eveningTime);
  const randomMinute = Math.floor(Math.random() * 60);
  var reminderHour = parseInt(hour, 10);
  const eveningJob = await cron.schedule(`0 ${randomMinute} ${hour} * * *`, async () => {
    await initializeEveningBot(user.userId);
    const response = await getEveningAIResponse(user.userId, 'Begin conversation. Start by a greeting.');
    await sendMessage(app, user.userId, response);
  });
  const eveningMinute = parseInt(minute, 10);
  var reminderMinute = randomMinute + 15;
  if (reminderMinute >= 60) {
    reminderHour += 1;
    reminderMinute -= 60;
  }
  if (reminderHour >= 24) {
    reminderHour = 0;
  }
  const surveyJob = await cron.schedule(`${reminderMinute} ${reminderHour} * * *`, async () => {
    const surveyBlockMessage = [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "Survey Form 📝",
          "emoji": true
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Please fill out this survey by clicking the button when you have a moment."
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Click Me",
            "emoji": true
          },
          "value": "click_me_123",
          "url": dailySurveyLink,
          "action_id": "button-action"
        }
      }
    ];
    await sendSurveyMessage(app, user.userId, surveyBlockMessage);
  });

  return { eveningJob, surveyJob };
};
const rescheduleEveningMessages = async (app, user) => {
  const jobs = userCronJobs.get(user.userId);
  // Cancel existing jobs
  if (jobs && jobs.eveningJob && jobs.surveyJob) {
    jobs.eveningJob.stop();
    jobs.surveyJob.stop();
  }
  const { eveningJob, surveyJob } = await scheduleEveningMessages(app, user);
  userCronJobs.set(user.userId, { ...jobs, eveningJob, surveyJob });
};

const updateUserEveningTime = async (userId, newEveningTime) => {
  // Update the user's eveningTime in the database
  await updateUser(userId,{
    eveningTime: newEveningTime
  });
  // Get the updated user info
  const user = await getUser(userId);
  // Reschedule evening messages
  await rescheduleEveningMessages(appInstance, user);
};

const rescheduleMorningMessages = async (app, user) => {
  // Cancel existing jobs
  const jobs = userCronJobs.get(user.userId);
  if (jobs && jobs.morningJob) {
    jobs.morningJob.stop();
  }
  // Schedule new jobs
  const morningJob =  await scheduleMorningMessages(app, user);
  userCronJobs.set(user.userId, { ...jobs, morningJob });
};

const updateUserMorningTime = async (userId, newMorningTime) => {
  // Update the user's eveningTime in the database
  await updateUser(userId,{
    morningTime: newMorningTime
  });
  // Get the updated user info
  const user = await getUser(userId);
  // Reschedule evening messages
  await rescheduleMorningMessages(appInstance, user);
};

const scheduleCheckIns = async (app) => {
  const users = await getAllUsers(); // Fetch all users from the database
  // Loop through each user and schedule their messages
  users.forEach(async (user) => {
    const { eveningJob, surveyJob } = await scheduleEveningMessages(app, user);
    const  morningJob  = await scheduleMorningMessages(app,user);
    userCronJobs.set(user.userId, { morningJob, eveningJob, surveyJob });
  });
};

const addAndUpdateUser = async (userId) =>{
    await addUser(userId);
    await userUpdate(userId, "09:00", "17:00");
    console.log("user added!");
}

module.exports = {
  scheduler: async (app) => {
    //await addAndUpdateUser("U07H2GJ889J")
    userUpdate("U06BE7BQRQS","09:00","17:00");
    await scheduleCheckIns(app);
    appInstance = app;
  },
  updateUserEveningTime, // Exporting updateUserEveningTime function
  updateUserMorningTime
};