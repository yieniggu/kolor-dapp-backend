const { Router } = require("express");
const {
  getPublishedLands,
  newInvestment,
  publishLandToMarketplace,
} = require("../controllers/marketplace");
const { isAdmin } = require("../helpers/isAdmin");
const { jwtValidator, userValidator } = require("../middlewares/jwtValidator");

const router = new Router();

router.get("/", getPublishedLands);

router.post("/tokens/:tokenId", [jwtValidator], newInvestment);

router.post(
  "/lands/:tokenId",
  [jwtValidator, isAdmin],
  publishLandToMarketplace
);

module.exports = router;
