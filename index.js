const express = require("express");
const cors = require("cors");
const { dbConnection } = require("./db/config");
require("dotenv").config();

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

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

// Listen requests
app.listen(process.env.PORT, () => {
  console.log("[SV] Server running on port", process.env.PORT);
});
