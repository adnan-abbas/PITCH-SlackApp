/*
Various events are registered in this space.
*/
module.exports.register = (app) => {
  // Handle incoming messages
  app.message(async ( { message, say }) => {
    console.log("This is the messages object rcvd by the message API: ", message);
  
    //we can verify where the message is coming from by inspecting the message.channel_type. Right now, we just want to reply to DM messages by the app
    
  
    var userInput = message.text;
    var userId = message.user;
    await say('Hey there!');
  
  // Store conversation history
    let conversationHistory;
    // ID of channel you watch to fetch the history for
    let channelId = message.channel;
  
    try {
      // Call the conversations.history method using WebClient
      const result = await app.client.conversations.history({
        channel: channelId
      });
  
      conversationHistory = result.messages;
  
      // Print results
      console.log(conversationHistory.length + " messages found in " + channelId);
    }
    catch (error) {
      console.error(error);
    }
    
  
  });  
};
