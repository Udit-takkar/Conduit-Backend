const express = require("express");
const router = express.Router();
const Article = require("../models/Article");
const User = require("../models/user");
const { route } = require("./auth");
const { verifyToken } = require("../middlewares/auth.middlewares");
const user = require("../models/user");

router.get("/", async (req, res) => {
  try {
    let loggedInUser = null;

    if (typeof req.userData !== "undefined") {
      loggedInUser = await User.findOne({ _id: user.userData.sub });
    }

    const query = {};
    let limit = 20;
    let offset = 0;

    if (typeof req.query.limit !== "undefined") {
      limit = req.query.limit;
    }

    if (typeof req.query.offset !== "undefined") {
      offset = req.query.offset;
    }

    if (typeof req.query.tag !== "undefined") {
      query.tagList = { $in: [req.query.tag] };
    }

    if (typeof req.query.author !== "undefined" && req.query.author) {
      const user = await User.findOne({ username: req.query.author });
      query.author = user._id;
    }
    if (typeof req.query.favorited !== "undefined" && req.query.favorited) {
      const user = await User.findOne({ username: req.query.favorited });
      query._id = user._id;
    }

    const articles = await Article.find(query)
      .limit(Number(limit))
      .skip(Number(offset))
      .sort({ createdAt: "desc" })
      .populate("author")
      .exec();

    const articlesCount = await Article.countDocuments(query);

    res.status(200).send({
      articles: articles.map(function (article) {
        return article.toJSONFor(loggedInUser);
      }),
      articlesCount,
    });
  } catch (err) {
    return res.status(404).send(err);
  }
});

//  Get Feed Articles
router.get("/feed", verifyToken, async (req, res) => {
  try {
    let limit = 20;
    let offset = 0;

    if (typeof req.query.limit !== "undefined") {
      limit = req.query.limit;
    }

    if (typeof req.query.offset !== "undefined") {
      offset = req.query.offset;
    }

    const user = await User.findById({ _id: req.userData.sub });
    if (!user) {
      return res.status(401);
    }

    Promise.all([
      Article.find({ author: { $in: user.following } })
        .limit(Number(limit))
        .skip(Number(offset))
        .populate("author")
        .exec(),
      Article.countDocuments({ author: { $in: user.following } }),
    ]).then(function (results) {
      var articles = results[0];
      var articlesCount = results[1];

      return res.json({
        articles: articles.map(function (article) {
          return article.toJSONFor(user);
        }),
        articlesCount: articlesCount,
      });
    });
  } catch (err) {}
});

// Get article By Slug
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await Article.findOne({ slug });

    if (!article) return res.status(404).send("Not Found");

    await article.populate({
      path: "author",
    });

    return res.status(200).send({ article: article.toJSONFor() });
  } catch (err) {
    return res.send(err);
  }
});

//  Create Article
router.post("/", verifyToken, async (req, res) => {
  try {
    // console.log(req.userData.sub);
    const user = await User.findById({ _id: req.userData.sub });

    if (!user) {
      return res.status(401).send("User UnAuthorized");
    }

    const article = new Article(req.body.article);
    article.author = user;
    await article.save();

    return res.status(201).send({ article: article.toJSONFor(user) });
  } catch (err) {
    return res.send(err);
  }
});

module.exports = router;
