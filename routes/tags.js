const router = require("express").Router();
const mongoose = require("mongoose");
const Article = require("../models/Article");

router.get("/", async (req, res) => {
  try {
    const tags = await Article.find().distinct("tagList");
    res.status(200).send({ tags });
  } catch (err) {
    return res.status(404).send(err);
  }
});

module.exports = router;
