const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const connectDB = require("./config/db");

connectDB();

// Middlewears
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
// app.use(cors());
app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use("/api", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));
app.use("/api/profiles", require("./routes/profiles"));
app.use("/api/articles", require("./routes/articles"));
app.use("/api/tags", require("./routes/tags"));
// console.log(process.env.JWT_REFRESH_SECRET
app.listen(8000, () => console.log("Backend server is running!"));
