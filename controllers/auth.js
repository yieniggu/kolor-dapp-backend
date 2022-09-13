const { response } = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { generateJWT } = require("../helpers/jwt");
const { createWallet } = require("../helpers/web3Common");

const createUser = async (req, res = response) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        ok: false,
        msg: "Email is already in use!",
      });
    }

    user = new User(req.body);

    // encrypt password
    const salt = bcrypt.genSaltSync();
    user.password = bcrypt.hashSync(password, salt);

    // create eth account
    const { address, privateKey } = await createWallet();

    user.name = name;
    user.address = address;
    user.privateKey = privateKey;

    console.log("user: ", user);
    await user.save();

    // Generate JWT
    const token = await generateJWT(user.id, user.name, user.role);

    res.status(201).json({
      ok: true,
      uid: user.id,
      name: user.name,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      msg: "Please reach the admin for further notice",
    });
  }
};

const login = async (req, res = response) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        ok: false,
        errors: ["User with email doesn't exist"],
      });
    }

    // confirm password is correct
    const validPassword = await bcrypt.compareSync(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        ok: false,
        errors: ["Wrong password"],
      });
    }

    console.log(user);
    // Create JWT
    const token = await generateJWT(user.id, user.name, user.role);
    res.json({
      ok: true,
      uid: user.id,
      name: user.name,
      token,
      role: user.role,
      address: user.address,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      errors: ["Error, please reach admin for further notice"],
    });
  }
};

const refreshJWT = async (req, res = response) => {
  console.log(req);
  const { uid, name, role } = req;

  // generate new token and return in request
  const token = await generateJWT(uid, name, role);
  //const { role } = await User.findOne({ uid });

  res.json({
    ok: true,
    uid,
    name,
    token,
    role,
  });
};

module.exports = {
  createUser,
  login,
  refreshJWT,
};
