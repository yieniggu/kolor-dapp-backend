const Web3 = require("web3");
const { v4: uuidv4 } = require("uuid");

const {
  maxDecimalsOf,
  normalizeNumber,
  convertSpeciesToArray,
  convertPointsToArray,
  oneYearInSeconds,
} = require("../utils/web3Utils");
const { createNFTContract, getGasPrice, getNonce } = require("./web3Common");
const fromExponential = require("from-exponential");
const { getLandTokenInfo, getLandTokenHolders } = require("./landToken");

const NFTContract = createNFTContract();
const web3 = new Web3("https://forno.celo.org");
const burnAddress = "0x0000000000000000000000000000000000000000";

/* ############################ 

            GETTERS


   ############################          */

/* Get all minted species info one by one */
const getMintedNFTs = async () => {
  const mintedNFTS = [];
  //console.log(NFTContract.methods);
  const totalSupply = await NFTContract.methods._totalLands().call();
  for (let i = 0; i < totalSupply; i++) {
    const owner = await NFTContract.methods.ownerOf(i).call();

    if (owner != burnAddress) {
      let NFTInfo = await getNFTInfo(i);
      console.log("NFT ", i, NFTInfo);
      mintedNFTS.push(NFTInfo);
    } else {
      console.log("Token ", i, " is burned");
    }
  }

  return mintedNFTS;
};

/* Get nft info of a single land */
const getNFTInfo = async (tokenId) => {
  const owner = await NFTContract.methods.ownerOf(tokenId).call();

  let NFTInfo = await NFTContract.methods.getNFTInfo(tokenId).call();
  NFTInfo = extractNFTProps(NFTInfo);
  const species = await getSpecies(tokenId);
  const { emittedVCUs, projectedVCUS } = getVCUsEmitted(species);
  const VCUsLeft = emittedVCUs - NFTInfo.soldTCO2;
  const points = await getPoints(tokenId);
  let landTokenInfo = await getLandTokenInfo(tokenId);
  const landTokenHolders = await getLandTokenHolders(tokenId);

  NFTInfo.owner = owner;
  NFTInfo.species = species;
  NFTInfo.points = points;
  NFTInfo.VCUInfo = { emittedVCUs, projectedVCUS, VCUsLeft };
  NFTInfo.tokenId = tokenId;
  NFTInfo.landTokenInfo = extractLandTokenProps(landTokenInfo);
  NFTInfo.landTokenInfo.totalHolders = landTokenHolders;

  console.log("NFTINFO: ", NFTInfo);
  return NFTInfo;
};

const getNFTtotalSupply = async () => {
  return await NFTContract.methods._totalLands().call();
};

/* Gett all species of a given land */
const getSpecies = async (tokenId) => {
  const totalSpecies = await NFTContract.methods.totalSpeciesOf(tokenId).call();
  const species = [];
  for (let i = 0; i < totalSpecies; i++) {
    let specie = await NFTContract.methods.species(tokenId, i).call();
    specie = extractSpecieProps(specie);
    specie.index = i;
    console.log("specie: ", specie);
    species.push(specie);
  }

  return species;
};

/* Get all points of a given land */
const getPoints = async (tokenId) => {
  const totalPoints = await NFTContract.methods.totalPointsOf(tokenId).call();
  const points = [];

  for (let i = 0; i < totalPoints; i++) {
    let point = await NFTContract.methods.points(tokenId, i).call();
    point = extractPointProps(point);
    points.push(point);
  }

  return points;
};

/* VCUs generated, projected and sold */
const getVCUsEmitted = (species) => {
  let emittedVCUs = 0;
  let projectedVCUS = 0;

  species.map((specie) => {
    const { decimals, creationDate, TCO2perSecond } = specie;
    const now = Date.now() / 1000;

    // console.log(
    //   "decimals: ",
    //   decimals,
    //   " | creation date: ",
    //   creationDate,
    //   " | TCO2perSecond: ",
    //   TCO2perSecond,
    //   " | now: ",
    //   now
    // );

    console.log("tcops: ", TCO2perSecond);
    let TCO2normalized = normalizeNumber(TCO2perSecond, decimals * -1, false);
    if (TCO2normalized.toString().includes("e")) {
      TCO2normalized = fromExponential(TCO2normalized.toString());
    }

    console.log(TCO2normalized);

    const elapsedTimeInSeconds = now - creationDate;

    console.log("elapsed time in secs: ", elapsedTimeInSeconds);

    emittedVCUs += TCO2normalized * elapsedTimeInSeconds;
    projectedVCUS += TCO2normalized * oneYearInSeconds;
    console.log("emited: ", emittedVCUs);
  });

  return { emittedVCUs, projectedVCUS };
};

