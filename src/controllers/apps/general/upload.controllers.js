const { ApiError } = require("../../../utils/ApiError.js");
const { ApiResponse } = require("../../../utils/ApiResponse.js");

const uploadFile = async(req, res) => {
    try {
        if(!req.file){
            return res.status(400).json(new ApiError(400, "No file uploaded."))
        }
        return res.status(200).json(new ApiResponse(200, { file: req.file }, "File uploaded successfully."))
    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message));
    }
}

module.exports = uploadFile;