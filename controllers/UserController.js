/* eslint-disable no-underscore-dangle */
/* eslint-disable no-useless-return */
/* eslint-disable no-unused-vars */
import async from 'async';
import User from '../models/User.js';
import { genPassword, issueJwt, validPassword } from '../modules/Auth.js';

export const login = (req, res, next) => {
  User.findOne({ username: req.body.username })
    .populate({
      path: 'friendRequests',
      model: 'User',
    })
    .populate({
      path: 'friendRequestsSended',
      model: 'User',
    }).populate({
      path: 'friends',
      model: 'User',
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
      const valid = validPassword(req.body.password, user.hash, user.salt);
      const payload = {
        _id: user._id,
        username: user.username,
        pp: user.pp ? user.pp._id : null,
        friends: user.friends,
        friendRequests: user.friendRequests,
        friendRequestsSended: user.friendRequestsSended,
      };
      if (valid) {
        const jwt = issueJwt(user);
        res.json({
          success: true, user: payload, token: jwt.token, expiresIn: jwt.expires,
        });
        return;
      }

      res.status(400).json({ msg: 'wrong password' });
    });
};

export const register = (req, res, next) => {
  let newUser;
  User.findOne({ username: req.body.username })
    .populate({
      path: 'friendRequests',
      model: 'User',
    })
    .populate({
      path: 'friendRequestsSended',
      model: 'User',
    }).populate({
      path: 'friends',
      model: 'User',
    })
    .exec((err, usr) => {
      if (err) {
        res.status(400).json({ msg: 'some error happened!' });
        return;
      }
      if (usr) {
        res.status(400).json({ msg: 'this username is already taken' });
        return;
      }

      const saltHash = genPassword(req.body.password);
      const { salt } = saltHash;
      const { hash } = saltHash;

      if (req.body.pp) {
        newUser = new User({
          username: req.body.username,
          hash,
          salt,
          pp: req.body.pp,
        });
      } else {
        newUser = new User({
          username: req.body.username,
          hash,
          salt,
        });
      }

      newUser.save()
        .then((user) => {
          const jwt = issueJwt(user);
          const payload = {
            _id: user._id,
            username: user.username,
            pp: user.pp ? user.pp._id : null,
            friends: user.friends,
            friendRequests: user.friendRequests,
            friendRequestsSended: user.friendRequestsSended,
          };
          res.json({
            success: true, user: payload, token: jwt.token, expiresIn: jwt.expires,
          });
        });
    });
};

export const sendRequest = (req, res, next) => {
  let sended = false;
  User.findById(req.user._id)
    .exec((err, result) => {
      result.friendRequestsSended.forEach((usr) => {
        if (String(usr._id) === String(req.params.id)) {
          sended = true;
        }
      });

      async.parallel({
        sender: (cb) => {
          if (sended) {
            User.findOneAndUpdate({ _id: req.user._id }, {
              $pull: { friendRequestsSended: req.params.id },
            }).exec(cb);
          } else {
            User.findOneAndUpdate({ _id: req.user._id }, {
              $push: {
                friendRequestsSended: req.params.id,
              },
            }).exec(cb);
          }
        },
        receiver: (cb) => {
          if (sended) {
            User.findOneAndUpdate({ _id: req.params.id }, {
              $pull: { friendRequests: req.user._id },
            }).exec(cb);
          } else {
            User.findOneAndUpdate({ _id: req.params.id }, {
              $push: {
                friendRequests: req.user._id,
                notifications: {
                  title: 'Friend request received',
                  friend: req.user._id,
                },
              },
            }).exec(cb);
          }
        },
      }, (errr, results) => {
        if (errr) {
          res.status(400).json({ msg: 'error happened!' });
          return;
        }
        if (results) {
          if (sended) {
            res.json({
              msg: 'request canceled!',
              from: req.user._id,
              to: req.params.id,
            });
            return;
          }
          res.json({
            msg: 'request sent!',
            from: req.user._id,
            to: req.params.id,
          });
        }
      });
    });
};

export const acceptRequest = (req, res, next) => {
  let exist = false;
  let user1Posts = [];
  let user2Posts = [];

  User.findById(req.params.id)
    .exec((err2, user2) => {
      if (user2) {
        user2Posts = user2.posts;

        User.findById(req.user._id)
          .exec((err, user) => {
            user.friendRequests.forEach(((any) => {
              if (String(any._id) === String(req.params.id)) {
                exist = true;
                user1Posts = user.posts;
              }
            }));

            if (!exist) {
              res.status(404).json({
                msg: 'request does not exist',
              });
              return;
            }
            async.parallel({
              sender: (cb) => {
                User.findOneAndUpdate({ _id: req.params.id }, {
                  $pull: { friendRequestsSended: req.user._id },
                  $push: {
                    friends: req.user._id,
                    feed: { $each: user1Posts },
                    notifications: {
                      title: 'Your request received',
                      friend: req.user._id,
                    },
                  },

                })
                  .exec(cb);
              },
              accepter: (cb) => {
                User.findOneAndUpdate({ _id: req.user._id }, {
                  $pull: { friendRequests: req.params.id },
                  $push: { friends: req.params.id, feed: { $each: user2Posts } },
                })
                  .exec(cb);
              },
            }, (errr, result) => {
              if (errr) {
                res.status(400);
                return;
              }

              if (result) {
                res.json({
                  msg: 'accepted!',
                  accepter: req.user._id,
                  sender: req.params.id,
                });
              }
            });
          });
      }
    });
};

