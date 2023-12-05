const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;
console.log(`mongo db uri -> ${uri}`);
try {
  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, () =>
    console.log('connected to db')
  );
} catch (error) {
  console.log(error);
  console.log('could not connect');
}
