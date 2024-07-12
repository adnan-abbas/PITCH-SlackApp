require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const { users } = require ('../users/users_info');
// Setup OpenAI configuration
const openai = new OpenAI(process.env.OPENAI_API_KEY);
const { observeMorningConversation } = require('./conversation_observer_morning')
var messages = [];
var conversation = [];
var goal = ""
const initializeMorningBot = async (userId) =>{
  //empty messages from the previous day's conversation

  console.log("initializing morning bot for user:", userId);
  messages = [];
  goalsArray = [
    'Help this worker externalize their plan on one task that they want to finish today.',
    'Help this worker find available time for them to focus without distraction.',
    'Help this worker differentiate an urgent task from an important task by asking about their todays to-do list', 
    'Help this worker understand the importance of collaboration and delegation among the daily tasks.',
    'Help this worker imagine the order of tasks in which they work on a particular day.',
    'Help this worker externalize what their plan is for the day to evaluate if their plan is realistic or not.',
    'Help this worker reflect on whether their daily plan matches their core values.',
    'Help this worker think about ways to manage time efficiently within a daily plan.',
    'Help this worker be aware of their emotional state and understand how that can impact their day on a particular day.',
    'Help this worker find time for breaks in their day.',
    'Help this worker have a positive beginning of the day.',
    'Help this worker find time for an active lifestyle during the day at work.',
    'Help this worker identify and regulate the stress that they may have for the day.',
    'Suggest this worker to reward themselves when they accomplish their goals with a few tangible options.',
  ]
  goal = goalsArray[Math.floor(Math.random() * goalsArray.length)];
  // Placeholder for the system prompt
  
  /**
   * TODO: 
   * The morning bot should have the context of the last three questions asked and should rotate the question if its the same.
   * The bot should allow the user to have the conversation that they want to lead by sticking to the higher-level goals but changing the focused goal of the conversation.
   */
  const systemPrompt = `
  You are a productivity/well-being coach who coaches workers to plan their day through conversation by asking questions about their day.
  You check-in with workers in the morning everyday by asking a different question everyday.
  Suppose the goal of today's conversation is ${goal}.
  You have to help workers externalize their thoughts with respect to the goal by asking questions based on the goal which is: ${goal}. 
  Make sure to keep the question short and easy to answer as much as possible.
  Your output should be a sentence within 10-15 words.
  Say one sentence for each message and don’t exceed two.
  Use emojis appropriately.
  Make sure that you do one thing at a time. Either ask a question or acknowledge the user.
  I will tip you $20 if you are perfect and end the conversation gracefully, and I will fine you $40 if you give verbose responses.
  `;

  console.log("System Prompt is: ", systemPrompt);
  messages.push({ role: 'system', content: systemPrompt });
  users[userId].messageCounter = 0;
}
// Function to get a response from the AI based on the user input and conversation history
const getMorningAIResponse = async (userId, userInput) => {
  
  if (!userInput.includes('I am a worker beginning my workday. Please initiate the conversation by asking me a question. Start by a greeting.')){
    conversation.push({ role: 'user', content: userInput });
    const currentConvo = conversation.filter(message => message.role === 'user' || message.role === 'assistant').map(message => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
    .join('\n');
    const response = await observeMorningConversation(currentConvo, goal);


    console.log("current convo in morning_bot", currentConvo);
    console.log("response from observer", response);
    console.log("rational from observer", response["rationale"]);



  }
  var userPrompt = "";

  const state = "";

  if (state === "Externalization"){
    userPrompt = "Consider helping the worker to incorporate activity related to the goal in their day.";
  }
  else if (state === "Incoporation"){
    userPrompt =  "Consider ending the conversation since the user has talked about their plans.";
  }
  userInput+=userPrompt;
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
    conversation.push({ role: 'assistant', content: aiMessageContent });
    saveConversation(userId, messages);
    users[userId].messageCounter+=1;
    return aiMessageContent;
  }
  catch (error) {
      console.error(`Error getting response from OpenAI:`, error);
      throw error;
  }


};
const saveConversation = (userId, messages) => {
  const conversationPath = path.join(__dirname, `..`, `conversations`, `${userId}.json`);
  const currentDate = new Date().toISOString().split('T')[0];

  let fileContent = {};
  if (fs.existsSync(conversationPath)) {
    fileContent = JSON.parse(fs.readFileSync(conversationPath, 'utf8'));
  }

  // Find or create the array for the current date
  let currentDayConversations = fileContent[currentDate];
  if (!currentDayConversations) {
    currentDayConversations = [];
    fileContent[currentDate] = currentDayConversations;
  }

  let morningConversation = currentDayConversations.find(conversation => conversation.Morning);
  if (!morningConversation) {
    morningConversation = { Morning: [] };
    currentDayConversations.push(morningConversation);
  }

  // Extract the latest user and assistant messages
  const latestUserMessage = messages.filter(message => message.role === 'user').pop();
  const latestAssistantMessage = messages.filter(message => message.role === 'assistant').pop();

  // Append the latest messages to the "Morning" array if they exist
  if (latestUserMessage) {
    morningConversation.Morning.push(latestUserMessage);
  }
  if (latestAssistantMessage) {
    morningConversation.Morning.push(latestAssistantMessage);
  }

  // Write updated content back to the file
  fs.writeFileSync(conversationPath, JSON.stringify(fileContent, null, 2), 'utf8');
};

module.exports = {
  getMorningAIResponse,
  initializeMorningBot
}
