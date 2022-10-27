const { response } = require("express");
const {
  getMintedNFTs,
  updateLandState,
  setSpecies,
  setPoints,
  getVCUs,
  getNFTInfo,
} = require("../helpers/landNFT");
const { safeMint } = require("../helpers/landNFT");
const { setLandTokenInfo } = require("../helpers/landToken");
const User = require("../models/User");
const { getInitialTCO2perYear } = require("../utils/web3Utils");

/* ############################ 

            GETTERS


   ############################          */

/* Returns all minted and not burned NFTS */
const getNFTsMinted = async (req, res = response) => {
  //console.log(req.body);
  console.log(req.params);

  try {
    const mintedNFTs = await getMintedNFTs();
    const notBurnedNFTs = mintedNFTs.filter(
      (mintedNFT) => mintedNFT.state !== "2"
    );

    return res.status(200).json({
      ok: true,
      notBurnedNFTs,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      ok: false,
      errors: ["Internal server error"],
    });
  }
};

const getNFT = async (req, res = response) => {
  const { id: tokenId } = req.params;

  try {
    const NFTInfo = await getNFTInfo(tokenId);

    if (NFTInfo) {
      return res.status(200).json({
        ok: true,
        NFTInfo,
      });
    } else {
      return res.status(404).json({
        ok: false,
        errors: [`NFT with token id: ${tokenId} not found... `],
      });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      ok: false,
      errors: ["Internal server error"],
    });
  }
};

const getLandVCUs = async (req, res = response) => {
  //const { state } = req.body;
  const { id: tokenId } = req.params;

  try {
    receipt = await getVCUs(tokenId);

    return res.status(200).json({
      ok: true,
      receipt,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      errors: ["Internal server error"],
    });
  }
};

/* ############################ 

            SETTERS


   ############################          */

const mintNFT = async (req, res = response) => {
  const { landAttributes, species, points } = req.body;

  console.log(req.body);

  try {
    const initialTCO2 = getInitialTCO2perYear(species);
    console.log("initial tco2: ", initialTCO2);
    landAttributes.initialTCO2 = initialTCO2;

    const mintingReceipt = await safeMint(landAttributes);
    const landTokenMintingReceipt = await setLandTokenInfo(
      mintingReceipt.tokenId,
      landAttributes.size,
      landAttributes.tokenPrice,
      landAttributes.unit
    );

    const receipts = [
      { transaction: "Minting", receipt: mintingReceipt },
      { transaction: "Land Tokens", receipt: landTokenMintingReceipt },
    ];

    if (species.length > 0) {
      const setSpeciesReceipt = await setSpecies(
        mintingReceipt.tokenId,
        species,
        landAttributes.size
      );
      receipts.push({ transaction: "Set Species", receipt: setSpeciesReceipt });
    }

    if (points.length > 0) {
      const setPointsReceipt = await setPoints(mintingReceipt.tokenId, points);
      receipts.push({ transaction: "Set Points", receipt: setPointsReceipt });
    }

    return res.status(201).json({
      ok: true,
      receipts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      errors: ["Internal server error"],
    });
  }
};

const updateState = async (req, res = response) => {
  const { state } = req.body;
  const { id: tokenId } = req.params;

  try {
    receipt = await updateLandState(tokenId, state);

    return res.status(200).json({
      ok: true,
      receipt,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      errors: ["Internal server error"],
    });
  }
};

module.exports = {
  mintNFT,
  getNFTsMinted,
  updateState,
  getLandVCUs,
  getNFT,
};
