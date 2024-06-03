const { Router } = require("express");
const {
  getResponseHeaders,
  sendBrotliResponse,
  sendGzipResponse,
  sendHTMLTemplate,
  sendXMLData,
  setCacheControlHeader,
} = require("../../controllers/kitchen-sink/responseinspection.controllers.js");
const { setCacheControlHeaderValidator } = require("../../validators/kitchen-sink/responseinspection.validators.js");
const { validate } = require("../../validators/validate.js");
const compression = require("express-compression");

const router = Router();

router
  .route("/cache/:timeToLive/:cacheResponseDirective")
  .get(setCacheControlHeaderValidator(), validate, setCacheControlHeader);
router.route("/headers").get(getResponseHeaders);
router.route("/html").get(sendHTMLTemplate);
router.route("/xml").get(sendXMLData);

router.use(compression()).route("/gzip").get(sendGzipResponse);

router
  .use(
    compression({
      brotli: {
        enabled: true,
        zlib: {},
      },
    })
  )
  .get("/brotli", sendBrotliResponse);

module.exports = router;
