/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
import multer from 'multer';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import Image from '../models/Image.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './images');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}`);
  },
});
const upload = multer({ storage });

export const uploadImage = [upload.single('image'), (req, res, next) => {
  const image = new Image({
    owner: req.user._id,
    data: fs.readFileSync(path.join(`./images/${req.file.filename}`)),
    contentType: 'image/png',
  });
  image.save((err, img) => {
    if (err) {
      res.status(400).json({
        msg: 'not uploaded',
      });
      return;
    }
    if (img) {
      res.json({
        msg: 'image saved',
        img,
      });
    }
  });
}];

export const deleteImage = (req, res, next) => {
  Image.findById(req.params.id)
    .exec((err, img) => {
      if (img) {
        if (String(img.owner._id) === String(req.user._id)) {
          Image.findByIdAndRemove(req.params.id)
            .exec((errRemove, deleted) => {
              if (deleted) {
                res.json({ msg: 'image deleted' });
              }
            });
          return;
        }
        res.status(401).json({ msg: 'not permitted' });
      }
    });
};

export const getImage = (req, res, next) => {
  Image.findById(req.params.id)
    .exec((err, img) => {
      if (img) {
        res.json({
          contentType: img.contentType,
          data: img.data.toString('base64'),
          owner: img.owner,
          _id: img._id,
        });
      }

      if (!img) {
        res.status(404).json({ msg: 'image not found' });
      }
    });
};
