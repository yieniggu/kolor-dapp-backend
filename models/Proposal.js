const { Schema, model } = require("mongoose");

const ProposalSchema = Schema({
  daoId: {
    type: String,
    required: true,
  },
  tokenId: {
    type: Number,
    required: true,
  },
  authorAddress: {
    type: String,
    required: true,
  },
  authorName: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  discussion: {
    type: String,
  },
  options: {
    type: Array,
    required: true,
  },
  votes: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "Vote",
      },
    ],
    default: [],
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  block: {
    type: String,
    required: true,
  },
});

module.exports = model("Proposal", ProposalSchema);
