/* eslint-disable new-cap */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: mongoose.SchemaTypes.String, unique: true, required: true },
  pp: { type: mongoose.SchemaTypes.ObjectId, ref: 'Image' },
  name: { type: mongoose.SchemaTypes.String },
  birthdate: { type: mongoose.SchemaTypes.Date },
  surname: { type: mongoose.SchemaTypes.String },
  hash: { type: mongoose.SchemaTypes.String },
  salt: { type: mongoose.SchemaTypes.String },
  friends: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
  friendRequestsSended: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
  feed: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Post' }],
  posts: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Post' }],
  notifications: [{
    title: { type: mongoose.SchemaTypes.String },
    friend: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  }],
});

const User = new mongoose.model('User', UserSchema);

export default User;
