const { response } = require("express");
const { getLandTokenBalanceOf } = require("../helpers/landToken");
const {
  getLatestBlock,
  signMessage,
  validSignature,
} = require("../helpers/web3Common");
const { getPublishedNFTs } = require("../helpers/landNFT");
const Proposal = require("../models/Proposal");
const User = require("../models/User");
const Vote = require("../models/Vote");

const getProposals = async (req, res = response) => {
  const { daoId } = req;

  try {
    const proposals = await Proposal.find({ identifier: daoId })
      .populate({ path: "votes" })
      .exec();
    // console.log(proposals);

    const sortedProposals = proposals.sort(
      (a, b) => new Date(b.startDate) - new Date(a.startDate)
    );

    // console.log("sorted: ", sortedProposals);

    return res.status(200).json({
      ok: true,
      proposals: sortedProposals,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      ok: false,
      msg: "Internal server error",
    });
  }
};

const createProposalInternal = async (req, res = response) => {
  const { title, summary, discussion, options, duration } = req.body;

  try {
    const { address, name } = await User.findById(req.uid);

    const startDate = new Date();
    let endDate = new Date();

    endDate.setDate(endDate.getDate() + duration);

    const block = await getLatestBlock();

    const proposal = new Proposal({
      title,
      summary,
      discussion,
      authorAddress: address,
      authorName: `${name}`,
      options,
      startDate,
      endDate,
      block,
      daoId: req.params.daoId,
      tokenId: req.tokenId,
    });

    // console.log(proposal);

    const result = await proposal.save();

    return res.status(201).json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, msg: "Internal server error" });
  }
};

const addVoteInternal = async (req, res = response) => {
  const { daoId, proposal } = req.params;
  const { option } = req.body;

  try {
    const foundProposal = await Proposal.findById(proposal)
      .populate("votes")
      .exec();

    if (!foundProposal) {
      return res.status(404).json({
        ok: false,
        errors: ["This proposal doesn't exists!"],
      });
    }

    const { tokenId, block, options } = foundProposal;
    // console.log(`tokenid ${tokenId}, block ${block}`);

    if (option < 0 || option >= options.length) {
      return res.status(401).json({
        ok: false,
        errors: ["Invalid option to vote!"],
      });
    }

    // get user data to sign message
    const { address, privateKey } = await User.findById(req.uid);

    // console.log(`address: ${address}, pk: ${privateKey}`);

    const votes = await getLandTokenBalanceOf(address, tokenId, block);

    // console.log(`votes at block ${block}: ${votes}`);

    if (votes === 0) {
      return res.status(401).json({
        ok: false,
        errors: [
          `You're voting power is not enough for this proposal. (Block ${block} - Voting Power: ${votes})`,
        ],
      });
    }

    //Sign message
    const voteDate = new Date();
    const messageToSign = {
      address,
      votes,
      option,
      daoId,
      proposalId: proposal,
      voteDate,
    };
    const { message, messageHash, signature } = signMessage(
      JSON.stringify(messageToSign),
      privateKey,
      address
    );

    console.log(message, signature);

    const foundVote = foundProposal.votes.find(
      ({ address: foundAddress }) => foundAddress === address
    );

    const now = new Date();
    const endDate = new Date(proposal.endDate);

    if (now > endDate)
      return res.status(401).json({
        ok: false,
        errors: ["You can no longer vote!"],
      });

    if (foundVote)
      return res.status(401).json({
        ok: false,
        errors: ["You have already voted!"],
      });

    const vote = new Vote({
      ...messageToSign,
      message,
      messageHash,
      signature,
    });

    const voteResult = await vote.save();
    foundProposal.votes.push(vote);

    const result = await foundProposal.save();

    console.log(vote, result);
    return res.status("201").json({
      ok: true,
      result: vote || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, msg: "Internal server error" });
  }
};

const addVoteExternal = async (req, res = response) => {
  const { daoId, proposal } = req.params;
  const {
    address,
    votes,
    option,
    proposalId,
    voteDate,
    stringified,
    signature,
  } = req.body;

  try {
    const foundProposal = await Proposal.findById(proposal)
      .populate("votes")
      .exec();

    if (!foundProposal) {
      return res.status(404).json({
        ok: false,
        errors: ["This proposal doesn't exists!"],
      });
    }

    const { tokenId, block, options } = foundProposal;
    // console.log(`tokenid ${tokenId}, block ${block}`);

    if (option < 0 || option >= options.length) {
      return res.status(401).json({
        ok: false,
        errors: ["Invalid option to vote!"],
      });
    }

    // console.log(`address: ${address}, pk: ${privateKey}`);

    const votes = await getLandTokenBalanceOf(address, tokenId, block);

    // console.log(`votes at block ${block}: ${votes}`);

    if (votes === 0) {
      return res.status(401).json({
        ok: false,
        errors: [
          `You're voting power is not enough for this proposal. (Block ${block} - Voting Power: ${votes})`,
        ],
      });
    }

    const { valid, signer } = await validSignature(
      address,
      stringified,
      signature
    );

    console.log("valid: ", valid, " - signer: ", signer);
    //validate signed message
    if (!valid) {
      console.log("wrong signature!");
      return res.status(404).json({
        ok: false,
        errors: ["Wrong signature!"],
      });
    }

    const foundVote = foundProposal.votes.find(
      ({ address: foundAddress }) => foundAddress === address
    );

    const now = new Date();
    const endDate = new Date(proposal.endDate);

    if (now > endDate)
      return res.status(401).json({
        ok: false,
        errors: ["You can no longer vote!"],
      });

    if (foundVote)
      return res.status(401).json({
        ok: false,
        errors: ["You have already voted!"],
      });

    const messageToSign = {
      address: signer,
      votes,
      option,
      daoId,
      proposalId,
      voteDate,
    };

    const vote = new Vote({
      ...messageToSign,
      message: stringified,
      signature,
    });

    const voteResult = await vote.save();
    foundProposal.votes.push(vote);

    const result = await foundProposal.save();

    console.log(vote, result);
    return res.status("201").json({
      ok: true,
      result: vote || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, msg: "Internal server error" });
  }
};

const createProposalExternal = async (req, res = response) => {
  const {
    account,
    title,
    summary,
    discussion,
    options,
    duration,
    stringified,
    signature,
  } = req.body;

  try {
    const { valid } = await validSignature(account, stringified, signature);

    //validate signed message
    if (!valid) {
      console.log("wrong signature!");
      return res.status(404).json({
        ok: false,
        errors: ["Wrong signature!"],
      });
    }
    const startDate = new Date();
    let endDate = new Date();

    endDate.setDate(endDate.getDate() + duration);

    const block = await getLatestBlock();

    const proposal = new Proposal({
      title,
      summary,
      discussion,
      authorAddress: account,
      options,
      startDate,
      endDate,
      block,
      daoId: req.params.daoId,
      tokenId: req.tokenId,
    });

    // console.log(proposal);

    const result = await proposal.save();

    return res.status(201).json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, msg: "Internal server error" });
  }
};

module.exports = {
  getProposals,
  createProposalInternal,
  addVoteInternal,
  createProposalExternal,
  addVoteExternal,
};
