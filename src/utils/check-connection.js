const dns = require('dns');

export default function checkConnection(cb) {
  dns.lookup('google.com', (err) => {
    if (err && err.code === 'ENOTFOUND') {
      cb(false);
    } else {
      cb(true);
    }
  });
}
