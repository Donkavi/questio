import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId },
    selectedOption: { type: String },
    isCorrect: { type: Boolean }
});

const TestSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mcqSetId: { type: mongoose.Schema.Types.ObjectId, ref: 'MCQSet', required: true },
    answers: [AnswerSchema],
    score: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 }, // in seconds
    completedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.TestSession || mongoose.model('TestSession', TestSessionSchema);
