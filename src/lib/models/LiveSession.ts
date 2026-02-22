import mongoose from 'mongoose';

const LiveSessionSchema = new mongoose.Schema({
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'MCQSet', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
    timeLimit: { type: Number, default: 30 }, // minutes
    startTime: { type: Date },
    endTime: { type: Date },
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        joinedAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 }, // percentage or question index
        score: { type: Number, default: 0 },
        isFinished: { type: Boolean, default: false },
        answers: [{
            questionIdx: Number,
            selectedOption: String,
            isCorrect: Boolean
        }]
    }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.LiveSession || mongoose.model('LiveSession', LiveSessionSchema);
