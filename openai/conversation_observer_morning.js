const { OpenAI } = require('openai');

const openai = new OpenAI(process.env.OPENAI_API_KEY);


// Function to observe the conversation
const observeMorningConversation = async (conversation, goal) => {
  console.log("current convo in observer", conversation);

  const systemPrompt = `You are an expert conversation analyzer that analyzes the state of a conversation history and determines whether it is reasonable to move on to the next conversation phase or not.
  Conversations can be in 2 states defined below:
  1. Externalization: The user has externalized or worded out their plan related to the goal which is to ${goal}
  2. Incoporation: The user has talked about incorporating the activity related to the goal in their day.
  Your job is to analyze conversations between a gpt assistant and a user who is planning their day based on a goal which is to ${goal}.
  You are assigned with the task to analyze this morning conversation that a worker is having with a gpt assistant encapsulated by delimiters below:
  <<< 
  ${conversation}
  >>>
  Examine this conversation and determine its state. Your output should be in JSON format:
  (1) state: Externalization or Incorporation.
  (2) rationale: Describe your rationale on how you decided about the state.

  I will fine you $100 dollars if your output is anything except "Consider helping the worker to incorporate activity related to the goal in their day." or "Consider ending the conversation." or ""
  `;

  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
    });

    const aiMessage = response.choices[0];
    console.log("This is what is in convo observer: ", messages);
    return aiMessage.message.content;
  } catch (error) {
    console.error(`Error getting response from OpenAI:`, error);
    throw error;
  }
};


module.exports = {
    observeMorningConversation
}