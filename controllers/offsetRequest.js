const { response } = require("express");
const OffsetRequest = require("../models/OffsetRequest");

const createOffsetRequest = async (req, res = response) => {
  try {
    const offsetRequest = new OffsetRequest(req.body);

    const result = await offsetRequest.save();

    console.log("result: ", result);

    return res.status(201).json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, msg: "Internal server error" });
  }
};

const getOffsetRequests = async (req, res = response) => {
  try {
    const offsetRequests = await OffsetRequest.find();
    console.log(offsetRequests);

    return res.status(200).json({
      ok: true,
      offsetRequests,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      ok: false,
      msg: "Internal server error",
    });
  }
};

const getOffsetRequest = async (req, res = response) => {
  const offsetRequestId = req.params.id;

  try {
    const offsetRequest = await OffsetRequest.findById(offsetRequestId);

    if (!offsetRequest) {
      return res.status(404).json({
        ok: false,
        msg: "Offset request doesn't exists",
      });
    }

    return res.status(200).json({
      ok: true,
      offsetRequest,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
    });
  }
};

const updateOffsetRequest = async (req, res = response) => {
  const offsetRequestId = req.params.id;

  try {
    const offsetRequest = await OffsetRequest.findById(offsetRequestId);

    if (!offsetRequest) {
      return res.status(404).json({
        ok: false,
        msg: "Offset request doesn't exists",
      });
    }

    const newOffsetRequest = req.body;

    const updatedOffsetRequest = await OffsetRequest.findByIdAndUpdate(
      offsetRequestId,
      newOffsetRequest,
      { new: true }
    );

    return res.status(200).json({
      ok: true,
      updatedOffsetRequest,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
    });
  }
};

module.exports = {
  createOffsetRequest,
  getOffsetRequests,
  getOffsetRequest,
  updateOffsetRequest,
};
