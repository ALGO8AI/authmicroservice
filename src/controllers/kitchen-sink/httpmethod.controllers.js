const { ApiResponse } = require("../../utils/ApiResponse.js");
const { asyncHandler } = require("../../utils/asyncHandler.js");

// TODO: Add more request methods (low priority)

/**
 *
 * @param {import("express").Request} req
 */
const getRequestMethodPayload = (req) => {
  return {
    method: req.method,
    headers: req.headers,
    origin: req.socket.localAddress,
    url: req.protocol + "://" + req.headers.host + req.originalUrl,
  };
};

const getRequest = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, getRequestMethodPayload(req), "GET request"));
});

const postRequest = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, getRequestMethodPayload(req), "POST request"));
});

const putRequest = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, getRequestMethodPayload(req), "PUT request"));
});

const patchRequest = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, getRequestMethodPayload(req), "PATCH request"));
});

const deleteRequest = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, getRequestMethodPayload(req), "DELETE request"));
});

module.exports = { getRequest, postRequest, putRequest, patchRequest, deleteRequest };
