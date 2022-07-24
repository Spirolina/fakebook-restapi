/* eslint-disable no-unused-vars */
/* eslint-disable no-useless-return */
/* eslint-disable no-underscore-dangle */
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';

export const createPost = (req, res, next) => {
  let post;
  if (req.body.photo) {
    post = new Post({
      author: req.user._id,
      content: req.body.content,
      photo: req.body.photo,
    });
  } else {
    post = new Post({
      author: req.user._id,
      content: req.body.content,
    });
  }
  const error = false;
  post.save()
    .then((result) => {
      if (result) {
        User.findById(req.user._id)
          .then((user) => {
            user.posts.push(result._id);
            user.feed.push(result._id);
            user.save((erUser, resultUser) => {
              if (!resultUser) {
                res.status(400).json({ msg: 'not created' });
                return;
              }
            });

            if (user.friends.length === 0) {
              res.status(200).json({
                msg: 'post successfully created',
                post: result,
              });
            } else {
              User.updateMany({
                _id: {
                  $in: [...user.friends],
                },
              }, {
                $push: { feed: result._id },
              }).exec((err, success) => {
                if (!success) {
                  Post.findByIdAndRemove(result._id)
                    .then((ress) => {
                      res.status(400).json({ msg: 'not created' });
                    });
                  return;
                }
                res.json({
                  msg: 'post successfully createddd',
                  post: result,
                });
              });
            }
          });
      }
    });
};

export const getPosts = (req, res, next) => {
  Post.find({ })
    .then((result) => {
      if (result.length !== 0) {
        const newResult = result.filter((any) => any.author.friends.includes(req.user._id));
        res.status(200).json({ posts: newResult });
        return;
      }

      res.status(404).json({ msg: 'there is no post' });
    });
};

export const getFeed = (req, res, next) => {
  User
    .findById(req.user._id)
    .populate({
      path: 'feed',
      populate: {
        path: 'author',
        model: 'User',
      },

    })
    .populate({
      path: 'feed',
      populate: {
        path: 'comments',
        populate: {
          path: 'author',
          model: 'User',
        },
      },

    })
    .exec((err, user) => {
      if (err) {
        res.status(400).json({ msg: 'some error happened!' });
        return;
      }

      if (!user) {
        res.status(404).json({ msg: 'user not found' });
        return;
      }

      res.json({ timeline: user.feed.reverse() });
    });
};

export const likePost = (req, res, next) => {
  let isLiked = false;
  Post.findById(req.params.id)
    .exec((err, result) => {
      result.likes.forEach((like) => {
        if (String(like.owner) === String(req.user._id)) {
          isLiked = true;
          result.likes.id(like._id).remove();
          result.save((unlikeErr, unliked) => {
            if (unliked) {
              res.json({ msg: 'Unliked!' });
            }
          });
        }
      });

      if (!isLiked) {
        const like = { owner: req.user._id };
        result.likes.push(like);
        result.save((likeErr, liked) => {
          if (liked) { res.json({ msg: 'You liked!' }); }
        });
      }
    });
};

export const makeComment = (req, res, next) => {
  const comment = {
    author: req.user,
    content: req.body.content,
  };

  if (!req.body.content.length) {
    res.status(400).json({
      msg: 'empty content',
    });
    return;
  }

  Post.findById(req.params.id)
    .exec((err, post) => {
      if (post) {
        post.comments.push(comment);
        post.save((saveErr, result) => {
          if (result) {
            res.json({
              msg: 'You make comment!',
              result,
            });
          }
        });
      }
    });
};

export const likeComment = (req, res, next) => {
  let liked = false;

  Post.findById(req.params.id)
    .exec((err, post) => {
      if (post) {
        post.comments.id(req.params.commentid).likes.forEach((item) => {
          if (String(item.owner._id) === String(req.user._id)) {
            liked = true;
            item.remove();
            post.save((unlikeErr, unlike) => {
              if (unlike) {
                res.json({ msg: 'unliked!', unlike });
              }
            });
          }
        });

        if (!liked) {
          const like = {
            owner: req.user._id,
          };

          post.comments.id(req.params.commentid).likes.push(like);
          post.save((likeErr, likeResult) => {
            if (likeResult) {
              res.json({ msg: 'You liked!' });
            }
          });
        }
      }
    });
};

export const deletePost = (req, res, next) => {
  Post.findById(req.params.id)
    .exec((err, post) => {
      if (!post) {
        res.status(404).json({ msg: 'not found' });
        return;
      }
      if (String(post.author._id) === String(req.user._id)) {
        Post.findByIdAndRemove(req.params.id, (errr, removed) => {
          if (removed) {
            res.json({
              msg: 'removed',
              deleter: req.user._id,
            });
          }
        });
      } else {
        res.status(401).json({ msg: 'not permitted' });
      }
    });
};

export const deleteComment = (req, res, next) => {
  Post.findById(req.params.postid)
    .exec((err, post) => {
      if (!post) {
        res.status(404).json({ msg: 'not found' });
        return;
      }
      if (String(post.comments.id(req.params.commentid).author._id) === String(req.user._id)) {
        post.comments.id(req.params.commentid).remove();
        post.save((errr, result) => {
          if (result) {
            res.json({
              msg: 'removed',
              deleter: req.user._id,
            });
          }
        });
      } else {
        res.status(401).json({ msg: 'not permitted' });
      }
    });
};

export const getPost = (req, res, next) => {
  Post.findById(req.params.id)
    .exec((err, post) => {
      if (err) {
        res.status(400).json({ msg: 'some error happened!' });
        return;
      }

      if (!post) {
        res.status(404).json({ msg: 'post not found' });
        return;
      }

      res.json({ post });
    });
};
