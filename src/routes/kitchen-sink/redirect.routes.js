const { Router } = require("express");
const { redirectToTheUrl } = require("../../controllers/kitchen-sink/redirect.controllers.js");
const { redirectToTheUrlValidator } = require("../../validators/kitchen-sink/redirect.validators.js");
const { validate } = require("../../validators/validate.js");

const router = Router();

router
  .route("/to")
  .get(redirectToTheUrlValidator(), validate, redirectToTheUrl
);

module.exports = router;
