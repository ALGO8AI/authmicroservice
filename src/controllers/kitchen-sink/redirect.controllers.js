const { asyncHandler } = require("../../utils/asyncHandler.js");

const redirectToTheUrl = asyncHandler(async (req, res) => {
  const { url } = req.query;

  return res.status(301).redirect(url);
});

module.exports = { redirectToTheUrl };
