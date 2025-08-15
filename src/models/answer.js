// models/Answer.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnswerSchema = new Schema({
  question_id: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  content: { type: String, required: true },
  posted_by: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  is_accepted: { type: Boolean, default: false },
 upvoted_by: [{ type: Schema.Types.ObjectId, ref: 'user' }],
upvotes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Answer', AnswerSchema);