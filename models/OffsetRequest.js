const { Schema, model } = require("mongoose");

const OffsetRequestSchema = Schema({
  tokenId: {
    type: Number,
    required: true,
    min: 0,
  },
  email: {
    type: String,
    required: true,
  },
  VCUs: {
    type: Number,
    default: 0,
    min: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  phone: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  company: String,
  comments: String,
});

module.exports = model("OffsetRequest", OffsetRequestSchema);
