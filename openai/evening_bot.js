const { analyzeConversation } = require('./conversation_analyzer');
const { observeEveningConversation } = require('./conversation_observer_evening');
const { breakSentence } = require('./breakSentence');
require('dotenv').config();
const { OpenAI } = require('openai');
const { getConversation, updateUser, getUser, addConversation } = require('../database/db_models');
const { DateTime } = require('luxon');
const _ = require('lodash');

// Setup OpenAI configuration
const openai = new OpenAI(process.env.OPENAI_API_KEY);

var messages_dict = {};
var conversation_dict = {};
var morningConversation = "";
var user_counters = {};

const initializeEveningBot = async (userId) => {
  console.log("initialzing evening bot");

  //if the user ID does not exist in the dictionary, add the user
  const user = await getUser(userId);
  if (!messages_dict[userId] || !conversation_dict[userId] || !user_counters[userId]) {
    messages_dict[userId] = [];
    conversation_dict[userId] = [];
    user_counters[userId] = 0;
  }
  //empty messages from the previous day's conversation
  messages_dict[userId] = [];
  conversation_dict[userId] = [];
  let systemPrompt = "";
  let currentDateTime = DateTime.now().setZone('America/New_York');
  let todayDate = currentDateTime.toISODate();
  const currentTime = currentDateTime.toISOTime();
  const currentDay = currentDateTime.toFormat('cccc');
// Print the current day
  console.log("Current Day:", currentTime); // Example output: Monday
  console.log("date today is luxon:", todayDate);

  morningConversation = await getConversation(userId, todayDate,'morning');
  morningConversation = JSON.stringify(morningConversation);
  //console.log("Summary of morning conversation: ", morningConversation)
  let { eveningGoals, eveningUsedGoals } = user;
  var removedGoal = "";
  // Check if there is at least one goal to remove
  if (eveningGoals.length === 0) {
    console.log("no goals left in evening. replacing with used goals");
    await updateUser(userId,{
      eveningGoals: eveningUsedGoals,
      eveningUsedGoals: [],
    });
    eveningGoals = eveningUsedGoals;
    eveningUsedGoals = [];
  }
    // Shuffle and remove the first goal from the goals array
  const eveningShuffledGoals = _.shuffle(eveningGoals);
  removedGoal = eveningShuffledGoals.shift(); // Removes the element at index 0
  let index = eveningGoals.indexOf(removedGoal);
  console.log("index is ", index);
  if (index !== -1) {
    eveningGoals.splice(index, 1);
  }
  // Add the removed goal to the usedGoals array
  const updatedUsedGoals = [...eveningUsedGoals, removedGoal];
  console.log("morning convo is", morningConversation);
  if (morningConversation === undefined || morningConversation === []){
    /*
     * If no conversation for today check if yesterday's convo has been checked in? 
     * In case of new user, there would be no yesterday's convo
     */
    systemPrompt = `You are a productivity/well-being coach whose goal is to ${removedGoal}. You check in with this user at the end of their day for their self-reflection.
    There are a few rules:
  - Your greetings should be appropriate with the time and day. For instance, if it is weekend tomorrow you do not suggest work. Today is ${currentDay}. The time right now is: ${currentTime}
  - Within the context of the morning conversation, ${removedGoal}.
  - Make sure to keep the question short and easy to answer as much as possible.
  - Each question and response should be roughly within 30 words.
  - Use emojis appropriately.
  - Rather than making the conversation continue, find a way to ask a question that can wrap up the conversation.`;

  } else {
    systemPrompt = `You are a productivity/well-being coach whose goal is to ${removedGoal}. You check in with this user at the end of their day for their self-reflection.
    There are a few rules:
  - Your greetings should be appropriate with the time and day. For instance, if it is weekend tomorrow you do not suggest work. Today is ${currentDay}. The time right now is: ${currentTime}
  - Your questions should be within the context of the morning conversation and the goal which was: ${removedGoal}.
  - Make sure to keep the question short and easy to answer as much as possible.
  - Each question and response should be roughly within 30 words.
  - Use emojis appropriately.
  - Rather than making the conversation continue, find a way to ask a question that can wrap up the conversation.
  The conversation that you had with the worker in the morning is provided below.
    <<< 
    ${morningConversation} 
    >>>`;
  }
  messages_dict[userId].push({ role: 'system', content: systemPrompt });
  await updateUser(userId, { 
    eveningGoals: eveningGoals, 
    eveningUsedGoals: updatedUsedGoals,
    messageCounter: 0,
  } );
  user_counters[userId] = 0;
  console.log("Initialized evening bot for user: ", userId);
  console.log("System prompt for evening is: ", systemPrompt);
};

