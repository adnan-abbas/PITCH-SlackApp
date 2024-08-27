const { connectDB } = require('./db');

async function addUser(userId) {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    await usersCollection.insertOne({
      userId,
      userName:'',
      morningGoals: [],
      eveningGoals: [],
      morningUsedGoals: [],
      eveningUsedGoals: [],
      morningTime: '',
      eveningTime: '',
      messageCounter: 0,
    });
}

async function getAllUsers() {
  const db = await connectDB();
  const usersCollection = db.collection('users');

  try {
    const users = await usersCollection.find({}).toArray();
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}
async function getUser(userId) {
  const db = await connectDB();
  const usersCollection = db.collection('users');
  return await usersCollection.findOne({ userId });
}

async function deleteUser(userId) {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    await usersCollection.deleteOne({ userId });
  }
  
  async function updateUser(userId, updateData) {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    await usersCollection.updateOne({ userId }, { $set: updateData });
  }
  
  // Conversation collection operations
  async function addConversation(userId,userName, date, newMessages, type) {
    const db = await connectDB();
    const conversationCollection = db.collection('conversations');
    
    const updateField = type === 'morning' ? 'morningConversation' : 'eveningConversation';
    console.log("adding new messages", JSON.stringify(newMessages));
    
    // Update the conversation by pushing new messages into the array
    await conversationCollection.updateOne(
      { userId,userName, date },
      { $push: { [updateField]: { $each: newMessages } } },
      { upsert: true }
    );
  }

  
  async function deleteConversation(userId, date) {
    const db = await connectDB();
    const conversationCollection = db.collection('conversations');
    await conversationCollection.deleteOne({ userId, date });
  }

  async function getConversation(userId, date, type) {
    const db = await connectDB();
    const conversationCollection = db.collection('conversations');
    const conversation = await conversationCollection.findOne({ userId, date });
    return conversation ? (type === 'morning' ? conversation.morningConversation : conversation.eveningConversation) : [];
  }
  
  

module.exports = {
    addUser,
    deleteUser,
    updateUser,
    addConversation,
    deleteConversation,
    getConversation,
    getUser,
    getAllUsers
};