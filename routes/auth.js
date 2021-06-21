const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.SECRET;
// const auth = require('../middleware/auth');
const { check, validationResult } = require("express-validator");

const User = require("../models/user");

router.post("/users", async (req, res, next) => {
  const user = new User();

  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.setPassword(req.body.user.password);

  user
    .save()
    .then(function () {
      return res.json({ user: user.toAuthJSON() });
    })
    .catch(next);
});

router.post(
  "/users/login",
  [
    check("email", "Please include a valid emial").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });

      if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        JWT_SECRET,
        {
          expiresIn: 360000,
        },
        (err, token) => {
          if (err) throw err;
          const response = {
            message: `Logged in User of id '${user.id}' successfully`,
            user: {
              _id: user.id,
              username: user.username,
              email: user.email,
              token,
              bio: user.bio,
              image: user.image,
            },
          };
          return res.status(200).json({ response });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);
module.exports = router;
