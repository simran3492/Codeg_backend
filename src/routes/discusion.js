
const express = require('express');
let usermiddleware=require("../middleware/usermiddle")
const discussion_router = express.Router();
const {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestion,
} = require('../controllers/question_con.');

const {
  postAnswer,
  upvoteAnswer,
  acceptAnswer,
  deleteAnswer,
} = require("../controllers/answercon");

 

discussion_router.post('/create', usermiddleware, createQuestion)
discussion_router.get('/getAllQuestions', getAllQuestions);
discussion_router.get('/getQuestion/:id', getQuestionById);
discussion_router.delete('/deleteQuestion/:id', usermiddleware, deleteQuestion);


discussion_router.post('/answer/:questionId', usermiddleware, postAnswer);
discussion_router.patch('/:id/upvote', usermiddleware, upvoteAnswer);
// discussion_router.patch('/:id/accept', usermiddleware, acceptAnswer);
discussion_router.delete('/deleteAnswer/:id', usermiddleware, deleteAnswer);

module.exports = discussion_router;