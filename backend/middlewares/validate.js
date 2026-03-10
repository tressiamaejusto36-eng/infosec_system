import { validationResult } from "express-validator";

/**
 * Middleware to check express-validator results.
 * Place after your validation chain in route definitions.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: messages,
    });
  }
  next();
};

export default validate;
