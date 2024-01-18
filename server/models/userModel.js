const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    sharetribeId: { type: String, unique: true, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model('users', UserSchema);

module.exports.addUser = async (sharetribeId, userName) => {
  const savedUser = await User.findOne({ sharetribeId }, null, {
    lean: true,
  }).exec();
  if (!!savedUser) return savedUser;
  const user = await User.create({ sharetribeId, userName });
  return user;
};
module.exports.updatedUserName = async (sharetribeId, userName) => {
  const user = await User.findOneAndUpdate(
    { sharetribeId },
    { userName },
    { lean: true, new: true }
  ).exec();
  return user;
};

module.exports.getUserBySharetribeId = async sharetribeId => {
  const user = await User.findOne({ sharetribeId }, null, {
    lean: true,
  }).exec();
  return user;
};
