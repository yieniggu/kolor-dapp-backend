const Web3 = require("web3");
const {
  createLandTokenContract,
  getGasPrice,
  getNonce,
} = require("./web3Common");
const { newKit, CeloContract } = require("@celo/contractkit");

const web3 = new Web3("https://forno.celo.org");

const setLandTokenInfo = async (tokenId, initialAmount, tokenPrice, unit) => {
  const kit = newKit("https://forno.celo.org");

  kit.defaultAccount = process.env.DEV_ADDRESS;
  kit.connection.addAccount(process.env.DEV_PRIVATE_KEY);
  const landTokenContract = createLandTokenContract(kit);
  const { address } = web3.eth.accounts.privateKeyToAccount(
    process.env.DEV_PRIVATE_KEY
  );

  console.log("token id: ", tokenId, typeof tokenId);
  console.log("initial amount: ", initialAmount, typeof initialAmount);
  //console.log(landTokenContract.methods);
  const encodedTransaction = await landTokenContract.methods
    .setLandTokenInfo(tokenId, initialAmount, tokenPrice, unit)
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

const getLandTokenInfo = async (tokenId) => {
  const kit = newKit("https://forno.celo.org");

  const landTokenContract = createLandTokenContract(kit);
  return await landTokenContract.methods.landTokensInfo(tokenId).call();
};

const getLandTokenHolders = async (tokenId) => {
  const kit = newKit("https://forno.celo.org");

  const landTokenContract = createLandTokenContract(kit);
  return await landTokenContract.methods.holders(tokenId).call();
};

const getLandTokenInvestors = async (tokenId) => {
  const kit = newKit("https://forno.celo.org");

  const landTokenContract = createLandTokenContract(kit);
  return await landTokenContract.methods.holders(tokenId).call();
};

const getLandTokenBalanceOf = async (address, id, block) => {
  try {
    const kit = newKit("https://forno.celo.org");

    const landTokenContract = createLandTokenContract(kit);
    const balance = await landTokenContract.methods
      .balanceOf(address, id)
      .call((defaultBlock = block || "latest"));

    console.log("balance: ", balance);
    return balance;
  } catch (error) {
    if (error.message.includes("missing trie node")) {
      const kit = newKit(
        "https://magical-special-model.celo-mainnet.discover.quiknode.pro/a30474bc578f489e3d631cf898c76b7b754f2acf/"
      );

      const landTokenContract = createLandTokenContract(kit);
      const balance = await landTokenContract.methods
        .balanceOf(address, id)
        .call((defaultBlock = block || "latest"));

      console.log("balance: ", balance);
      return balance;
    }
  }
};

const getLandTokenBalancesOf = async (address, ids) => {
  const kit = newKit("https://forno.celo.org");

  const landTokenContract = createLandTokenContract(kit);
  if (ids.length > 0) {
    return await landTokenContract.methods.balancesOf(address, ids).call();
  }

  return [];
};

const getInvestmentsOf = async (address) => {
  const kit = newKit("https://forno.celo.org");

  const landTokenContract = createLandTokenContract(kit);
  console.log(`get investments of: ${address}`);

  const investments = await landTokenContract.methods
    .investmentsOfAddress(address)
    .call();

  console.log("inv: ", investments);
  return investments;
};

const getTokenPrice = async (tokenId) => {
  const kit = newKit("https://forno.celo.org");

  const landTokenContract = createLandTokenContract(kit);
  console.log(`get TOKENPRICE of: ${tokenId}`);

  const tokenPrice = await landTokenContract.methods.priceOf(tokenId).call();
  console.log("tokenprice: ", tokenPrice);
  return tokenPrice;
};

module.exports = {
  setLandTokenInfo,
  getLandTokenInfo,
  getLandTokenBalanceOf,
  getLandTokenBalancesOf,
  getLandTokenHolders,
  getInvestmentsOf,
  getTokenPrice,
  getLandTokenInvestors,
};
