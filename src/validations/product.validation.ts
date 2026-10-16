import { body } from "express-validator";

const productValidation = [
  body("name")
    .notEmpty()
    .withMessage("لطفا نام محصول را وارد نمایید")
    .bail()
    .isString()
    .withMessage("لطفا نام محصول را به درستی وارد نمایید"),
];

export default productValidation;
