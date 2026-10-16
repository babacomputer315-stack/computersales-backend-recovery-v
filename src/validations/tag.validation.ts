import { body } from "express-validator";

export const createTagValidation = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isString()
    .withMessage("Name must be a string")
    .bail()
    .isLength({ max: 255 })
    .withMessage("Name must be at most 255 characters"),

  body("slug")
    .notEmpty()
    .withMessage("Slug is required")
    .bail()
    .isString()
    .withMessage("Slug must be a string")
    .bail()
    .isLength({ max: 255 })
    .withMessage("Slug must be at most 255 characters"),
];

export const updateTagValidation = [
  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string")
    .bail()
    .isLength({ max: 255 })
    .withMessage("Name must be at most 255 characters"),

  body("slug")
    .optional()
    .isString()
    .withMessage("Slug must be a string")
    .bail()
    .isLength({ max: 255 })
    .withMessage("Slug must be at most 255 characters"),
];
