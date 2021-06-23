const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { route } = require("./auth");
const { verifyToken } = require("../middlewares/auth.middlewares");

router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    return res.status(200).send({ profile: user.toProfileJSONFor() });
  } catch (err) {
    res.status(404).send({ err, message: "Not Found" });
  }
});

router.post("/:username/follow", verifyToken, async (req, res) => {
  try {
    const { username } = req.params;

    const userToFollow = await User.findOne({ username });
    const user = await User.findById({ _id: req.userData.sub });
    await user.follow(userToFollow._id);

    return res
      .status(200)
      .send({ profile: userToFollow.toProfileJSONFor(user) });
  } catch (err) {
    res.send(err);
  }
});
// Unfollow a user
router.delete("/:username/follow", verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findById({ _id: req.userData.sub });
    const UserToUnfollow = await User.findOne({ username });

    await user.unfollow(UserToUnfollow._id);

    return res
      .status(200)
      .send({ profile: UserToUnfollow.toProfileJSONFor(user) });
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
