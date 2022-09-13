const { response } = require("express");
const { type } = require("express/lib/response");
const { getInvestmentsOf } = require("../helpers/landToken");
const { getNativeBalances, getLandTokenBalances } = require("../helpers/token");
const User = require("../models/User");

/* Returns Celo and cUSD balances of account */
const getTokenBalances = async (req, res = response) => {
  console.log(req.uid);
  try {
    const user = await User.findById(req.uid);

    if (!user) {
      return res.status(404).json({
        ok: false,
        errors: ["Nothing found here..."],
      });
    }

    const nativeBalances = await getNativeBalances(user.address);
    const landTokenBalances = await getLandTokenBalances(user.address);

    return res.status(200).json({
      ok: true,
      balances: { nativeBalances, landTokenBalances, address: user.address },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      errors: ["Internal server error"],
    });
  }
};

/* get investments of a given address */
const getInvestments = async (req, res = response) => {
  try {
    const { address } = await User.findById(req.uid);

    const investments = await getInvestmentsOf(address);

    res.status(200).json({
      ok: true,
      address,
      investments,
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      ok: false,
      errors: ["Internal server error"],
    });
  }
};

module.exports = {
  getTokenBalances,
  getInvestments,
};
