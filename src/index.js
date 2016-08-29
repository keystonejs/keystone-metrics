
/**
 * keystone-metrics
 *
 * For a full list of supported parameters, see
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Heavily inspired by Atom Editors metrics package. (https://github.com/atom/metrics)
 */

import querystring from 'querystring';

import request from 'request';
import assign from 'lodash/assign';
import keystone from 'keystone';

import checkConnection from './utils/check-connection';
import createUserId from './utils/create-user-id';
import sanitize from './sanitize';

const NOOP = () => {};
let USER_ID;
const OPTIONS = {};

// FIXME These should do the right thing, not be hardcoded
const shouldReport = () => true;
const getAppName = () => 'asdf1234';

module.exports = class MetricsReporter {
  static sanitize(option) {
    return sanitize(option);
  }

  static setOption(key, value) {
    OPTIONS[key] = value;
  }

  static sendOptions() {
    console.log('sendOptions', querystring.stringify({ options: JSON.stringify(OPTIONS) }));
  }

  // Default parameters passed with each request
  static defaultParams(userID) {
    const memUse = process.memoryUsage();
    const memUseInMb = memUse.heapUsed >> 20;
    const memUseInPercentage = Math.round((memUse.heapUsed / memUse.heapTotal) * 100);
    return {
      v: 1,                        // required; Google Analytics Version
      tid: 'UA-43979816-2',        // required; Google Analytics ID
      cid: userID,                 // required; User ID (hashed MAC address)
      aip: 1,                      // Anonymize IP adresses
      an: getAppName(),            // Hashed object of all options
      av: keystone.version,        // Keystone version
      aiid: keystone._options.env, // Environment ("development" or "production")
      // Custom variables
      cm1: process.version,        // Node.js version
      cm2: process.platform,       // Operating system platform
      cm3: memUseInMb,             // Memory usage in MB
      cm4: memUseInPercentage,     // Memory usage in %
    };
  }

  // Send when an event happened
  static sendEvent(category, action, options) {
    let callback;
    let label;
    let value;
    // Default callback and value
    if (typeof options === 'function') {
      callback = options;
    } else {
      callback = options.callback;
      label = options.label;
      value = options.value;
    }
    const params = {
      t: 'event',
      ec: category,
      ea: action,
    };
    if (label != null) { params.el = label; }
    if (value != null) { params.ev = value; }

    this.send(params, callback);
  }

  // Send a timing
  static sendTiming(category, name, value, callback) {
    const params = {
      t: 'timing',
      utc: category,
      utv: name,
      utt: value,
    };

    this.send(params, callback);
  }

  // Send that an exception happened
  static sendException(description, callback) {
    const params = {
      t: 'exception',
      exd: description,
      // exf: atom.inDevMode() ? '0' : '1',
    };

    this.send(params, callback);
  }

  // UNUSED Send that a command was entered
  static sendCommand(commandName, callback) {
    if (this.commandCount == null) { this.commandCount = {}; }
    if (this.commandCount[commandName] == null) { this.commandCount[commandName] = 0; }
    this.commandCount[commandName]++;

    const params = {
      t: 'event',
      ec: 'command',
      ea: commandName.split(':')[0],
      el: commandName,
      ev: this.commandCount[commandName],
    };

    this.send(params, callback);
  }

  // Send something, optionally passing a callback
  static send(params, cb) {
    const callback = cb || NOOP;
    if (!USER_ID) {
      createUserId((userID) => {
        USER_ID = userID;
        assign(params, this.defaultParams(userID));
        this.request(`https://ssl.google-analytics.com/collect?${querystring.stringify(params)}`, callback);
      });
    } else {
      assign(params, this.defaultParams(USER_ID));
      this.request(`https://ssl.google-analytics.com/collect?${querystring.stringify(params)}`, callback);
    }
  }

  // Send the request
  static request(url, callback) {
    if (!shouldReport()) return;
    checkConnection((connected) => {
      if (connected) {
        request.post(url)
          .on('error', (err) => {
            callback(err);
          })
          .on('response', (response) => {
            callback(response);
          });
      }
    });
  }
};
