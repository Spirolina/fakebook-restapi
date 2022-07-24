/* eslint-disable new-cap */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const ImageSchema = new Schema({
  owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  data: { type: mongoose.SchemaTypes.Buffer },
  contentType: { type: mongoose.SchemaTypes.String },
});

const Image = new mongoose.model('Image', ImageSchema);

export default Image;
