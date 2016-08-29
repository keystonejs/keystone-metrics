
/**
 * Sanitize option passed to Keystone to make sure they don't contain any personally identifieable
 * information
 */

module.exports = function sanitize(key, option) {
  return !!option;
};
