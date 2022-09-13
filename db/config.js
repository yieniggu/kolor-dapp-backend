const mongoose = require("mongoose");

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);

    console.log("[DB] connected");
  } catch (err) {
    console.log(error);
    throw new Error("[DB] Error on db init");
  }
};

module.exports = { dbConnection };
