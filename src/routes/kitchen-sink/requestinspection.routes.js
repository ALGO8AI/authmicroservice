const { Router } = require("express");
const {
  getClientIP,
  getPathVariables,
  getQueryParameters,
  getRequestHeaders,
  getUserAgent,
} = require("../../controllers/kitchen-sink/requestinspection.controllers.js");

const router = Router();

router.route("/headers").get(getRequestHeaders);
router.route("/ip").get(getClientIP);
router.route("/user-agent").get(getUserAgent);
router.route("/path-variable/:pathVariable").get(getPathVariables);
router.route("/query-parameter").get(getQueryParameters);

module.exports = router;
