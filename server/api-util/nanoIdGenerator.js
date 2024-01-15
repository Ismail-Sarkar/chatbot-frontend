const { customAlphabet } = require('nanoid');

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);
// var { nanoid } = require('nanoid');
// var ID = nanoid();

function generateNanoId() {
  return nanoid();
}

module.exports = generateNanoId;
