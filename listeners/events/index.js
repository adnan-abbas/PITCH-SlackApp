/*
Various events are registered in this space.
*/
const fs = require('fs');
const path = require('path');
const {getMorningAIResponse} = require('../../openai/morning_bot');
const {getEveningAIResponse} = require('../../openai/evening_bot');
const { type } = require('os');
const { getUser, updateUser } = require('../../database/db_models');
const { updateUserEveningTime, updateUserMorningTime } = require('../../users/scheduler');

const addDelayInSeconds= async(message) =>{
  //75 (wpm) * 60 (seconds per minute)  = 8 seconds
  const words = message.split(/\s+/).filter(word => word.length > 0);
  // Count the number of words
  const wordCount = words.length;
  // Calculate the delay in seconds
  // 120 words per minute is equivalent to 2 words per second
  const delayInSeconds = Math.ceil(wordCount / 4);
  return delayInSeconds;
}

const handleIncomingMessage = async (app) => {
  //message handler
  app.message(async ( { message, say }) => {

    //console.log("CLIENT is", client);
    //console.log("This is the messages object rcvd by the message API: ", message);
  
    //we can verify where the message is coming from by inspecting the message.channel_type. Right now, we just want to reply to DM messages by the app
      var userInput = message.text;
      var userId = message.user;
      var response = "";
    
      //inspect the time stamp in the messages object
      //if the time is > morning and < evening then convo is morning
      //if the time > evening and < morning then convo is evening
      const user = await getUser(userId);
      const userMorningTime = user.morningTime;
      const userEveningTime = user.eveningTime;
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

      if (userInput.startsWith("\\")){
        const command = userInput.slice(1).trim(); 
        const words = command.split(" ");
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

        // Check if the first word is "set" and the second word is "morning"
        if (words[0] === "set" && words[1] === "morning") {
          //console.log("ARGHHHH");
          if (timeRegex.test(words[2])){
            updateUserMorningTime(userId, words[2]);
            const res = "Thank you! I set your morning time to be: "+ words[2]+" "+"for future interactions";
            say(res);
          }
          else{
            say("Please ensure that you have entered time in the correct 24 hour format. Try again by typing the command: '\\set evening [YOUR PREFERRED TIME IN 24H FORMAT (HH:MM)]'. An example command to set your morning time to 8AM: \\set morning 08:00")
          }
          
        } else if (words[0] === "set" && words[1] === "evening"){

          if (timeRegex.test(words[2])){
            updateUserEveningTime(userId,words[2]);
            const res = "Thank you! I set your evening time to be: "+ words[2]+" "+"for future interactions";
            say(res);
          }
          else{
            say("Please ensure that you have entered time in the correct 24 hour format. Try again by typing the command: '\\set evening [YOUR PREFERRED TIME IN 24H FORMAT (HH:MM)]'. An example command to set your evening time to 4PM: \\set evening 16:00")
          }
        } else {
          say("Please ensure that you have entered time in the correct 24 hour format. Try again by typing the command: '\\set evening [YOUR PREFERRED TIME IN 24H FORMAT (HH:MM)]'. An example command to set your morning time to 8AM: \\set morning 08:00" )
        }
      }
      else {    
        // Determine if current time is morning or evening
        if (currentTimeInMinutes >= morningTimeInMinutes && currentTimeInMinutes < eveningTimeInMinutes) {
          response = await getMorningAIResponse(userId, userInput);
          //console.log('calling morning bot')
        } else {
          //console.log('calling evening bot')
          response = await getEveningAIResponse(userId, userInput);
        }

        const parsedSentence = response;
        console.log("parsed sentence in index,js", parsedSentence);
        if (parsedSentence["is_broken"] === true){
          const firstDelay = await addDelayInSeconds(parsedSentence["sentence_1"]) * 1000;
          const secondDelay  = await addDelayInSeconds(parsedSentence["sentence_2"]) * 1000;
          const totalDelay  = firstDelay + secondDelay;
          // Show typing indicator by updating the message
          
          await say(parsedSentence["sentence_1"]);
          //await new Promise(resolve => setTimeout(resolve, firstDelay));
          await say(parsedSentence["sentence_2"]);
        }
        else{
          await say(parsedSentence["sentence_1"]);
        }
    }

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