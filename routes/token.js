const { Router } = require("express");
const { getTokenBalances, getInvestments } = require("../controllers/token");
const { jwtValidator, userValidator } = require("../middlewares/jwtValidator");

const router = new Router();

router.get("/:userId", [jwtValidator], getTokenBalances);

router.get("/investments/:userId", [jwtValidator], getInvestments);

module.exports = router;
