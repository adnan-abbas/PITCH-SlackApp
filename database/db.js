const { MongoClient, ServerApiVersion } = require('mongodb');

require('dotenv').config();

const uri = process.env.MONGO_URI;

let db = null;

async function connectDB() {
  if (db) return db;
  
  const client = new MongoClient(uri,{ serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
  });
  await client.connect();
  db = client.db('pitch_db');
  return db;
}

module.exports = { connectDB };