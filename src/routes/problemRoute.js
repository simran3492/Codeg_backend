const express = require('express');

const problemRouter =  express.Router();
const adminMiddleware=require('../middleware/adminMiddle')
const userMiddleware=require('../middleware/usermiddle')
const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem}=require('../controllers/problemCreate')

problemRouter.post("/create",adminMiddleware,createProblem);
problemRouter.put("/update/:id", adminMiddleware,updateProblem);
problemRouter.delete("/delete/:id",adminMiddleware,deleteProblem);


// problemRouter.get("/problemID/:id",userMiddleware,getProblemById);
problemRouter.get("/getParticularProblem",userMiddleware,getProblemById);
problemRouter.get("/getAllProblem",userMiddleware, getAllProblem);
problemRouter.get("/solvedAllProblembyUser",userMiddleware, solvedAllProblembyUser);
problemRouter.get("/submittedProblem/:pid",userMiddleware,submittedProblem);
module.exports = problemRouter;