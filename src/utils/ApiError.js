class ApiError extends Error {
  /**
   *
   * @param {number} statusCode
   * @param {string} message
   * @param {any[]} errors
   * @param {string} stack
   */
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Define how the object should be serialized to JSON
  toJSON() {
    return {
      statusCode: this.statusCode,
      data: this.data,
      success: this.success,
      message: this.message, // Include the message
      errors: this.errors,
    };
  }
}

module.exports = { ApiError };
