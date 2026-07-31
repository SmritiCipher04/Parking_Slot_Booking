/**
 * Database Status Logger Middleware
 * Ensures non-blocking execution across connected and offline states.
 */

const checkDbConnection = (req, res, next) => {
  next();
};

module.exports = checkDbConnection;
