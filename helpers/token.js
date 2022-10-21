const Web3 = require("web3");
const { roundValue } = require("../utils/web3Utils");
const { getNFTtotalSupply } = require("./landNFT");
const { getLandTokenBalancesOf } = require("./landToken");
const { createERC20Contract } = require("./web3Common");

const { newKit } = require("@celo/contractkit");

const {
  createLandTokenContract,
  getGasPrice,
  getNonce,
} = require("./web3Common");

const web3 = new Web3("https://alfajores-forno.celo-testnet.org");
// const web3 = new Web3("https://forno.celo.org");
const kit = newKit("https://alfajores-forno.celo-testnet.org");

const burnAddress = "0x0000000000000000000000000000000000000000";
const cUSDAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; //testnet
// const cUSDAddress = "0x765DE816845861e75A25fCA122bb6898B8B1282a"; //mainnet

const cUSD = createERC20Contract(cUSDAddress);

const getNativeBalances = async (address) => {
  //address = web3.utils.toChecksumAddress(address);

  const cUSDBalance = await getcUSDBalance(address);
  const celoBalance = await getCeloBalance(address);

  return { cUSDBalance, celoBalance };
};

const getLandTokenBalances = async (address) => {
  const NFTtotalSupply = await getNFTtotalSupply();

  console.log(NFTtotalSupply);

  let tokenIds = [];
  for (let i = 0; i < NFTtotalSupply; i++) {
    tokenIds.push([i]);
  }

  console.log("tokenIds", tokenIds);

  const landTokenBalances = await getLandTokenBalancesOf(address, tokenIds);
  console.log("landtoken balances: ", landTokenBalances);

  return landTokenBalances;
};

const getcUSDBalance = async (address) => {
  const balance = await cUSD.methods.balanceOf(address).call();

  const balanceInEth = web3.utils.fromWei(balance, "ether");

  console.log(balanceInEth);

  if (balanceInEth % 1 == 0) {
    return roundValue(balanceInEth, 2);
  }
  return roundValue(balanceInEth, 5);
};

const getCeloBalance = async (address) => {
  const balance = await web3.eth.getBalance(address);

  return roundValue(web3.utils.fromWei(balance, "ether"), 3);
};

const transferCelo = async (address, amount) => {
  const celoToken = await kit.contracts.getGoldToken();

  kit.connection.addAcount(process.env.DEV_PRIVATE_KEY);

  const tx = await celoToken
    .transfer(address, amount)
    .send({ from: process.env.DEV_ADDRESS });

  const receipt = await tx.waitReceipt();

  console.log("receipt from transfer celo: ", receipt);

  return receipt;
};

const transfercUSD = async ({ address, privateKey }, amount) => {
  const cUSDToken = await kit.contracts.getStableToken();
  kit.connection.addAccount(privateKey);

  const tx = await cUSDToken
    .transfer(process.env.DEV_ADDRESS, web3.utils.toWei(amount, "ether"))
    .send({ from: address, feeCurrency: cUSDAddress });

  const receipt = await tx.waitReceipt();

  console.log("receipt from transfer cusd: ", receipt);

  return receipt;
};

const getAllowance = async (address) => {
  const allowance = await cUSD.methods
    .allowance(address, process.env.MARKETPLACE_ADDRESS)
    .call();

  console.log("allowance: ", allowance);
  return allowance;
};

const approve = async (address, privateKey) => {
  const kit = newKit("https://alfajores-forno.celo-testnet.org");
  const cUSDToken = await kit.contracts.getStableToken();

  kit.defaultAccount = address;
  kit.connection.addAccount(privateKey);

  const totalSupply = await cUSD.methods.totalSupply().call();

  const tx = await cUSDToken
    .approve(process.env.MARKETPLACE_ADDRESS, totalSupply)
    .send({ from: address, feeCurrency: cUSDAddress });

  const receipt = await tx.waitReceipt();
  console.log("approve receipt: ", receipt);

  return receipt;
};

module.exports = {
  getNativeBalances,
  getLandTokenBalances,
  getCeloBalance,
  getcUSDBalance,
  getAllowance,
  transfercUSD,
  transferCelo,
  approve,
};
