const mongoose = require('mongoose');
const dns = require('node:dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 7000,
    });
    isConnected = !!conn.connections[0].readyState;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
