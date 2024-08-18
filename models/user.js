import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    //_id automatically generated
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        match: [/.+\@.+\..+/, 'Invalid e-mail']
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String
    }
});

export const User = mongoose.model('User', userSchema);
