const { Router } = require("express");
const { healthcheck } = require("../controllers/healthcheck.controllers.js");

const router = Router();

router.route("/").get(healthcheck);

module.exports = router;
