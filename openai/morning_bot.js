require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const { breakSentence } = require('./breakSentence');
const { addConversation, updateUser, getUser, getConversation } = require('../database/db_models');
const { DateTime } = require('luxon');
const _ = require('lodash');


// Setup OpenAI configuration
const openai = new OpenAI(process.env.OPENAI_API_KEY);
const { observeMorningConversation } = require('./conversation_observer_morning');

var messages_dict = {};
var conversation_dict = {};
var user_counters = {};
var goal = "";
const initializeMorningBot = async (userId) =>{
  const user = await getUser(userId);
  console.log("initializing morning bot for user:", user.userName);
  if (!messages_dict[userId] || !conversation_dict[userId] || !user_counters[userId]) {
    console.log("created message list for user")
    messages_dict[userId] = [];
    conversation_dict[userId] = [];
    user_counters[userId] = 0;
  }
  messages_dict[userId] = [];  //empty messages from the previous day's conversation
  conversation_dict[userId] = []; // empty the ongoing conversation DS
  user_counters[userId] = 0;
  var removedGoal = "";
  let { morningGoals, morningUsedGoals } = user;
  if (morningGoals.length === 0) {
    console.log("No morning goals left for this worker...Replacing goals from the used Goals");
    await updateUser(userId,{
      morningGoals: morningUsedGoals,
      morningUsedGoals: [],
    });
    morningGoals = morningUsedGoals;
    morningUsedGoals = [];
  }

  console.log("BEFORE shuffle", JSON.stringify(morningGoals));
  morningShuffledGoals = _.shuffle(morningGoals);
  console.log("AFTER shuffle", morningShuffledGoals);
  removedGoal = morningShuffledGoals.shift(); // Removes the element at index 0
  let index = morningGoals.indexOf(removedGoal);
  console.log("index is ", index);
  if (index !== -1) {
    morningGoals.splice(index, 1);
  }

  // Shuffle and remove the first goal from the goals array
  goal = removedGoal;
  // Add the removed goal to the usedGoals array
  const updatedUsedGoals = [...morningUsedGoals, removedGoal];
  // Update the user's document in the database
  /**
   * TODO: 
   * The morning bot should have the context of the last three questions asked and should rotate the question if its the same.
   * The bot should allow the user to have the conversation that they want to lead by sticking to the higher-level goals but changing the focused goal of the conversation.
   */
  let currentDateTime = DateTime.now().setZone('America/New_York');
  let todayDate = currentDateTime.toISODate();
  const currentTime = currentDateTime.toISOTime();
  const currentDay = currentDateTime.toFormat('cccc');
// Print the current day
  console.log("Current Day:", currentDay); // Example output: Monday
  console.log("date today is luxon:", todayDate);
  const systemPrompt = `
  You are a productivity/well-being coach who helps workers plan their day through conversation by asking questions about their day.
  You check in with workers in the morning by asking a question.
  Suppose the goal of today's conversation is to  ${removedGoal}.
  You have to help workers make their day's plan concrete based on the goal.
  Make sure to keep your response short and keep the question short and easy to answer as much as possible.
  Your conversation should be appropriate with the time and day. For instance, if it is weekend you do not suggest work. Today is ${currentDay}. The time right now is: ${currentTime}
  Each response should be roughly within 30 words.
  Use emojis appropriately.
  Do not assume that the user thought about something (e.g.,  “their core values” ) instead lead the conversation so user doesn't have to put effort.
  Rather than making the conversation continue, find a way to ask a question that can wrap up the conversation.
  Do not end the conversation without asking any questions at all.   
  `;

  console.log("Morning System Prompt is: ", systemPrompt);
  messages_dict[userId].push({ role: 'system', content: systemPrompt });
  await updateUser(userId, { 
    morningGoals: morningGoals, 
    morningUsedGoals: updatedUsedGoals,
    messageCounter: 0,
  } 
);
}
// Function to get a response from the AI based on the user input and conversation history
const getMorningAIResponse = async (userId, userInput) => {
  const user = await getUser(userId);
  var messageCounter = user_counters[userId];
  //We do not want to run the observer on the very first message that intiates the conversation
  var state = "";

  if (!userInput.includes('I am a worker beginning my workday. Please initiate the conversation by asking me a question. Start by a greeting.') && !userInput.includes('Please initiate the conversation by asking me a question. Today is the weekend so I dont want to talk about work. Start by a greeting.')){
    //conversation is a list we use to send ongoing conversation progress to the observer
    conversation_dict[userId].push({ role: 'user', content: userInput });
  }
  var userPrompt = "";
  /**
   * State should only be externalized
   * first 3-4 messages does not qualify for state analysis
   */
  if (messageCounter > 3){
    const currentConvo = conversation_dict[userId].filter(message => message.role === 'user' || message.role === 'assistant').map(message => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
    .join('\n');
    const response = await observeMorningConversation(currentConvo, goal);
    let parsedResponse = "";
    try{
      parsedResponse = JSON.parse(response);
    }
    catch (error){
      console.error(`Error parsing the JSON object from morningConversationObserver:`, error);
      return "Oops! Something went wrong, please report Adnan!";
    }
    state = parsedResponse["state"];
    var engagement_score = parsedResponse["engagement_score"];
    console.log("rationale from observer", parsedResponse["rationale"]);
    console.log( "state: ", state)
    console.log("score: ", engagement_score);
    if (state === "Continue"){
      userPrompt = "";
    }
    else if (state === "End" || engagement_score < 2){
      userPrompt = "Consider a smooth (NOT abrupt) end to the conversation on this topic by: greeting the user or letting them know you are available for any further assistance or any other technique";
    }
  }
  if (userPrompt!== ""){
    userInput+=" "+"["+userPrompt+"]";
  }
  console.log("messageCounter: ", messageCounter)
  console.log("userInput: ", userInput);
  messages_dict[userId].push({ role: 'user', content: userInput });
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages_dict[userId],
      max_tokens: 500,
      temperature: 0.2,
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
      console.log("length of orignial response", aiMessageContent.length);
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
    saveConversation(userId, conversation_dict[userId]);
    await saveConversationToDB(userId,user.userName, conversation_dict[userId]);
    user_counters[userId]+=1;
    console.log("response from bot: ", brokenSentence);
    const aiResponse = {
      is_broken: is_broken,
      sentence_1: sentence_1,
      sentence_2: sentence_2
    };
    console.log("my constructed thing", JSON.stringify(aiResponse));
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
  let newMessages = [];
  const latestUserMessage = messages.filter(message => message.role === 'user').pop();
  const latestAssistantMessage = messages.filter(message => message.role === 'assistant').pop();
  if (latestUserMessage){
    newMessages.push(latestUserMessage);
  }
  if (latestAssistantMessage){
    newMessages.push(latestAssistantMessage);
  }
  // Save the conversation to the database
  await addConversation(userId,userName, currentDate, newMessages, 'morning');
  // Save the conversation to the database
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
  getMorningAIResponse,
  initializeMorningBot
}
