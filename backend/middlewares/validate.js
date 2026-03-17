import { validationResult } from "express-validator";

/**
 * Middleware to check express-validator results.
 * Place after your validation chain in route definitions.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    console.log('📝 Request body:', req.body);
    
    const messages = errors.array().map((err) => `${err.path}: ${err.msg}`);
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: messages,
      details: errors.array() // Include detailed error info for debugging
    });
  }
  next();
};

export default validate;
