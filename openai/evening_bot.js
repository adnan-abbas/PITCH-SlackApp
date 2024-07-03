const { analyzeConversation } = require('./conversation_analyzer');
require('dotenv').config();
const { OpenAI } = require('openai');

// Setup OpenAI configuration
const openai = new OpenAI(process.env.OPENAI_API_KEY);
goalsArray = [
  'Help a worker to revisit what they did during the day and help them notice patterns.',
]

goal = goalsArray[Math.floor(Math.random() * goalsArray.length)];
// Placeholder for the system prompt
var systemPrompt = ``;
var messages = [];

const buildSystemPrompt = async (userId) => {

  const todayDate = new Date().toISOString().split('T')[0];
  const morningConversation = await analyzeConversation(userId, todayDate);
  console.log("Summary of morning conversation: ", morningConversation)
/**
 * TODO: 
 * The morning bot should have the context of the last three questions asked and should rotate the question if its the same.
 * The bot should allow the user to have the conversation that they want to lead by sticking to the higher-level goals but changing the focused goal of the conversation.
 * The morning convo summary should be sent to the bot when initiating the convo?
 * 
 */

  systemPrompt = `
  You are an emapathetic reflection companion who helps users to reflect about their day's activities to improve their productivity and well-being by checking in with them at the end of their day. 
  
  Suppose the user had a morning conversation with you. The conversation is encapsulated by triple quotes backticks below:
  """
  ${morningConversation}
  """
  
  Now, your job is to:
  1. Follow up with the users about actionable items or tasks mentioned
  2. Lead an emotionally-aware conversation with the user by asking reflective questions about their day that can help them to articulate their underlying needs and goals and increase their motivation.
  
  Make sure to keep the question short and easy to answer as much as possible. Your output should be within a sentence of 20 words.
  If the morning conversation is empty, focus on job # 2.
  I will tip you $20 if you are perfect and end the conversation gracefully, and I will fine you $40 if you do not adhere to the morning conversation context.
  `;

  console.log("evening system promtp:", systemPrompt);
  messages.push({ role: 'system', content: systemPrompt });
};

// Function to get a response from the AI based on the user input and conversation history
const getEveningAIResponse = async (userId, userInput) => {
  //only build system prompt first time
  if (messages.length === 0){
    try {
      await buildSystemPrompt(userId);
    } catch (error) {
      console.error('Error building system prompt:', error);
    }
  }

  userInput+= ". Note: If the conversation is on the stage where the user has reflected about their day, consider ending the conversation."
  messages.push({ role: 'user', content: userInput });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 150,
    });

    const aiMessage = response.choices[0];
    const aiMessageContent = aiMessage.message.content;
   // console.log("the ai message recvd is: ", aiMessage)
    messages.push({ role: 'assistant', content: aiMessageContent });

    return aiMessageContent;
  }
  catch (error) {
      console.error(`Error getting response from OpenAI:`, error);
      throw error;
  }


};

module.exports = {
  getEveningAIResponse
}


/*
Below are three stages of reflection marked by three asteriks:
  ***
  Stage 1 – Noticing: This stage focuses on building awareness of events and behavior patterns, but without an explicit attempt at explaining or understanding reasons. The stage is aligned with Fleck and Fitzpatrick’s revisiting and reflective description levels where description of an event is provided without further elaboration, explanation, or interpretation. 
  
  Stage 2 – Understanding: This stage focuses on analysis of the situation from different perspectives, formulating explanations and observations about the reasons for the things noticed. The stage is aligned with Fleck and Fitzpatrick’s dialogic reflection level where cycles of interpreting and questioning as well consideration of different explanations, hypotheses, and viewpoints are taking place. 
  
  Stage 3 – Future Action: In this stage, Understanding leads to development of a new perspective, learning a lesson, or gaining new insights for the future. In terms of Fleck and Fitzpatrick’s levels, this step aligns with levels of transformative reflection and critical reflection where past events are revisited with intent to re-organize them and do something differently in the future. Personal assumptions are challenged, leading to change in practice and understanding. Here also wider implications of actions are taken into consideration.
  ***


  */