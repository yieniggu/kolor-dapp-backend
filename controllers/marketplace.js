const { response } = require("express");

const {
  transfercUSD,
  getCeloBalance,
  transferCelo,
} = require("../helpers/token");
const { addNewInvestment } = require("../helpers/landToken");
const { getMintedNFTs } = require("../helpers/landNFT");
const { offsetEmissions } = require("../helpers/marketplace");
const User = require("../models/User");

const newOffsetEmissions = async (req, res = response) => {
  try {
    const { tokenId, emissions, user } = req.body;

    console.log("body: ", req.body);

    const { address } = await User.findById(user.uid);
    //console.log("foundUser: ", foundUser);

    const receipt = await offsetEmissions(tokenId, emissions, address);

    return res.status(401).json({
      ok: true,
      receipt,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      msg: "Internal sv error",
    });
  }
};

const newInvestment = async (req, res = response) => {
  const { amount } = req.body;
  //console.log("amount: ", amount);

  const { uid } = req;
  //console.log("uid: ", uid);

  try {
    const { address, privateKey } = await User.findById(uid);

    //console.log("body: ", req.body);
    //console.log(address, privateKey);

    const investmentReceipt = await addNewInvestment(
      address,
      req.params.tokenId,
      amount,
      1
    );

    return res.status(200).json({
      ok: true,
      receipts: [
        { transaction: "New investment", receipt: investmentReceipt },
        {
          transaction: "cUSD Transfer",
          receipt: cUSDTransferReceipt,
        },
      ],
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
    console.error(err);

    return res.status(500).json({
      ok: false,
      msg: "Internal server error",
    });
  }
};

module.exports = {
  newOffsetEmissions,
  getPublishedLands,
  newInvestment,
};
