const { type } = require("express/lib/response");
const Web3 = require("web3");

const {
  createLandTokenContract,
  getGasPrice,
  getNonce,
} = require("./web3Common");

const landTokenContract = createLandTokenContract();
//const web3 = new Web3("https://alfajores-forno.celo-testnet.org");
const web3 = new Web3("https://forno.celo.org");

const burnAddress = "0x0000000000000000000000000000000000000000";

const setLandTokenInfo = async (tokenId, initialAmount) => {
  const { address } = web3.eth.accounts.privateKeyToAccount(
    process.env.DEV_PRIVATE_KEY
  );

  console.log("token id: ", tokenId, typeof tokenId);
  console.log("initial amount: ", initialAmount, typeof initialAmount);
  //console.log(landTokenContract.methods);
  const encodedTransaction = await landTokenContract.methods
    .setLandTokenInfo(tokenId, initialAmount)
    .encodeABI();

  const gas = 480000;
  const gasPrice = web3.utils.toHex(await getGasPrice());
  const nonce = web3.utils.toHex(await getNonce());

  let txParams = {
    from: web3.utils.toChecksumAddress(address),
    to: process.env.LAND_TOKEN_ADDRESS,
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

  //console.log("set land token info receipt: ", receipt);
  return receipt;
};

const addNewInvestment = async (investor, tokenId, amount, tokenPrice) => {
  const { address } = web3.eth.accounts.privateKeyToAccount(
    process.env.DEV_PRIVATE_KEY
  );

  console.log("info of investment: ", investor, tokenId, amount, tokenPrice);

  //console.log(landTokenContract.methods);
  const encodedTransaction = await landTokenContract.methods
    .newInvestment(investor, tokenId, amount, tokenPrice)
    .encodeABI();

  const gas = 480000;
  const gasPrice = web3.utils.toHex(await getGasPrice());
  const nonce = web3.utils.toHex(await getNonce());

  let txParams = {
    from: web3.utils.toChecksumAddress(address),
    to: process.env.LAND_TOKEN_ADDRESS,
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

  console.log("set land token info receipt: ", receipt);
  return receipt;
};

const getLandTokenInfo = async (tokenId) => {
  return await landTokenContract.methods.landTokensInfo(tokenId).call();
};

const getLandTokenHolders = async (tokenId) => {
  return await landTokenContract.methods.holders(tokenId).call();
};

const getLandTokenBalancesOf = async (address, ids) => {
  if (ids.length > 0) {
    return await landTokenContract.methods.balancesOf(address, ids).call();
  }

  return [];
};

const getInvestmentsOf = async (address) => {
  console.log(`get investments of: ${address}`);

  const investments = await landTokenContract.methods
    .investmentsOfAddress(address)
    .call();

  console.log("inv: ", investments);
  return investments;
};

module.exports = {
  setLandTokenInfo,
  addNewInvestment,
  getLandTokenInfo,
  getLandTokenBalancesOf,
  getLandTokenHolders,
  getInvestmentsOf,
};
