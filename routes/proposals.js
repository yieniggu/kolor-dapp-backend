const { Router } = require("express");
const {
  createProposalInternal,
  getProposals,
  addVoteInternal,
} = require("../controllers/proposals");
const { jwtValidator, userValidator } = require("../middlewares/jwtValidator");
const {
  validateLandTokenBalanceInternal,
} = require("../middlewares/tokenValidators");

const router = new Router();

router.get("/:daoId/proposals/", getProposals);

router.post(
  "/:daoId/proposals/internal",
  [jwtValidator, validateLandTokenBalanceInternal],
  createProposalInternal
);

router.post(
  "/:daoId/proposals/:proposal/vote/internal",
  [jwtValidator],
  addVoteInternal
);

module.exports = router;
