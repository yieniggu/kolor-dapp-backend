const Web3 = require("web3");
const { roundValue } = require("../utils/web3Utils");
const { getNFTtotalSupply } = require("./landNFT");
const { getLandTokenBalancesOf } = require("./landToken");
const { createERC20Contract } = require("./web3Common");

const ContractKit = require("@celo/contractkit");

const {
  createLandTokenContract,
  getGasPrice,
  getNonce,
} = require("./web3Common");

const web3 = new Web3("https://alfajores-forno.celo-testnet.org");
// const web3 = new Web3("https://forno.celo.org");
const kit = ContractKit.newKitFromWeb3(web3);

const burnAddress = "0x0000000000000000000000000000000000000000";
const cUSDAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

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

  return roundValue(web3.utils.fromWei(balance, "ether"), 2);
};

const getCeloBalance = async (address) => {
  const balance = await web3.eth.getBalance(address);

  return roundValue(web3.utils.fromWei(balance, "ether"), 2);
};

// const transferCelo = async (address) => {
//   const receipt =
// }

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
  console.log(address, privateKey, amount);

  kit.connection.addAccount(privateKey);

  const tx = await cUSDToken
    .transfer(process.env.DEV_ADDRESS, web3.utils.toWei(amount, "ether"))
    .send({ from: address });

  const receipt = await tx.waitReceipt();

  console.log("receipt from transfer cusd: ", receipt);

  return receipt;
};

// const transfercUSD = async ({ address, privateKey }, amount) => {
//   const dev_address = process.env.DEV_ADDRESS;

//   console.log(address, privateKey, amount);

//   console.log(cUSD.methods);
//   const encodedTransaction = await cUSD.methods
//     .transfer(dev_address, amount)
//     .encodeABI();

//   console.log("tx_encoded");

//   const gas = 480000;
//   const gasPrice = web3.utils.toHex(await getGasPrice());
//   const nonce = web3.utils.toHex((await getNonce()) + 1);

//   console.log("gasprice and nonce");

//   let txParams = {
//     from: web3.utils.toChecksumAddress(address),
//     to: cUSDAddress,
//     gas,
//     gasPrice,
//     nonce,
//     data: encodedTransaction,
//   };

//   console.log("txparams done");

//   // Signs transaction to execute with private key on backend side
//   const signedTransaction = await web3.eth.accounts.signTransaction(
//     txParams,
//     privateKey
//   );

//   console.log(signedTransaction);
//   console.log("tx signed. awaiting receipt...");

//   const receipt = await web3.eth.sendSignedTransaction(
//     signedTransaction.raw || signedTransaction.rawTransaction
//   );

//   console.log("transfer cusd receipt: ", receipt);
//   return receipt;
// };

module.exports = {
  getNativeBalances,
  getLandTokenBalances,
  getCeloBalance,
  transfercUSD,
  transferCelo,
};
