/* eslint-disable new-cap */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const PostSchema = new Schema({
  author: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  date: { type: mongoose.SchemaTypes.Date, default: new Date() },
  content: { type: mongoose.SchemaTypes.String, default: 'empty content' },
  photo: { type: mongoose.SchemaTypes.ObjectId, ref: 'Image' },
  comments: [{
    author: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    content: { type: mongoose.SchemaTypes.String },
    date: { type: mongoose.SchemaTypes.Date },
    likes: [{
      owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
      date: { type: mongoose.SchemaTypes.Date, default: new Date() },
    }],
  }],
  likes: [{
    owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    date: { type: mongoose.SchemaTypes.Date, default: new Date() },
  }],
});

const Post = new mongoose.model('Post', PostSchema);

export default Post;
