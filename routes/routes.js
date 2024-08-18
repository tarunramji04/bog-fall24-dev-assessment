import express from 'express';
import { Animal } from '../models/animal.js'
import { TrainingLog } from '../models/trainingLog.js'
import { User } from '../models/user.js'
import bcrypt from 'bcryptjs'
import mongoose from "mongoose";

const router = express.Router();

router.get('/health', (req, res) => {
    res.status(200).json({ "healthy": true });
})

router.post('/user', async (req, res) => {
    const { firstName, lastName, email, password, profilePicture } = req.body;

    try {
        if (typeof firstName !== "string" || typeof lastName !== "string" || typeof email !== "string" || 
            typeof password !== "string" || (profilePicture && typeof profilePicture !== "string")) { 
            return res.status(400).json({ message: 'Request contains incorrect information' });
        }

        const exists = await User.findOne({ email });

        if (exists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const encryptedPassword = await bcrypt.hash(password, 10);

        await User.create({
            firstName: firstName,
            lastName: lastName,
            email: email, 
            password: encryptedPassword, 
            profilePicture: profilePicture
        });

        res.status(200).json({ message: 'User created successfully'});
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/animal', async (req, res) => {
    const { name, hoursTrained, owner, dateOfBirth, profilePicture } = req.body;

    try {
        if (typeof name !== "string" || typeof hoursTrained !== "number" || !mongoose.Types.ObjectId.isValid(owner) ||
            (dateOfBirth instanceof Date && !isNaN(dateOfBirth)) || (profilePicture && typeof profilePicture !== "string")) {
                return res.status(400).json({ message: 'Request contains incorrect information' });
        }

        await Animal.create({
            name: name,
            hoursTrained: hoursTrained,
            owner: owner, 
            dateOfBirth: dateOfBirth, 
            profilePicture: profilePicture
        });

        res.status(200).json({ message: 'Animal created successfully'});
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/training', async (req, res) => {
    const { date, description, hours, animal, user, trainingLogVideo } = req.body;
    try {
        if ((date instanceof Date && !isNaN(dateOfBirth)) || typeof description !== "string" || typeof hours !== "number" ||
            !mongoose.Types.ObjectId.isValid(animal) || !mongoose.Types.ObjectId.isValid(user) || (trainingLogVideo && typeof trainingLogVideo !== "string")) {
                return res.status(400).json({ message: 'Request contains incorrect information' });
        }

        await TrainingLog.create({
            date: date,
            description: description,
            hours: hours,
            animal: animal,
            user: user,
            trainingLogVideo: trainingLogVideo
        });

        res.status(200).json({ message: 'Training log created successfully'});

    } catch(error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/admin/users', async (req, res) => {
    const { lastId, limit } = req.body;
    try {
        let users;
        if (lastId) {
            //gt is greater than, works since ObjectId's are ordered
            users = await User.find({'_id' : {'$gt': lastId}})
                .limit(limit)
                .select('firstName lastName email profilePicture');
        } else {
            users = await User.find()
                .limit(limit)
                .select('firstName lastName email profilePicture');
        }

        const currLast = users.length > 0 ? users[users.length - 1]._id : null;
        
        if (currLast) {
            res.status(200).json({ users, currLast });
        } else {
            res.status(200).json({ message: 'No more users found' });
        }
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/admin/animals', async (req, res) => {
    const { lastId, limit } = req.body;
    try {
        let animals;
        if (lastId) {
            //gt is greater than, works since ObjectId's are ordered
            //populate allows whole owner object to be displayed (other than password) instead of just objectID
            animals = await Animal.find({'_id' : {'$gt': lastId}})
                .limit(limit)
                .populate({
                    path: 'owner',
                    select: 'firstName lastName email profilePicture' 
                });
        } else {
            animals = await Animal.find()
                .limit(limit)
                .populate({
                    path: 'owner',
                    select: 'firstName lastName email profilePicture' 
                });
        }

        const currLast = animals.length > 0 ? animals[animals.length - 1]._id : null;
        
        if (currLast) {
            res.status(200).json({ animals, currLast });
        } else {
            res.status(200).json({ message: 'No more animals found' });
        }
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/admin/training', async (req, res) => {
    const { lastId, limit } = req.body;
    try {
        let logs;
        if (lastId) {
            //gt is greater than, works since ObjectId's are ordered
            //populate allows whole objects to be displayed (other than user password) instead of just objectIDs
            logs = await TrainingLog.find({'_id' : {'$gt': lastId}})
                .limit(limit)
                .populate({
                    path: 'animal'
                })
                .populate({
                    path: 'user',
                    select: 'firstName lastName email profilePicture' 
                });
        } else {
            logs = await TrainingLog.find()
                .limit(limit)
                .populate({
                    path: 'animal'
                })
                .populate({
                    path: 'user',
                    select: 'firstName lastName email profilePicture' 
                });
        }

        const currLast = logs.length > 0 ? logs[logs.length - 1]._id : null;
        
        if (currLast) {
            res.status(200).json({ logs, currLast });
        } else {
            res.status(200).json({ message: 'No more training logs found' });
        }
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
})


export default router;
