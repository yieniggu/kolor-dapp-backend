const { Router } = require("express");
const {
  createProposalInternal,
  createProposalExternal,
  getProposals,
  addVoteInternal,
  addVoteExternal,
} = require("../controllers/proposals");
const { jwtValidator, userValidator } = require("../middlewares/jwtValidator");
const {
  validateLandTokenBalanceInternal,
  validateLandTokenBalanceExternal,
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

router.post(
  "/:daoId/proposals/external",
  [validateLandTokenBalanceExternal],
  createProposalExternal
);

router.post(
  "/:daoId/proposals/:proposal/vote/external",
  [validateLandTokenBalanceExternal],
  addVoteExternal
);

module.exports = router;
