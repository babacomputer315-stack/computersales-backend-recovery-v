import { body } from "express-validator";

export const createCategoryValidation = [
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

  body("parentId")
    .optional({ nullable: true })
    .isInt()
    .withMessage("Parent ID must be an integer"),
];

export const updateCategoryValidation = [
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

  body("parentId")
    .optional({ nullable: true })
    .isInt()
    .withMessage("Parent ID must be an integer"),
];
