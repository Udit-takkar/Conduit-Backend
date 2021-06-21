async function auth(req, res, next) {
  let token = req.headers["authorization"];
  token = token.split(" ")[1]; //Access token

  jwt.verify(token, "access", async (err, user) => {
    if (user) {
      req.user = user;
      next();
    } else if (err.message === "jwt expired") {
      return res.json({
        success: false,
        message: "Access token expired",
      });
    } else {
      console.log(err);
      return res.status(403).json({ err, message: "User not authenticated" });
    }
  });
}