const landExists = async (tokenId) => {
  return (await NFTContract.methods.owner(tokenId).call()) !== burnAddress;
};

/* ############################ 

            SETTERS


   ############################          */

/* Mints a new land nft with given attributes */
const safeMint = async (landAttributes) => {
  let {
    toAddress,
    name,
    landOwnerAlias,
    size,
    country,
    stateOrRegion,
    city,
    initialTCO2,
    unit,
  } = landAttributes;

  size = Number(size);
  landAttributes.size = Number(size);

  const decimals = maxDecimalsOf(landAttributes);

  const identifier = uuidv4();
  const { address } = web3.eth.accounts.privateKeyToAccount(
    process.env.DEV_PRIVATE_KEY
  );

  //console.log(NFTContract.methods);
  const encodedTransaction = await NFTContract.methods
    .safeMint(
      address,
      name,
      identifier,
      toAddress,
      landOwnerAlias,
      decimals,
      normalizeNumber(size, decimals),
      country,
      stateOrRegion,
      city,
      normalizeNumber(initialTCO2, decimals),
      unit
    )
    .encodeABI();

  const gas = 480000;
  const gasPrice = web3.utils.toHex(await getGasPrice());
  const nonce = web3.utils.toHex(await getNonce());

  let txParams = {
    from: web3.utils.toChecksumAddress(address),
    to: process.env.NFT_ADDRESS,
    gas,
    gasPrice,
    nonce,
    data: encodedTransaction,
  };

  // Signs transaction to execute with private key on backend side
  const signedTransaction = await web3.eth.accounts.signTransaction(
    txParams,
    process.env.DEV_PRIVATE_KEY
  );

  const receipt = await web3.eth.sendSignedTransaction(
    signedTransaction.raw || signedTransaction.rawTransaction
  );

  receipt.tokenId = parseInt(receipt.logs[0].topics[3]);
  //console.log("mint nft receipt: ", receipt);
  return receipt;
};

const updateLandState = async (tokenId, state) => {
  const { address } = web3.eth.accounts.privateKeyToAccount(
    process.env.DEV_PRIVATE_KEY
  );

  const encodedTransaction = await NFTContract.methods
    .updateLandState(tokenId, state)
    .encodeABI();

  const gas = 480000;
  const gasPrice = web3.utils.toHex(await getGasPrice());
  const nonce = web3.utils.toHex(await getNonce());

  let txParams = {
    from: web3.utils.toChecksumAddress(address),
    to: process.env.NFT_ADDRESS,
    gas,
    gasPrice,
    nonce,
    data: encodedTransaction,
  };
  // Signs transaction to execute with private key on backend side
  const signedTransaction = await web3.eth.accounts.signTransaction(
    txParams,
    process.env.DEV_PRIVATE_KEY
  );

  //console.log(signedTransaction);

  const receipt = await web3.eth.sendSignedTransaction(
    signedTransaction.raw || signedTransaction.rawTransaction
  );

  console.log("update land state receipt: ", receipt);
  return receipt;
};

const setSpecies = async (tokenId, species, landSize) => {
  if (!species) return null;

  const { address } = web3.eth.accounts.privateKeyToAccount(
    process.env.DEV_PRIVATE_KEY
  );

  const speciesAsArrays = convertSpeciesToArray(species, landSize);
  console.log("sparrs: ", speciesAsArrays);

  const encodedTransaction = await NFTContract.methods
    .setSpecies(tokenId, speciesAsArrays)
    .encodeABI();

  const gas = 250000 * species.length;
  const gasPrice = web3.utils.toHex(await getGasPrice());
  const nonce = web3.utils.toHex(await getNonce());

  let txParams = {
    from: web3.utils.toChecksumAddress(address),
    to: process.env.NFT_ADDRESS,
    gas,
    gasPrice,
    nonce,
    data: encodedTransaction,
  };
  // Signs transaction to execute with private key on backend side
  const signedTransaction = await web3.eth.accounts.signTransaction(
    txParams,
    process.env.DEV_PRIVATE_KEY
  );

  //console.log(signedTransaction);

  const receipt = await web3.eth.sendSignedTransaction(
    signedTransaction.raw || signedTransaction.rawTransaction
  );

  //console.log("set species receipt: ", receipt);

  return receipt;
};

