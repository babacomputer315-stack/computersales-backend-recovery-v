import { Router } from "express";
import * as AddressController from "../../controllers/user/address.controller";
import { authenticateToken } from "../../middlewares/auth";
// import validateRequest from "../../middlewares/validateRequest";
// import {
//   createAddressSchema,
//   updateAddressSchema,
//   getAddressByIdSchema,
// } from "../../validations/address.validation";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route GET /api/user/addresses
 * @desc Get all addresses for the authenticated user
 * @access Private
 */
router.get("/", AddressController.getUserAddresses);

/**
 * @route GET /api/user/addresses/count
 * @desc Get address count for the authenticated user
 * @access Private
 */
router.get("/count", AddressController.getAddressCount);

/**
 * @route GET /api/user/addresses/:id
 * @desc Get address by ID for the authenticated user
 * @access Private
 */
router.get("/:id", AddressController.getAddressById);

/**
 * @route POST /api/user/addresses
 * @desc Create a new address for the authenticated user
 * @access Private
 */
router.post("/", AddressController.createAddress);

/**
 * @route PUT /api/user/addresses/:id
 * @desc Update an address for the authenticated user
 * @access Private
 */
router.put("/:id", AddressController.updateAddress);

/**
 * @route DELETE /api/user/addresses/:id
 * @desc Delete an address for the authenticated user
 * @access Private
 */
router.delete("/:id", AddressController.deleteAddress);

export default router;