// Function to get a response from the AI based on the user input and conversation history
const getEveningAIResponse = async (userId, userInput) => {
  const user = await getUser(userId);
  var messageCounter = user_counters[userId];
  if (!userInput.includes('Begin conversation. Start by a greeting.')){
    //conversation is a list we use to send ongoing conversation progress to the observer
    conversation_dict[userId].push({ role: 'user', content: userInput });
  }
  var userPrompt = "";
  console.log("message counter: ", messageCounter);

  //conversation state analysis is after 4 messages
  if (messageCounter > 3){
    const currentConvo = conversation_dict[userId].filter(message => message.role === 'user' || message.role === 'assistant').map(message => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
    .join('\n');
    const response = await observeEveningConversation(currentConvo, morningConversation);
    let parsedResponse = "";
    try{
      parsedResponse = JSON.parse(response);
    }
    catch (error){
      console.error(`Error parsing the JSON object from morningConversationObserver:`, error);
      return "Oops! Something went wrong, please report Adnan!";
    }
    const state = parsedResponse["state"];
    const engagement_score = parsedResponse["engagement_score"];
    console.log("evening convo state ", state);
    console.log("evening convo score ", engagement_score);    
    console.log("rationale from observer", parsedResponse["rationale"]);
    if (state === "Continue"){
      userPrompt = "";
    }
    else if (state === "End" || engagement_score < 2){
      userPrompt = "Consider a smooth (NOT abrupt) end to the conversation by: greeting the user or letting them know you are available for any further assistance or any other technique";
    }
  }

  //Keep the user's emotion in mind before asking the question
  if (userPrompt!=""){
    userInput+=" "+"["+userPrompt+"]";
  }
  console.log("evening user input is: ", userInput);
  messages_dict[userId].push({ role: 'user', content: userInput });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages_dict[userId],
      max_tokens: 500,
    });

    const aiMessage = response.choices[0];
    const aiMessageContent = aiMessage.message.content;
    const brokenSentence = await breakSentence(aiMessageContent);
    let parsedBrokenSentence = "";
    let is_broken = false;
    let sentence_1 = "";
    let sentence_2 = "";
    //Fall back mechanism for JSON parsing to minimize AI unpredictability.
    try{
      parsedBrokenSentence = JSON.parse(brokenSentence);
      is_broken = true;
    }
    catch (error){
      console.error(`Error parsing the JSON object from breakSentence:`, error);
      is_broken = false;
      sentence_1 = aiMessageContent;
      sentence_2 = "";
    }
    //length checks for further AI unpredictability.
    if (is_broken){
      console.log("length of orignial evening response", aiMessageContent.length);
      console.log("the parsed json", parsedBrokenSentence);
      const sentenceOne = parsedBrokenSentence["sentence_1"];
      const sentenceTwo = parsedBrokenSentence["sentence_2"];
      const lengthOfBothSentences = sentenceOne.length + sentenceTwo.length;
      console.log("length of both sentences", lengthOfBothSentences);
      const buffer = 5;
      if ((lengthOfBothSentences+buffer) < aiMessageContent.length){
        is_broken = false;
        sentence_1 = aiMessageContent;
        sentence_2 = "";
      }
      else{
        is_broken = true;
        sentence_1 = parsedBrokenSentence["sentence_1"];
        sentence_2 = parsedBrokenSentence["sentence_2"];
      }
    }
    messages_dict[userId].push({ role: 'assistant', content: aiMessageContent });
    conversation_dict[userId].push({ role: 'assistant', content: aiMessageContent });
    user_counters[userId] += 1;
    console.log("response from evening bot: ", brokenSentence);
    await saveConversationToDB(userId,user.userName, conversation_dict[userId]);
    const aiResponse = {
      is_broken: is_broken,
      sentence_1: sentence_1,
      sentence_2: sentence_2
    };
    console.log("my constructed thing evening", JSON.stringify(aiResponse));
    return aiResponse;
  }
  catch (error) {
      console.error(`Error getting response from OpenAI:`, error);
      return "Oops! something went wrong, please report Adnan!";
      //throw error;
  }


};

const saveConversationToDB = async (userId,userName, messages) => {
  const currentDate = DateTime.now().setZone('America/New_York').toISODate();
  
  // Extract the latest user and assistant messages
  const latestUserMessage = messages.filter(message => message.role === 'user').pop();
  const latestAssistantMessage = messages.filter(message => message.role === 'assistant').pop();

  let eveningConversation = [];
  if (latestUserMessage) {
    eveningConversation.push(latestUserMessage);
  }
  if (latestAssistantMessage) {
    eveningConversation.push(latestAssistantMessage);
  }
  // Save the conversation to the database
  await addConversation(userId,userName, currentDate, eveningConversation, 'evening');
};
module.exports = {
  getEveningAIResponse,
  initializeEveningBot
}
