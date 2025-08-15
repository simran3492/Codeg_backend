const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: String }],
  posted_by: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  answers: [{ type: Schema.Types.ObjectId, ref: 'Answer' }],
  is_solved: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);