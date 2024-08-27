const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Function to load the conversation from the JSON file
const loadConversation = (userId, date) => {
  const conversationPath = path.join(__dirname, '..', 'conversations', `${userId}.json`);
  if (fs.existsSync(conversationPath)) {
    const fileContent = JSON.parse(fs.readFileSync(conversationPath, 'utf8'));
    return fileContent[date] || [];
  } else {
    throw new Error(`Conversation file for user ${userId} does not exist.`);
  }
};

// Function to analyze the conversation
const analyzeConversation = async (userId, date) => {
  const conversation = loadConversation(userId, date);
  const systemPrompt = `
You are a conversation analyzer. You are given a conversation between a user and an assistant in the JSON format. This conversation took place in the user's morning before they started their work day.
Your task is to analyze the conversation based on the following criteria:
1. Identify the main topics discussed.
2. Determine the emotional tone of the conversation.
3. Highlight any actionable items or tasks mentioned.
4. Identify the goal of the conversation in 20 words.

Here is the conversation seperated by delimiters:
<<<
${JSON.stringify(conversation, null, 2)}
>>>
If the conversation has just 2-3 messages then your output should be: "No conversation data"
Your output should be around 200 words.
  `;

  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 500,
      temperature: 0,
    });

    const aiMessage = response.choices[0];
    return aiMessage.message.content;
  } catch (error) {
    console.error(`Error getting response from OpenAI:`, error);
    throw error;
  }
};

// Example usage
// (async () => {
//   try {
//     const userId = 'exampleUserId';
//     const date = '2024-06-25';
//     const analysisPrompt = 'Provide a detailed analysis based on the criteria listed above.';
    
//     const analysis = await analyzeConversation(userId, date, analysisPrompt);
//     console.log('Conversation Analysis:', analysis);
//   } catch (error) {
//     console.error('Error analyzing conversation:', error);
//   }
// })();


module.exports = {
    analyzeConversation
}