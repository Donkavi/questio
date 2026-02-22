import mongoose from 'mongoose';

const MCQSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String },
});

const MCQSetSchema = new mongoose.Schema({
    title: { type: String, required: true },
    mcqs: [MCQSchema],
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    language: { type: String, enum: ['English', 'Sinhala'], default: 'English' },
    documentReference: { type: String }, // name of uploaded file
    category: { type: String, default: 'General' },
    isPublic: { type: Boolean, default: true },
    password: { type: String },
    settings: {
        timeLimitTotal: { type: Number, default: 0 },
        timeLimitPerQuestion: { type: Number, default: 0 },
        randomizeQuestions: { type: Boolean, default: false },
        randomizeOptions: { type: Boolean, default: false }
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.MCQSet || mongoose.model('MCQSet', MCQSetSchema);
