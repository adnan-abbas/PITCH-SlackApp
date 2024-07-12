const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const openai = new OpenAI(process.env.OPENAI_API_KEY);


// Function to observe the conversation
const observeEveningConversation = async (messages) => {
  const systemPrompt = `
You are a conversation analyzer. You are given a conversation between a user and an assistant in the JSON format. This conversation took place in the user's morning before they started their work day.
Your task is to analyze the conversation based on the following criteria:
1. Identify the main topics discussed.
2. Determine the emotional tone of the conversation.
3. Highlight any actionable items or tasks mentioned.




Reflection of time spent can reduce absolute time on unimportant activities
as indicated by the user studies [1, 34]. Recent research suggests that the psychological benefits of
disclosure and reflection with an agent are similar to reflection with another human [18]. Moreover,
reflecting on one’s plans at the end of one’s day can help psychologically detach from work and
support a healthy work-life balance [23, 37, 40]. However, users need a nudge to reflect upon their
activities as reflection does not come naturally to humans [13]. Encouraging reflection on deeper
levels, it is useful to ask contextual questions from users and doing this exercise with an agent can
allow one to see more than one could possibly see alone [13]. Therefore, we need to implement a
conversation storage and retrieval module that can ask personalized reflective questions to users at
the end of their day. We will create prompts that take in the stored morning conversation’s context
to generate personalized reflection questions that can help a worker understand the time spent
during the day. Similar to the morning check-in, we also want to tailor the timing of the evening
reflection according to the user’s schedule so it is easier for users to adopt the habit.



In the Label phase, ChaCha follows up the key event and
helps the user label their associated emotions. The activity in this
phase was inspired and informed by emotion coaching [31] and
emotion card activities

explore actionable solutions


Your output should be around 200 words.
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
    return aiMessage.message.content;
  } catch (error) {
    console.error(`Error getting response from OpenAI:`, error);
    throw error;
  }
};


module.exports = {
    observeEveningConversation
}