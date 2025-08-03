
const express = require('express');
const submitRouter = express.Router();
const userMiddleware = require("../middleware/usermiddle");
const {submitCode,runCode} = require("../controllers/userSubmission");


submitRouter.post("/submit/:id", userMiddleware, submitCode);

submitRouter.post("/run/:id",userMiddleware,runCode);
module.exports = submitRouter;