export const rejectRequest = (req, res, next) => {
  let exist = false;
  User.findById(req.user._id)
    .exec((err, user) => {
      user.friendRequests.forEach(((any) => {
        if (String(any._id) === String(req.params.id)) {
          exist = true;
        }
      }));

      if (!exist) {
        res.status(404).json({
          msg: 'request does not exist',
        });
        return;
      }
      async.parallel({
        sender: (cb) => {
          User.findOneAndUpdate({ _id: req.params.id }, {
            $pull: { friendRequestsSended: req.user._id },
          })
            .exec(cb);
        },
        rejecter: (cb) => {
          User.findOneAndUpdate({ _id: req.user._id }, {
            $pull: { friendRequests: req.params.id },
          })
            .exec(cb);
        },
      }, (errr, result) => {
        if (errr) {
          res.status(400);
          return;
        }

        if (result) {
          res.json({
            msg: 'rejected',
            rejecter: req.user._id,
            sender: req.params.id,
          });
        }
      });
    });
};

export const deleteFriend = (req, res, next) => {
  let exist = false;
  let user1Posts = [];
  let user2Posts = [];

  User.findById(req.params.id)
    .exec((err2, user2) => {
      if (user2) {
        user2Posts = user2.posts;

        User.findById(req.user._id)
          .exec((err, user) => {
            user.friends.forEach((any) => {
              if (String(any._id) === String(req.params.id)) {
                exist = true;
                user1Posts = user.posts;
              }
            });

            if (!exist) {
              res.status(404).json({ msg: 'friend does not exist' });
              return;
            }

            async.parallel({
              deleted: (cb) => {
                User.findOneAndUpdate({ _id: req.params.id }, {
                  $pull: { friends: req.user._id, feed: { $in: user1Posts } },

                })
                  .exec(cb);
              },
              deleter: (cb) => {
                User.findOneAndUpdate({ _id: req.user._id }, {
                  $pull: { friends: req.params.id, feed: { $in: user2Posts } },
                }).exec(cb);
              },
            }, (error, result) => {
              if (result.deleted && result.deleter) {
                res.json({
                  msg: 'deleted',
                  deleter: req.user._id,
                  deleted: req.params.id,
                });
              }
            });
          });
      }
    });
};

export const editUser = (req, res, next) => {
  User.findOneAndUpdate({ _id: req.params.id }, req.body.update, { new: true }, (err, result) => {
    if (err) {
      res.status(400).json({ msg: 'not updated' });
      return;
    }

    if (result) {
      const payload = {
        _id: result._id,
        username: result.username,
        pp: result.pp,
        friends: result.friends,
        friendRequests: result.friendRequests,
        friendRequestsSended: result.friendRequestsSended,
      };
      res.json({ user: payload });
    }
  });
};

export const getUsers = (req, res, next) => {
  User
    .find({
      _id: { $ne: req.user._id },
      friends: { $ne: req.user._id },
      friendRequests: { $ne: req.user._id },
      friendRequestsSended: { $ne: req.user._id },

    }, {

      _id: 1,
      username: 1,
      pp: 1,
      friendRequests: 1,
      friendRequestsSended: 1,
      friends: 1,

    })
    .limit(5)
    .exec((err, result) => {
      if (err) {
        res.status(400).json({ msg: 'some error happened' });
        return;
      }

      if (!result) {
        res.status(404).json({ msg: 'users not found' });
        return;
      }

      res.json({ users: result });
    });
};

export const getUser = (req, res, next) => {
  User
    .findOne({ _id: req.params.id }, {
      _id: 1,
      username: 1,
      pp: 1,
      friendRequests: 1,
      friendRequestsSended: 1,
      friends: 1,

    })
    .populate({
      path: 'friendRequests',
      model: 'User',
    })
    .populate({
      path: 'friendRequestsSended',
      model: 'User',
    }).populate({
      path: 'friends',
      model: 'User',
    })
    .exec((err, result) => {
      if (err) {
        res.status(400).json({ msg: 'some error happened' });
        return;
      }

      if (!result) {
        res.status(404).json({ msg: 'users not found' });
        return;
      }

      res.json({ user: result });
    });
};
