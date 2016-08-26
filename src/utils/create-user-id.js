
/* eslint-disable global-require */
const crypto = require('crypto');

// Fallback: Use generated UUID
const createUUID = () => require('node-uuid').v4();

// Create user ID by hashing the machines mac address
const createUserId = (callback) => {
  try {
    require('getmac').getMac((err, macAddress) => {
      if (err) {
        callback(createUUID());
      } else {
        crypto.pbkdf2(macAddress, macAddress, 32768, 20, 'sha256', (error, hashedMac) => {
          if (error) {
            callback(createUUID());
          } else {
            callback(hashedMac.toString('hex'));
          }
        });
      }
    });
  } catch (err) {
    callback(createUUID());
  }
};

module.exports = createUserId;
