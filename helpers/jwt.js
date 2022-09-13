const jwt = require("jsonwebtoken");

const generateJWT = (uid, name, role) => {
  return new Promise((resolve, reject) => {
    const payload = { uid, name, role };

    jwt.sign(
      payload,
      process.env.SECRET_JWT_SEED,
      {
        expiresIn: "2h",
      },
      (err, token) => {
        if (err) {
          console.log(err);
          reject("Failed to gen JWT");
        }

        resolve(token);
      }
    );
  });
};

module.exports = {
  generateJWT,
};
