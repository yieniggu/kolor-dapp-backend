const { response } = require("express");

const {
  transfercUSD,
  getCeloBalance,
  transferCelo,
  getcUSDBalance,
  getAllowance,
  approve,
} = require("../helpers/token");
const { getMintedNFTs, publishLand } = require("../helpers/landNFT");
const { offsetEmissions, buyLandTokens } = require("../helpers/marketplace");
const User = require("../models/User");
const { getTokenPrice } = require("../helpers/landToken");

const newInvestment = async (req, res = response) => {
  const { amount } = req.body;
  //console.log("amount: ", amount);

  const { uid } = req;
  //console.log("uid: ", uid);

  try {
    const user = await User.findById(uid);
    console.log(user);
    const { address, privateKey } = await User.findById(uid);

    //console.log("body: ", req.body);
    //console.log(address, privateKey);

    // get tokenPrice
    const tokenPrice = await getTokenPrice(req.params.tokenId);

    // get allowance
    const allowance = await getAllowance(address);

    if (allowance < amount * tokenPrice) {
      // set spender receipt
      console.log("allowance is lower");
      const allowanceReceipt = await approve(address, privateKey);
    }

    // add investment
    const investmentReceipt = await buyLandTokens(req.params.tokenId, amount, {
      address,
      privateKey,
    });

    return res.status(200).json({
      ok: true,
      receipts: [{ transaction: "New investment", receipt: investmentReceipt }],
    });
  } catch (error) {
    console.error("Error on new investment controller: ", error);
    if (
      error.message.includes("transfer value exceeded balance of sender") ||
      error.message.includes("insufficient funds for gas")
    ) {
      return res.status(402).json({
        ok: false,
        errors: ["Not enough cUSD funds"],
      });
    }

    return res.status(500).json({
      ok: false,
      errors: ["Internal server error"],
    });
  }
};

const newInvestment = async (req, res = response) => {
  const { amount } = req.body;
  console.log("amount: ", amount);

  const { uid } = req;
  console.log("uid: ", uid);

  try {
    const { address, privateKey } = await User.findById(uid);

    console.log("body: ", req.body);
    //console.log(address, privateKey);

    const celoBalance = await getCeloBalance(address);

    if (celoBalance < 0.0001) {
      await transferCelo(address, 0.0001);
    }

    const cUSDTransferReceipt = await transfercUSD(
      { address, privateKey },
      amount.toString()
    );
    const investmentReceipt = await addNewInvestment(
      address,
      req.params.tokenId,
      amount,
      1
    );

    return res.status(200).json({
      ok: true,
      receipts: [{ transaction: "Land published", receipt }],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      msg: "Internal server error",
    });
  }
};

const getPublishedLands = async (req, res = response) => {
  try {
    const mintedNFTs = await getMintedNFTs();
    const publishedLands = mintedNFTs.filter(
      (mintedNFT) => mintedNFT.state === "3"
    );

    return res.status(200).json({
      ok: true,
      publishedLands,
    });
  } catch (err) {
    //console.error(err);

    return res.status(500).json({
      ok: false,
      msg: "Internal server error",
    });
  }
};

module.exports = {
  getPublishedLands,
  newInvestment,
  publishLandToMarketplace,
};
