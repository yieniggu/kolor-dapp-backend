const express = require("express");
const cors = require("cors");
const { dbConnection } = require("./db/config");
require("dotenv").config();
const path = require("path");
// Create express server
const app = express();

dbConnection();

//CORS
app.use(cors());

// Body parsing
app.use(express.json());

// Public route
app.use(express.static("public"));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/lands", require("./routes/lands"));
app.use("/api/marketplace", require("./routes/marketplace"));
app.use("/api/offsets", require("./routes/offsetRequest"));
app.use("/api/tokens", require("./routes/token"));
app.use("/api/dao", require("./routes/proposals"));

console.log(path.resolve(__dirname, "public", "index.html"));

if (process.env.NODE_ENV === "production") {
  // Exprees will serve up production assets
  app.use(express.static("public"));

  // Express serve up index.html file if it doesn't recognize route

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "public", "index.html"));
  });
}

// Listen requests
app.listen(process.env.PORT, () => {
  console.log("[SV] Server running on port", process.env.PORT);
});
