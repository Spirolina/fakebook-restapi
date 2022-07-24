/* eslint-disable no-unused-vars */
import express from 'express';
import passport from 'passport';
import { deleteImage, getImage, uploadImage } from '../controllers/ImageController.js';
import {
  createPost, deleteComment, deletePost, getFeed, getPost, getPosts,
  likeComment, likePost, makeComment,
} from '../controllers/PostController.js';
import {
  acceptRequest, deleteFriend, editUser,
  getUser, getUsers, login, register,
  rejectRequest, sendRequest,
} from '../controllers/UserController.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Hello world',
  });
});

router.get('/protected', passport.authenticate('jwt', { session: false }), (req, res, next) => {
  res.send('protected route');
});

router.post('/posts', passport.authenticate('jwt', { session: false }), createPost);
router.post('/posts/:id/delete', passport.authenticate('jwt', { session: false }), deletePost);
router.post('/posts/:postid/comments/:commentid/delete', passport.authenticate('jwt', { session: false }), deleteComment);

router.get('/posts', passport.authenticate('jwt', { session: false }), getPosts);
router.get('/posts/:id', passport.authenticate('jwt', { session: false }), getPost);
router.get('/images/:id', getImage);
router.get('/feed', passport.authenticate('jwt', { session: false }), getFeed);
router.get('/users', passport.authenticate('jwt', { session: false }), getUsers);
router.get('/users/:id', passport.authenticate('jwt', { session: false }), getUser);

router.post('/posts/:id/like', passport.authenticate('jwt', { session: false }), likePost);
router.post('/posts/:id/comments', passport.authenticate('jwt', { session: false }), makeComment);
router.post('/posts/:id/comments/:commentid/like', passport.authenticate('jwt', { session: false }), likeComment);

router.post('/register', register);
router.post('/login', login);
router.post('/users/:id', passport.authenticate('jwt', { session: false }), sendRequest);
router.post('/users/:id/edit', passport.authenticate('jwt', { session: false }), editUser);
router.post('/requests/:id/yes', passport.authenticate('jwt', { session: false }), acceptRequest);
router.post('/requests/:id/no', passport.authenticate('jwt', { session: false }), rejectRequest);
router.post('/friends/:id/delete', passport.authenticate('jwt', { session: false }), deleteFriend);
router.post('/images', passport.authenticate('jwt', { session: false }), uploadImage);
router.post('/images/:id/delete', passport.authenticate('jwt', { session: false }), deleteImage);
router.get('/dashboard', (req, res) => {
  res.json({ msg: 'dashboard' });
});

export default router;
