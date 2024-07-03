require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Setup OpenAI configuration
const openai = new OpenAI(process.env.OPENAI_API_KEY);
var messageCounter = 0;
goalsArray = [
  'Help a worker externalize their plan on one task that they want to finish today.',
  'Help workers find available time for them to focus without distraction.',
  'Help a worker differentiate an urgent task from an important task by asking about their todays to-do list', 
  'Help a worker understand the importance of collaboration and delegation among the daily tasks.',
  'Help a worker imagine the order of tasks in which they work on a particular day.',
  'Help a worker externalize what their plan is for the day to evaluate if their plan is realistic or not.',
  'Help a worker reflect on whether their daily plan matches their core values.',
  'Help a worker think about ways to manage time efficiently within a daily plan.',
  'Help a worker be aware of their emotional state and understand how that can impact their day on a particular day.',
  'Help a worker plan their breaks for the day, which will help them manage their time efficiently.',
  'Help a worker have a positive beginning of the day.',
  'Help a worker find time for an active lifestyle during the day at work.',
  'Help a worker identify and regulate the stress that they may have for the day.',
  'Suggest a worker to reward themselves when they accomplish their goals with a few tangible options.',
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
You have to help workers externalize their thoughts with respect to the goal by asking drawing questions based on the goal which is: ${goal}. 
Initiate a conversation given the goal.
Make sure to keep the question short and easy to answer as much as possible. Your output should be within a sentence of 20 words.
Make sure that you do one thing at a time. Either ask a question or acknowledge the user.
I will tip you $20 if you are perfect and end the conversation gracefully, and I will fine you $40 if you give verbose responses.
`;
var messages = [
  { role: 'system', content: systemPrompt },
];
// Function to get a response from the AI based on the user input and conversation history
const getMorningAIResponse = async (userId, userInput) => {

  var userPrompt = "";
  console.log("message counter: ", messageCounter);
  
  if (messageCounter > 3) {
    userPrompt =  "End the conversation gracefully now."
  }
  else {
    userPrompt = ". Note: If the conversation is on the stage where the user has planned the goal in their day, consider ending the conversation. Make sure to keep the question short and easy to answer as much as possible. Your output should be a sentence upto 10 words."

  }
  userInput+=userPrompt;
  console.log("user input: ", userInput);
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
    messageCounter+=1;
    saveConversation(userId, messages);
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
  getMorningAIResponse
}




// Storage for conversation context
// const conversationStoragePath = path.join(__dirname, 'conversationStorage.json');

// const loadConversation = (userId) => {
//   if (fs.existsSync(conversationStoragePath)) {
//     const data = fs.readFileSync(conversationStoragePath, 'utf8');
//     const conversations = JSON.parse(data);
//     return conversations[userId] || [];
//   }
//   return [];
// };

