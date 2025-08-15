const express = require('express');
const adminMiddleware = require('../middleware/adminMiddle');
const userMiddleware = require('../middleware/usermiddle');
const videoRouter =  express.Router();
const {generateUploadSignature,saveVideoMetadata,deleteVideo,profile_pic} = require("../controllers/videoSection")

videoRouter.get("/create/:problemId",adminMiddleware,generateUploadSignature);
videoRouter.post("/save",adminMiddleware,saveVideoMetadata);
videoRouter.delete("/delete/:problemId",adminMiddleware,deleteVideo);
videoRouter.get("/upload/pic",userMiddleware,profile_pic)


module.exports = videoRouter;