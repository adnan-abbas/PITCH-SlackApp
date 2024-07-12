/*
Various events are registered in this space.
*/
const fs = require('fs');
const path = require('path');
const {getMorningAIResponse} = require('../../openai/morning_bot');
const {getEveningAIResponse} = require('../../openai/evening_bot');
const { users } = require('../../users/users_info');


const convertTimestampToTime = (timestamp) => {
  // Convert to milliseconds (if the timestamp is in seconds)
  const date = new Date(timestamp * 1000);
  let h = date.getUTCHours();
  //since in eastern time zone, GMT-4
  h = (h - 4 + 24) % 24;
  const hours = h.toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const handleIncomingMessage = async (app) => {  
  app.message(async ( { message, say }) => {
    //console.log("This is the messages object rcvd by the message API: ", message);
  
    //we can verify where the message is coming from by inspecting the message.channel_type. Right now, we just want to reply to DM messages by the app
      var userInput = message.text;
      var userId = message.user;
      var response = "";
    
      //inspect the time stamp in the messages object
      //if the time is > morning and < evening then convo is morning
      //if the time > evening and < morning then convo is evening
      const userMorningTime = users[userId].morningTime;
      const userEveningTime = users[userId].eveningTime;
      const currentTime = message.ts;
      const [morningHour, morningMinute] = userMorningTime.split(':').map(Number);
      const [eveningHour, eveningMinute] = userEveningTime.split(':').map(Number);
      
      const morningTimeInMinutes = morningHour * 60 + morningMinute;
      const eveningTimeInMinutes = eveningHour * 60 + eveningMinute;
    
      // Convert current timestamp to minutes since start of the day
      const date = new Date(currentTime * 1000);
      let currentHours = date.getUTCHours();
      let currentMinutes = date.getUTCMinutes();
    
      // Adjust for GMT-4
      currentHours = (currentHours - 4 + 24) % 24;
    
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    
      // Determine if current time is morning or evening
      if (currentTimeInMinutes >= morningTimeInMinutes && currentTimeInMinutes < eveningTimeInMinutes) {
        response = await getMorningAIResponse(userId, userInput);
        //console.log('calling morning bot')
      } else {
        //console.log('calling evening bot')
        response = await getEveningAIResponse(userId, userInput);
      }

      await say(response);

    });


}

module.exports.register = (app) => {
  // Handle incoming messages
  handleIncomingMessage(app);  
};


    // // Store conversation history
    // let conversationHistory;
    // // ID of channel you watch to fetch the history for
    // let channelId = message.channel;

    // try {
    //   // Call the conversations.history method using WebClient
    //   const result = await app.client.conversations.history({
    //     channel: channelId
    //   });

    //   conversationHistory = result.messages;

    //   // Print results
    //   //console.log(conversationHistory.length + " messages found in " + channelId);
    //   //cconsole.log(conversationHistory)
    //   //fs.writeFileSync('someFile.json', JSON.stringify(conversationHistory, null, 2));

    
    // }

    // catch (error) {
    //   console.error(error);
    // }