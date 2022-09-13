const { Router } = require("express");
const { jwtValidator } = require("../middlewares/jwtValidator");

const {
  mintNFT,
  getNFTsMinted,
  updateState,
  getLandVCUs,
  getNFT,
} = require("../controllers/lands");
const { isAdmin } = require("../helpers/isAdmin");
const { getInvestments } = require("../controllers/token");

const router = new Router();

// Get all minted nfts that are not yet published
router.get("/", getNFTsMinted);

// Get single land info
router.get("/:id", getNFT);

// Creates a new land and mint a new NFT
router.post("/", [jwtValidator, isAdmin], mintNFT);

// Updates the state of an existing land
router.put("/:id/state", [jwtValidator, isAdmin], updateState);

// Get VCUs
router.get("/:id/vcus", getLandVCUs);

module.exports = router;
