// controllers/questionController.js
const Question = require("../models/question");
const Answer = require("../models/answer");
const User = require("../models/user"); 


// FR-1: Ask a Doubt
exports.createQuestion = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    
    // Simple validation
    if (!title || !description) {
      return res.status(400).json({ msg: 'Please provide a title and description.' });
    }

    const newQuestion = new Question({
      title,
      description,
      tags,
      posted_by: req.result._id, // from auth middleware
    });

    const question = await newQuestion.save();
    res.status(201).json(question);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// FR-2: Browse & View Doubts
exports.getAllQuestions = async (req, res) => {
  try {
    // Fetches questions, sorts by newest, and populates user info
    const questions = await Question.find()
      .populate('posted_by', 'firstName photoURL',) // Fetch username from User model
      .sort({ createdAt: -1 }); // Show most recent first
    res.json(questions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// FR-3: View Doubt Detail
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('posted_by', 'firstName photoURL')
      .populate({
        path: 'answers',
        populate: {
          path: 'posted_by',
          select: 'firstName photoURL',
        },
        options: {
          sort: { upvotes: -1, createdAt: 1 } // Sort answers by upvotes, then oldest
        }
      });

    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    res.json(question);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
};


exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    // Check user ownership
    if (question.posted_by.toString() !== req.result._id.toString()) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Delete associated answers
    await Answer.deleteMany({ question_id: req.params.id });

    // Delete question
    await Question.deleteOne({ _id: req.params.id });

    res.json({ msg: 'Question and associated answers removed' });
  } catch (err) {
    console.error(err.message);
    if (err.name === 'CastError') {
      return res.status(400).json({ msg: 'Invalid question ID format' });
    }
    res.status(500).send('Server Error');
  }
};
