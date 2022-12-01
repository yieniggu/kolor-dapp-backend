const { response } = require("express");
const res = require("express/lib/response");
const jwt = require("jsonwebtoken");

const jwtValidator = (req, res = response, next) => {
  // x-token in headers
  const token = req.header("x-token");

  if (!token) {
    return res.status(401).json({
      ok: false,
      errors: ["Missing token on request"],
    });
  }

  try {
    const { uid, name, role, address } = jwt.verify(
      token,
      process.env.SECRET_JWT_SEED
    );

    console.log(uid, name, role, address);

    req.uid = uid;
    req.name = name;
    req.role = role;
    req.address = address;
  } catch (err) {
    console.error(err);
    return res.status(401).json({
      ok: false,
      errors: ["Invalid token"],
    });
  }

  next();
};

const userValidator = (req, res = response, next) => {
  if (req.params.userId !== req.uid && req.role !== "admin") {
    return res.status(401).json({
      ok: false,
      errors: ["You're not allowed to be here >:("],
    });
  }

  next();
};

module.exports = {
  jwtValidator,
  userValidator,
};
