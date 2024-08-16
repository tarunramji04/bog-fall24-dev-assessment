import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes/routes.js'
import mongoose from 'mongoose';

dotenv.config();
const app = express();
const APP_PORT = 5000;
const mongoURI = process.env.DATABASE_URI;

app.use(cors({ origin: true }));
app.use('/api', routes);

app.get('/', (req, res) => {
    res.json({"Hello": "World",
            "Version": 2})
})


mongoose.connect(mongoURI)
    .then(() => {
        console.log("connected to db");
        app.listen(APP_PORT, () => {
            console.log(`api listening at http://localhost:${APP_PORT}`)
        })
    })
    .catch((error) => {
        console.log(error)
    })
