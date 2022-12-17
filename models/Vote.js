const { Schema, model } = require("mongoose");

const VoteSchema = Schema({
  address: {
    type: String,
    required: true,
  },
  votes: {
    type: Number,
    required: true,
  },
  option: {
    type: Number,
    required: true,
  },
  daoId: {
    type: String,
    required: true,
  },
  proposalId: {
    type: String,
    required: true,
  },
  voteDate: {
    type: Date,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  messageHash: {
    type: String,
  },
  signature: {
    type: String,
    required: true,
  },
});

module.exports = model("Vote", VoteSchema);
