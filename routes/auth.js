/* 
    User / Auth routes
    host + /api/auth
*/

const { Router } = require("express");
const { check } = require("express-validator");
const { createUser, login, refreshJWT } = require("../controllers/auth");
const { isAdmin } = require("../helpers/isAdmin");
const { validateFields } = require("../middlewares/fieldValidators");
const { jwtValidator } = require("../middlewares/jwtValidator");

const router = Router();

// Routes
// create new user
router.post(
  "/new",
  [
    check("name", "Valid name required").not().isEmpty(),
    check("email", "Valid email required").isEmail(),
    check("password", "Min password length must be 6").isLength({ min: 6 }),
    validateFields,
  ],
  createUser
);

// login|
router.post(
  "/",
  [
    check("email", "Valid email required").isEmail(),
    check("password", "Min password length must be 6").isLength({ min: 6 }),
    validateFields,
  ],
  login
);

// renew token
router.get("/refresh", [jwtValidator], refreshJWT);

module.exports = router;
