const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI;

module.exports.mongooseContect = async () => {
  try {
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log('Connected to Mongoose');
    }
  } catch (err) {
    console.error('Failed to connect to Mongoose', err);
  }
};
