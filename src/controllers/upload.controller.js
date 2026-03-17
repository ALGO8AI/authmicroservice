import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logger from "../logger/winston.logger.js";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(new ApiError(400, "No file uploaded."));
    }

    const sanitizedFile = {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { file: sanitizedFile },
          "File uploaded successfully.",
        ),
      );
  } catch (error) {
    logger.error("File upload failed:", error);
    return res
      .status(500)
      .json(new ApiError(500, "File upload failed. Please try again."));
  }
};
