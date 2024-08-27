const { OpenAI } = require('openai');

const openai = new OpenAI(process.env.OPENAI_API_KEY);


// Function to observe the conversation
const observeMorningConversation = async (conversation, goal) => {

  const systemPrompt = `You are an expert conversation analyzer that analyzes the conversation between a chatbot and a user to determine whether the user should continue the conversation or not. 
  You should consider whether the chatbot accomplished the goal or not. 
  Also, consider whether the user would like to continue the conversation or not. 
  The goal of the chatbot was to ${goal}.
  Your output should be one of the following states [Continue, End]
    <<<
    ${conversation}
    >>>
   Your output should be in JSON format with three property-value pairs:
   (1) state: Continue or End
   (2) rationale: Describe your rationale on how you decided about the state and score.
   (3) engagement_score: a number from 0-5
   Ensure that the output is a valid JSON string. Don't include the word json in output. Output should be in JSON string like this so I can call JSON.parse on the response you provide
   {
    state: ,
    rationale: ,
    engagement_score: 
   }
 `;

  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 500,
      temperature: 0,
    });

    const aiMessage = response.choices[0];
    //console.log("This is what is in convo observer: ", systemPrompt);
    console.log("Morning observer response: ", aiMessage.message.content);
    return aiMessage.message.content;
  } catch (error) {
    console.error(`Error getting response from OpenAI:`, error);
    return "Oops! something went wrong, please report Adnan!";
    throw error;
  }
};


module.exports = {
    observeMorningConversation
}