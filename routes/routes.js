import express, { urlencoded } from 'express';
import { Animal } from '../models/animal.js'
import { TrainingLog } from '../models/trainingLog.js'
import { User } from '../models/user.js'
import bcrypt from 'bcryptjs'
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import 'dotenv/config'
import authenticateToken from './middleware.js'
import uploadToS3 from './helpers.js'
import fileUpload from 'express-fileupload';

const router = express.Router();

router.get('/health', authenticateToken, (req, res) => {
    res.status(200).json({ "healthy": true });
})

//did not include middleware function as user needs to create account first 
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

router.post('/animal', authenticateToken, async (req, res) => {
    const { name, hoursTrained, dateOfBirth, profilePicture } = req.body;

    try {
        const ownerId = req.user.id;

        if (typeof name !== "string" || typeof hoursTrained !== "number" || (dateOfBirth instanceof Date && !isNaN(dateOfBirth)) ||
            (profilePicture && typeof profilePicture !== "string") || !ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
                return res.status(400).json({ message: 'Request contains incorrect information' });
        }

        const exists = await Animal.findOne({
            name: name,
            owner: ownerId
        });
        
        if (exists) {
            return res.status(400).json({ message: 'Animal already exists' });
        }

        await Animal.create({
            name: name,
            hoursTrained: hoursTrained,
            owner: ownerId, 
            dateOfBirth: dateOfBirth, 
            profilePicture: profilePicture
        });

        res.status(200).json({ message: 'Animal created successfully'});
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/training', authenticateToken, async (req, res) => {
    const { date, description, hours, animal, trainingLogVideo } = req.body;
    try {
        const userId = req.user.id;

        if ((date instanceof Date && !isNaN(dateOfBirth)) || typeof description !== "string" || typeof hours !== "number" ||
            !mongoose.Types.ObjectId.isValid(animal) || !userId || !mongoose.Types.ObjectId.isValid(userId) ||
            (trainingLogVideo && typeof trainingLogVideo !== "string")) {
                return res.status(400).json({ message: 'Request contains incorrect information' });
        }

        const animalVerify = await Animal.findById(animal);
        if (!animalVerify) {
            return res.status(400).json({ message: 'Animal doesn\'t exist' });
        }
        
        const ownerString = animalVerify.owner.toString();
        if (ownerString !== userId) {
            return res.status(400).json({ message: 'Animal doesn\'t belong to user' });
        }

        await TrainingLog.create({
            date: date,
            description: description,
            hours: hours,
            animal: animal,
            user: userId,
            trainingLogVideo: trainingLogVideo
        });

        res.status(200).json({ message: 'Training log created successfully'});

    } catch(error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/admin/users', authenticateToken, async (req, res) => {
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

router.get('/admin/animals', authenticateToken, async (req, res) => {
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

router.get('/admin/training', authenticateToken, async (req, res) => {
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

router.post('/user/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(403).json({ message: 'Invalid email' });
        }

        const check = await bcrypt.compare(password, user.password);
        if (!check) {
            return res.status(403).json({ message: 'Incorrect password' });
        }
        res.status(200).json({ message: 'Successful login' });
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/user/verify', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(403).json({ message: 'Invalid email' });
        }

        const check = await bcrypt.compare(password, user.password);
        if (!check) {
            return res.status(403).json({ message: 'Incorrect password' });
        }

        const payload = { id: user._id, firstName: user.firstName, lastName: user.lastName, email : user.email };
        const accessToken = jwt.sign(payload, process.env.JWT_STRING, {expiresIn: 60 * 60});

        res.status(200).json({ token: accessToken });
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/file/upload', fileUpload(), express.urlencoded({ extended: true }), async (req, res) => {
    try {
        const { fileType, id } = req.body;
        if (!(fileType === "AnimalImage" || fileType === "UserImage" || fileType === "TrainingLogVideo") || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(500).json({ message: 'Request contains incorrect information' });
        }

        if (!req.files || !req.files.file) {
            return res.status(500).json({ message: 'No file received' });
        }

        if (fileType == "AnimalImage") {
            const animal = await Animal.findById(id);
            if (!animal) {
                return res.status(500).json({ message: 'No animal with this id exists' });
            }
            //result is object key
            const result = await uploadToS3(req.files.file);
            animal.profilePicture = result;
            await animal.save();
            return res.status(200).json({ message: 'Upload successful'});
        } else if (fileType == "UserImage") {
            const user = await User.findById(id);
            if (!user) {
                return res.status(500).json({ message: 'No user with this id exists' });
            }
            const result = await uploadToS3(req.files.file);
            user.profilePicture = result;
            await user.save();
            return res.status(200).json({ message: 'Upload successful'});           
        } else if (fileType == "TrainingLogVideo") {
            const trainingLog = await TrainingLog.findById(id);
            if (!trainingLog) {
                return res.status(500).json({ message: 'No training log with this id exists' });
            }
            const result = await uploadToS3(req.files.file);
            trainingLog.trainingLogVideo = result;
            await trainingLog.save();
            return res.status(200).json({ message: 'Upload successful'});      
        }
    } catch(error) {
        res.status(500).json({ message: error.message});
    }
})

export default router;
