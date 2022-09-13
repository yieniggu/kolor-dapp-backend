const { Router } = require("express");
const {
  newOffsetEmissions,
  getPublishedLands,
  newInvestment,
} = require("../controllers/marketplace");
const { isAdmin } = require("../helpers/isAdmin");
const { jwtValidator, userValidator } = require("../middlewares/jwtValidator");

const router = new Router();

router.get("/", getPublishedLands);

router.post("/", [jwtValidator, isAdmin], newOffsetEmissions);

router.post("/tokens/:tokenId", [jwtValidator], newInvestment);

module.exports = router;
