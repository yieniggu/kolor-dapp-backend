const { Router } = require("express");
const {
  createOffsetRequest,
  getOffsetRequests,
  getOffsetRequest,
  updateOffsetRequest,
} = require("../controllers/offsetRequest");
const { isAdmin } = require("../helpers/isAdmin");
const { jwtValidator } = require("../middlewares/jwtValidator");

const router = Router();

router.get("/", [jwtValidator, isAdmin], getOffsetRequests);

router.get("/:id", getOffsetRequest);

router.post("/", createOffsetRequest);

router.put("/:id", [jwtValidator, isAdmin], updateOffsetRequest);

module.exports = router;
