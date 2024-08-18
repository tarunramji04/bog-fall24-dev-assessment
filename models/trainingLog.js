import mongoose from "mongoose";

const trainingSchema = mongoose.Schema({
    //_id automatically generated
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    hours: {
        type: Number,
        required: true
    },
    animal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Animal',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    trainingLogVideo: {
        type: String
    }
});

export const TrainingLog = mongoose.model('TrainingLog', trainingSchema);
