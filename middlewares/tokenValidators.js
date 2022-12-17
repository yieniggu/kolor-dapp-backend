const { response } = require("express");
const { getPublishedNFTs } = require("../helpers/landNFT");
const { getLandTokenBalanceOf } = require("../helpers/landToken");
const User = require("../models/User");

const validateLandTokenBalanceInternal = async (req, res = response, next) => {
  try {
    const user = await User.findById(req.uid);
    const { daoId } = req.params;

    // fetch published lands to extract token Id
    // TODO: Explore ways to speed this up (cache, redundancy in db, etc)
    const publishedLands = await getPublishedNFTs();
    const { tokenId } = publishedLands.find(
      ({ identifier }) => identifier === daoId
    );

    // Possible errorrs handled
    if (!user) {
      return res.status(400).json({
        ok: false,
        errors: ["User not found"],
      });
    }

    if (!tokenId) {
      return res.status(400).json({
        ok: false,
        error: ["Land doesn't exists"],
      });
    }

    // get address of user to fetch balance
    const { address } = user;
    const landTokenBalance = await getLandTokenBalanceOf(address, tokenId);

    req.tokenId = tokenId;

    // voting power not enough
    if (landTokenBalance <= 0)
      return res.status(404).json({
        ok: false,
        error: ["Not enough balance to do that!"],
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      ok: false,
      errors: ["Internal Server Error"],
    });
  }

  next();
};

const validateLandTokenBalanceExternal = async (req, res = response, next) => {
  try {
    const { account, address } = req.body;
    const { daoId } = req.params;

    // fetch published lands to extract token Id
    // TODO: Explore ways to speed this up (cache, redundancy in db, etc)
    const publishedLands = await getPublishedNFTs();
    const { tokenId } = publishedLands.find(
      ({ identifier }) => identifier === daoId
    );

    if (!tokenId) {
      return res.status(400).json({
        ok: false,
        error: ["Land doesn't exists"],
      });
    }

    const landTokenBalance = await getLandTokenBalanceOf(
      account || address,
      tokenId
    );

    req.tokenId = tokenId;

    // voting power not enough
    if (landTokenBalance <= 0)
      return res.status(404).json({
        ok: false,
        error: ["Not enough balance to do that!"],
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      ok: false,
      errors: ["Internal Server Error"],
    });
  }

  next();
};

module.exports = {
  validateLandTokenBalanceInternal,
  validateLandTokenBalanceExternal,
};
