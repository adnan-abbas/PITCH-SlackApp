const { OpenAI } = require('openai');

const openai = new OpenAI(process.env.OPENAI_API_KEY);


// Function to observe the conversation
const breakSentence = async (response) => {

  const systemPrompt = `Examine this sentence: ${response}
  If there are more than two parts in the sentence, i.e., an acknowledgement or a question break it into two sentences.
  Break the sentence in two such that the no information from the original sentence is lost.
  The original sentence content should be somewhere in the two sentences you break it into.
  If the sentence is complete, then don't modify it. 
  Use emojis appropriately.
  Make sure that you do not modify any punctuation marks in the original sentence. For example, don't change a question into a sentence with "!"
  Make sure the emoji (if there are any) is placed after the sentences not before it.
  Give output in the following JSON format:
  {
    is_broken: true or false. this will be true if you have broken the original sentence and false if you have not changed the original sentence.
    sentence_1: first part of the sentence,
    sentence_2: second part of the sentence (this will be empty string if is_broken is false)
  }
  Ensure that the output is a valid JSON string. Don't include the word json in output. Output should be in JSON string like this so I can call JSON.parse on the response you provide
  {
    is_broken:,
    sentence_1:,
    sentence_2:,
  }

  Here's an example output for the sentence Great! So that's 15 minutes of walking already. :man-walking::muscle: How about adding a 5-minute stretch before starting your work? :man-cartwheeling::clock7::
  <<<
  {
    is_broken: true,
    sentence_1:  Great! So that's 15 minutes of walking already. :man-walking::muscle:
    sentence_2: How about adding a 5-minute stretch before starting your work? :man-cartwheeling::clock7:
  }
  >>>
 `;

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
    const aiMessageContent = aiMessage.message.content;
    console.log("Response from the sentence breaker: ", aiMessageContent);
    return aiMessageContent;
  } catch (error) {
    console.error(`Error getting response from OpenAI:`, error);
    throw error;
  }
};


module.exports = {
  breakSentence
}