const CryptoJS = require('crypto-js');

const encryptData = (key, strData) => {
  const encryptedData = CryptoJS.AES.encrypt(strData, key).toString();
  return { key: getModifiedKey(key), encryptedData };
};

const decryptData = (key, strData) => {
  const bytes = CryptoJS.AES.decrypt(strData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const getKey = key => {
  const regExp = new RegExp(process.env.REACT_APP_KEY_STR_NEW_SEP, 'g');
  let newKey = Buffer.from(key, 'base64').toString('utf8');
  newKey = newKey
    .slice(0, newKey.length - parseInt(process.env.REACT_APP_RANDOM_STR_LEN))
    .slice(parseInt(process.env.REACT_APP_RANDOM_STR_LEN));
  return Buffer.from(newKey, 'base64')
    .toString('utf8')
    .replace(regExp, process.env.REACT_APP_KEY_STR_SEP);
};

const getModifiedKey = key => {
  const regExp = new RegExp(process.env.REACT_APP_KEY_STR_SEP, 'g');
  let newKey = Buffer.from(key.replace(regExp, process.env.REACT_APP_KEY_STR_NEW_SEP)).toString(
    'base64'
  );
  // Above key should leave remainder of 1 when divide by 3 as random string length leave remainder of 1.
  newKey = `${getRandomStringOfLen(
    process.env.REACT_APP_RANDOM_STR_LEN
  )}${newKey}${getRandomStringOfLen(process.env.REACT_APP_RANDOM_STR_LEN)}`;
  return Buffer.from(newKey).toString('base64');
};

const getRandomStringOfLen = len => {
  let randomstr = Math.random()
    .toString(36)
    .slice(2);
  while (randomstr.length < len) {
    randomstr += Math.random()
      .toString(36)
      .slice(2);
  }
  return randomstr.slice(0, len);
};

module.exports = { encryptData, decryptData, getKey, getModifiedKey, getRandomStringOfLen };
