// controllers/answerController.js
const Answer = require("../models/answer");
const Question = require("../models/question");

// FR-4: Post an Answer
// controllers/answercon.js

exports.postAnswer = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ msg: 'Answer content cannot be empty.' });
    }

    const newAnswer = new Answer({
      question_id: req.params.questionId,
      content,
      posted_by: req.result._id,
    });

    const answer = await newAnswer.save();
    
    question.is_solved=true
    question.answers.push(answer._id);
    await question.save();
    
    
    const populatedAnswer = await answer.populate('posted_by', 'first_name');

    
    res.status(201).json(populatedAnswer);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.upvoteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ msg: 'Answer not found' });
    }

    const userId = req.real_user._id;

  
    const voteIndex = answer.upvoted_by.indexOf(userId);

    if (voteIndex > -1) {
      // User has already voted, so REMOVE the upvote (devote)
      answer.upvoted_by.splice(voteIndex, 1);
    } else {
      // User has not voted, so ADD the upvote
      answer.upvoted_by.push(userId);
    }
    
    // Always update the count based on the array's length for data integrity
    answer.upvotes = answer.upvoted_by.length; 
    
    await answer.save();

    // IMPORTANT: Send back BOTH the new count AND the updated array.
    // The frontend needs this array to know if the current user has voted.
    res.json({
        upvotes: answer.upvotes,
        upvoted_by: answer.upvoted_by 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};


// DELETE own answer
exports.deleteAnswer = async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id);

        if (!answer) {
            return res.status(404).json({ msg: 'Answer not found' });
        }

        // Check if the user deleting is the author of the answer
        if (answer.posted_by.toString() !== req.real_user._id.toString()) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Remove the answer reference from the parent question
        await Question.updateOne(
            { _id: answer.question_id },
            { $pull: { answers: answer._id } }
        );

        // Delete the answer from the database
        await Answer.deleteOne({ _id: answer._id });

        res.json({ msg: 'Answer removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
