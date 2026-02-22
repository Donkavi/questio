import mongoose from 'mongoose';

const QuizAttemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'MCQSet', required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    answers: [{
        questionIdx: Number,
        selectedOption: String,
        isCorrect: Boolean
    }],
    completedAt: { type: Date, default: Date.now }
});

export default mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', QuizAttemptSchema);
