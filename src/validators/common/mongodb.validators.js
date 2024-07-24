const { body, param } = require ("express-validator");

/**
 *
 * @param {string} idName
 * @description A common validator responsible to validate mongodb ids passed in the url's path variable
 */
module.exports.mongoIdPathVariableValidator = (idName) => {
  return [
    param(idName).notEmpty().isMongoId().withMessage(`Invalid ${idName}`),
  ];
};

/**
 *
 * @param {string} idName
 * @description A common validator responsible to validate mongodb ids passed in the request body
 */
module.exports.mongoIdRequestBodyValidator = (idName) => {
  return [body(idName).notEmpty().isMongoId().withMessage(`Invalid ${idName}`)];
};