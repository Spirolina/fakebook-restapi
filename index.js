/* eslint-disable no-unused-vars */
/* eslint-disable import/extensions */
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';
import api from './routes/api.js';
import passportConfig from './config/passportConfig.js';

const corsOptions = {
  origin: '*',
  credentials: true, // access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

const mongodb = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.iz1vu.mongodb.net/fakebook?retryWrites=true&w=majority`;
mongoose.connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

passportConfig(passport);
app.use(passport.initialize());

app.use('/api', api);
app.get('/', (req, res) => {
  res.send('hello world');
});
app.listen(process.env.PORT || 5000, (req, res) => {

});
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
