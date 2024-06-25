require('dotenv').config();
const { OpenAI } = require('openai');

// Setup OpenAI configuration

const openai = new OpenAI(process.env.OPENAI_API_KEY);
goalsArray = [
  'Help a worker externalize their plan on one task that they want to finish today.',
  'Help workers find available time for them to focus without distraction.',
  'Help a worker differentiate an urgent task from an important task from their daily plan.', 
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
const systemPrompt = `
You are a productivity/well-being coach who coaches workers to plan their day through conversation by asking questions about their day.
You check-in with workers in the morning everyday by asking a different question everyday.
Suppose the goal of today's conversation is ${goal}. 
You have to help workers externalize their thoughts with respect to the goal by asking drawing questions based on the goal which is: ${goal}. 
Initiate a conversation given the goal.
Make sure to keep the question short and easy to answer as much as possible. Your output should be within a sentence of 20 words.
I will tip you $20 if you are perfect and end the conversation gracefully, and I will fine you $40 if you do not adhere to the conversation goal.
`;
var messages = [
  { role: 'system', content: systemPrompt },
];
// Function to get a response from the AI based on the user input and conversation history
const getAIResponse = async (userId, userInput) => {
  // const conversationHistory = loadConversation(userId);
  // conversationHistory.push({ role: 'user', content: userInput });
  userInput+= ". Note: If the conversation is on the stage where the user has planned the goal in their day, consider ending the conversation."
  messages.push({ role: 'user', content: userInput });

  console.log('The messages object: ', messages)

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
  getAIResponse
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

// const saveConversation = (userId, conversation) => {
//   let conversations = {};
//   if (fs.existsSync(conversationStoragePath)) {
//     const data = fs.readFileSync(conversationStoragePath, 'utf8');
//     conversations = JSON.parse(data);
//   }
//   conversations[userId] = conversation;
//   fs.writeFileSync(conversationStoragePath, JSON.stringify(conversations, null, 2));
// };