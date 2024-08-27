const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const { analyzeConversation } = require('./conversation_analyzer');

const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Function to observe the conversation
const observeEveningConversation = async (conversation, morningSummary) => {


  const systemPrompt = `You are an expert conversation analyzer that determines the state of a conversation history and decides whether a conversation should be continued or ended.
  The context of the conversation provided to you is that it is happening after the user had a conversation with the assistant in the morning and now this assistant is checking up with the user in the evening.
  The MORNING CONVERSATION SUMMARY is encapsulated by delimiters below. This is just for your reference. Actual conversation to analyze is given later.
  <<<
  ${morningSummary}
  >>>
  Now, conversations can be in 2 states with each state having sub-goals defined below:
  1. Continue: The user seems engaged in the conversation or the user has not talked about anything from the morning conversation
  2. End: The user has talked about the morning conversation or the user is unengaged
  Your job is to analyze conversation between a gpt assistant and a user who is reflecting on their day.
  You are assigned with the task to analyze this EVENING CONVERSATION that a worker is having with a gpt assistant encapsulated by delimiters below:
  <<< 
  ${conversation}
  >>>
  Examine this conversation and determine its state. Your output should be in JSON format:
  (1) state: Continue or End
  (2) rationale: Describe your rationale on how you decided about the state and score.
  (3) engagement_score: a number from 0-5
  Ensure that the output is a valid JSON string. Don't include the word json in output. Output should be in JSON string like this so I can call JSON.parse on the response you provide
  {
   state: ,
   rationale: ,
   engagement_score: 
  }`;

  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 500,
      temperature:0,
    });

    const aiMessage = response.choices[0];
    console.log("Evening observer response: ", aiMessage.message.content);
    return aiMessage.message.content;
  } catch (error) {
    console.error(`Error getting response from OpenAI:`, error);
    return "Oops! something went wrong, please report Adnan!";
  }
};


module.exports = {
    observeEveningConversation
}