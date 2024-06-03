const { Router } = require("express");
const {
  getAllStatusCodes,
  getStatusCode,
} = require("../../controllers/kitchen-sink/statuscode.controllers.js");
const { statusCodeValidator } = require("../../validators/kitchen-sink/statuscode.validators.js");
const { validate } = require("../../validators/validate.js");

const router = Router();

router.route("/").get(getAllStatusCodes);

router
  .route("/:statusCode")
  .get(statusCodeValidator(), validate, getStatusCode);

module.exports = router;
