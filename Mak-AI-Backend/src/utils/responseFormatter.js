/**
 * Standard response formatter for API responses
 */
const responseFormatter = {
  /**
   * Format success response
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   * @returns {Object} Formatted response
   */
  success: (data = null, message = 'Success', statusCode = 200) => {
    return {
      success: true,
      message,
      data,
      statusCode
    };
  },

  /**
   * Format error response
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {*} errors - Additional error details
   * @returns {Object} Formatted error response
   */
  error: (message = 'An error occurred', statusCode = 500, errors = null) => {
    const response = {
      success: false,
      message,
      statusCode
    };

    if (errors) {
      response.errors = errors;
    }

    return response;
  }
};

module.exports = {
  responseFormatter
};

