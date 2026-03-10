/**
 * Security utility functions
 */

/**
 * Validates query parameters for NoSQL injection attempts
 * @param {Object} query - Express req.query object
 * @param {Object} res - Express response object
 * @returns {boolean} - true if safe, false if injection detected
 */
export const validateQueryParams = (query, res) => {
  for (const key in query) {
    if (key.includes('$') || key.includes('.')) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameter format.",
      });
      return false;
    }
    
    // Check if value is an object (potential injection)
    if (typeof query[key] === 'object' && query[key] !== null) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameter format.",
      });
      return false;
    }
  }
  return true;
};

/**
 * Sanitizes a string for XSS prevention
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};