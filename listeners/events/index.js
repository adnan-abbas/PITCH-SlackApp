const { userMessageRcvdCallback } = require('./user_message_recvd');

module.exports.register = (app) => {
  //app.event('message.im', userMessageReceived);

  // Handle incoming messages
  app.message(userMessageRcvdCallback);
  app.action('button_click', async ({ body, ack, say }) => {
    // Acknowledge the action
    await ack();
    await say(`<@${body.user.id}> clicked the button`);
  });
  
};
