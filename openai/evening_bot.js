const { analyzeConversation } = require('./conversation_analyzer');
//const { observeConversation } = require('./conversation_observer');

require('dotenv').config();
const { OpenAI } = require('openai');
const { users } = require('../users/users_info');

// Setup OpenAI configuration
const openai = new OpenAI(process.env.OPENAI_API_KEY);

goalsArray = [
  'Help a worker to revisit what they did during the day and help them notice patterns.',
]

goal = goalsArray[Math.floor(Math.random() * goalsArray.length)];
var messages = [];

const initializeEveningBot = async (userId) => {
//empty messages from the previous day's conversation
  console.log("initializing evening bot for user:", userId);

  messages = [];
  const todayDate = new Date().toISOString().split('T')[0];
  const morningConversation = await analyzeConversation(userId, todayDate);
  //console.log("Summary of morning conversation: ", morningConversation)
/**
 * TODO: 
 * The morning bot should have the context of the last three questions asked and should rotate the question if its the same.
 * The morning convo summary should be sent to the bot when initiating the convo?
 * 
 */

  const systemPrompt = `
  You are an emapathetic reflection coach who helps users to reflect about their day's activities to improve their productivity and well-being by checking in with them at the end of their day. 
  
  Suppose the user had a morning conversation with you. The conversation is encapsulated by triple quotes backticks below:
  """
  ${morningConversation}
  """
  
  Now, your job is to:
  1. Follow up with the users about actionable items or tasks mentioned
  2. Lead an emotionally-aware conversation with the user by asking reflective questions about their day that can help them to articulate their underlying needs and goals and increase their motivation.
  
  Make sure to keep the question short and easy to answer as much as possible. 
  If the morning conversation is empty, focus on job # 2.
  I will tip you $20 if you are perfect and end the conversation gracefully, and I will fine you $40 if you do not adhere to the morning conversation context.
  `;
  messages.push({ role: 'system', content: systemPrompt });
  users[userId].messageCounter = 0;
};

// Function to get a response from the AI based on the user input and conversation history
const getEveningAIResponse = async (userId, userInput) => {

  // observeConversation(messages);
  var userPrompt = "";

  if (users[userId].messageCounter > 3){
    userPrompt = ". End the conversation gracefully now"
  }
  else{
    userPrompt = ". Note: If the conversation is on the stage where the user has reflected about their day, consider ending the conversation. Make sure to keep the question short and easy to answer as much as possible. Your output should be a sentence within 10-15 words"
  }
  
  userInput+=userPrompt;
  console.log("counter: ", users[userId].messageCounter, userPrompt
  )
  messages.push({ role: 'user', content: userInput });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 150,
    });

    const aiMessage = response.choices[0];
    const aiMessageContent = aiMessage.message.content;
    messages.push({ role: 'assistant', content: aiMessageContent });
    users[userId].messageCounter += 1;
    console.log(users[userId].messageCounter);
    return aiMessageContent;
  }
  catch (error) {
      console.error(`Error getting response from OpenAI:`, error);
      throw error;
  }


};

module.exports = {
  getEveningAIResponse,
  initializeEveningBot
}


/*
Below are three stages of reflection marked by three asteriks:
  ***
  Stage 1 – Noticing: This stage focuses on building awareness of events and behavior patterns, but without an explicit attempt at explaining or understanding reasons. The stage is aligned with Fleck and Fitzpatrick’s revisiting and reflective description levels where description of an event is provided without further elaboration, explanation, or interpretation. 
  
  Stage 2 – Understanding: This stage focuses on analysis of the situation from different perspectives, formulating explanations and observations about the reasons for the things noticed. The stage is aligned with Fleck and Fitzpatrick’s dialogic reflection level where cycles of interpreting and questioning as well consideration of different explanations, hypotheses, and viewpoints are taking place. 
  
  Stage 3 – Future Action: In this stage, Understanding leads to development of a new perspective, learning a lesson, or gaining new insights for the future. In terms of Fleck and Fitzpatrick’s levels, this step aligns with levels of transformative reflection and critical reflection where past events are revisited with intent to re-organize them and do something differently in the future. Personal assumptions are challenged, leading to change in practice and understanding. Here also wider implications of actions are taken into consideration.
  ***


  */