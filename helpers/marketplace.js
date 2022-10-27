const Web3 = require("web3");
const {
  getGasPrice,
  getNonce,
  createMarketplaceContract,
} = require("./web3Common");
const { newKit, CeloContract } = require("@celo/contractkit");

// const web3 = new Web3("https://alfajores-forno.celo-testnet.org");
const web3 = new Web3("https://forno.celo.org");

const burnAddress = "0x0000000000000000000000000000000000000000";

const buyLandTokens = async (tokenId, amount, user) => {
  const kit = newKit("https://forno.celo.org");
  const marketplaceContract = createMarketplaceContract(kit);

  // console.log(marketplaceContract.methods);

  const { address, privateKey } = user;

  kit.defaultAccount = address;
  kit.connection.addAccount(privateKey);

  console.log("info of investment: ", tokenId, amount);
  await kit.setFeeCurrency(CeloContract.StableToken);
  console.log("nice");

  const tx = await kit.connection.sendTransactionObject(
    marketplaceContract.methods.buyLandTokens(tokenId, amount)
  );

  console.log("jepue");

  const receipt = await tx.waitReceipt();

  console.log(receipt);
  return receipt;
};

module.exports = {
  buyLandTokens,
};