const setPoints = async (tokenId, points) => {
  if (!points) return null;
  const pointsAsArrays = convertPointsToArray(points);

  const { address } = web3.eth.accounts.privateKeyToAccount(
    process.env.DEV_PRIVATE_KEY
  );

  const encodedTransaction = await NFTContract.methods
    .setPoints(tokenId, pointsAsArrays)
    .encodeABI();

  const gas = 250000 * points.length;
  const gasPrice = web3.utils.toHex(await getGasPrice());
  const nonce = web3.utils.toHex(await getNonce());

  let txParams = {
    from: web3.utils.toChecksumAddress(address),
    to: process.env.NFT_ADDRESS,
    gas,
    gasPrice,
    nonce,
    data: encodedTransaction,
  };
  // Signs transaction to execute with private key on backend side
  const signedTransaction = await web3.eth.accounts.signTransaction(
    txParams,
    process.env.DEV_PRIVATE_KEY
  );

  //console.log(signedTransaction);

  const receipt = await web3.eth.sendSignedTransaction(
    signedTransaction.raw || signedTransaction.rawTransaction
  );

  console.log("set points receipt: ", receipt);

  return receipt;
};

const publishLand = async (tokenId) => {
  const { address } = web3.eth.accounts.privateKeyToAccount(
    process.env.DEV_PRIVATE_KEY
  );

  const encodedTransaction = await NFTContract.methods
    .safeTransferToMarketplace(tokenId)
    .encodeABI();

  const gas = 480000;
  const gasPrice = web3.utils.toHex(await getGasPrice());
  const nonce = web3.utils.toHex(await getNonce());

  let txParams = {
    from: web3.utils.toChecksumAddress(address),
    to: process.env.NFT_ADDRESS,
    gas,
    gasPrice,
    nonce,
    data: encodedTransaction,
  };
  // Signs transaction to execute with private key on backend side
  const signedTransaction = await web3.eth.accounts.signTransaction(
    txParams,
    process.env.DEV_PRIVATE_KEY
  );

  //console.log(signedTransaction);

  const receipt = await web3.eth.sendSignedTransaction(
    signedTransaction.raw || signedTransaction.rawTransaction
  );

  //console.log("set species receipt: ", receipt);

  return receipt;
};

/* ############################ 

            UTILS


   ############################          */

/* Extract props to proper object type */
const extractSpecieProps = (specie) => {
  const {
    speciesAlias,
    scientificName,
    density,
    landId,
    size,
    TCO2perSecond,
    TCO2perYear,
    creationDate,
    updateDate,
    decimals,
  } = specie;

  return {
    speciesAlias,
    scientificName,
    density,
    landId,
    size,
    TCO2perSecond,
    TCO2perYear,
    creationDate,
    updateDate,
    decimals,
  };
};

const extractPointProps = (point) => {
  const { latitude, longitude, decimals } = point;

  return {
    latitude,
    longitude,
    decimals,
  };
};

/* Gets NFT props into proper object */
const extractNFTProps = (NFTInfo) => {
  const {
    identifier,
    landOwner,
    landOwnerAlias,
    name,
    size,
    country,
    city,
    stateOrRegion,
    creationDate,
    initialTCO2perYear,
    soldTCO2,
    decimals,
    state,
    unit,
  } = NFTInfo;
  return {
    identifier,
    landOwner,
    landOwnerAlias,
    name,
    size,
    country,
    city,
    stateOrRegion,
    creationDate,
    initialTCO2perYear,
    soldTCO2,
    decimals,
    state,
    unit,
  };
};

const extractLandTokenProps = (landTokenInfo) => {
  const {
    available,
    initialAmount,
    currentAmount,
    sold,
    creationDate,
    tokenPrice,
    unit,
  } = landTokenInfo;

  return {
    available,
    initialAmount,
    currentAmount,
    sold,
    creationDate,
    tokenPrice,
    unit,
  };
};

module.exports = {
  safeMint,
  getMintedNFTs,
  getNFTtotalSupply,
  updateLandState,
  setSpecies,
  setPoints,
  getVCUsEmitted,
  getNFTInfo,
  extractLandTokenProps,
  publishLand,
};
