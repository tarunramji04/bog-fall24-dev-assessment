import mongoose from "mongoose";

const animalSchema = mongoose.Schema({
    //_id automatically generated
    name: {
        type: String,
        required: true,
    },
    hoursTrained: {
        type: Number,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dateOfBirth: {
        type: Date
    },
    profilePicture: {
        type: String
    }
});

export const Animal = mongoose.model('Animal', animalSchema);
