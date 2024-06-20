const { OpenAI } = require('langchain');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Placeholder for the system prompt
const systemPrompt = `
You are an assistant that helps users with their daily planning and productivity. 
You generate morning questions to help users plan their day and evening questions to help them reflect on their day.
`;

// Storage for conversation context
const conversationStoragePath = path.join(__dirname, 'conversationStorage.json');

const loadConversation = (userId) => {
  if (fs.existsSync(conversationStoragePath)) {
    const data = fs.readFileSync(conversationStoragePath, 'utf8');
    const conversations = JSON.parse(data);
    return conversations[userId] || [];
  }
  return [];
};

const saveConversation = (userId, conversation) => {
  let conversations = {};
  if (fs.existsSync(conversationStoragePath)) {
    const data = fs.readFileSync(conversationStoragePath, 'utf8');
    conversations = JSON.parse(data);
  }
  conversations[userId] = conversation;
  fs.writeFileSync(conversationStoragePath, JSON.stringify(conversations, null, 2));
};

// Function to get a response from the AI based on the user input and conversation history
const getAIResponse = async (userId, userInput) => {
  const conversationHistory = loadConversation(userId);
  conversationHistory.push({ role: 'user', content: userInput });

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
  ];

  const response = await openai.complete({
    messages,
    maxTokens: 150,
  });

  const aiMessage = response.choices[0].message;
  conversationHistory.push(aiMessage);
  saveConversation(userId, conversationHistory);

  return aiMessage.content;
};

module.exports = {
  getAIResponse,
  loadConversation,
  saveConversation,
};