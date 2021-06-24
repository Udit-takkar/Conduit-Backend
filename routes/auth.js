const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const { verifyRefreshToken } = require("../middlewares/auth.middlewares");
const redis_client = require("../config/redis_connect");
const User = require("../models/User");

router.post("/users", async (req, res, next) => {
  const user = new User({
    username: req.body.user.username,
    email: req.body.user.email,
    bio: null,
    image: null,
  });
  console.log(process.env.JWT_ACCESS_TIME);
  await user.setPassword(req.body.user.password);
  await user.save();

  const user_id = user._id;
  const refresh_token = GenerateRefreshToken(user_id);
  setTokenCookie(res, refresh_token);

  return res.status(201).json({ user: user.toAuthJSON() });
});

router.post(
  "/users/login",
  [
    check("user.email", "Please include a valid email").isEmail(),
    check("user.password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body.user;

    try {
      let user = await User.findOne({ email });

      if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

      const isMatch = user.validPassword(password);

      if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

      return res.status(200).json({ user: user.toAuthJSON() });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Logout function
async function Logout(req, res) {
  const user_id = req.userData.sub;
  const token = req.headers.authorization.split(" ")[1];

  // remove the refresh token
  await redis_client.del(user_id.toString());

  // blacklist current access token
  await redis_client.set("BL_" + user_id.toString(), token);

  return res.json({ status: true, message: "success." });
}

router.post("/refresh", verifyRefreshToken, (req, res) => {
  // If the refresh token is valid, create a new accessToken and return it.
  const user_id = req.userData.sub;
  const access_token = jwt.sign(
    { sub: user_id },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_TIME }
  );
  const refresh_token = GenerateRefreshToken(user_id);
  setTokenCookie(res, refresh_token);

  return res.json({ success: true, access_token });
});

//helpers

function setTokenCookie(res, token) {
  // create http only cookie with refresh token that expires in 7 days
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
  res.cookie("refreshToken", token, cookieOptions);
}

function GenerateRefreshToken(user_id) {
  const refresh_token = jwt.sign(
    { sub: user_id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_TIME }
  );

  redis_client.get(user_id.toString(), (err, data) => {
    if (err) throw err;

    redis_client.set(
      user_id.toString(),
      JSON.stringify({ token: refresh_token })
    );
  });

  return refresh_token;
}

module.exports = router;
