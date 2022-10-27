const Web3 = require("web3");
const {
  getGasPrice,
  getNonce,
  createMarketplaceContract,
} = require("./web3Common");
const { newKitFromWeb3 } = require("@celo/contractkit");

const marketplaceContract = createMarketplaceContract();
const web3 = new Web3("https://forno.celo.org");
const kit = newKitFromWeb3(web3);

const burnAddress = "0x0000000000000000000000000000000000000000";

const offsetEmissions = async (tokenId, emissions, buyer) => {
  const { address } = web3.eth.accounts.privateKeyToAccount(
    process.env.DEV_PRIVATE_KEY
  );

  const encodedTransaction = await marketplaceContract.methods
    .offsetEmissions(tokenId, emissions, buyer)
    .encodeABI();

  const gas = 480000;
  const gasPrice = web3.utils.toHex(await getGasPrice());
  const nonce = web3.utils.toHex(await getNonce());

  let txParams = {
    from: web3.utils.toChecksumAddress(address),
    to: process.env.MARKETPLACE_ADDRESS,
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

  return receipt;
};

module.exports = {
  offsetEmissions,
};
