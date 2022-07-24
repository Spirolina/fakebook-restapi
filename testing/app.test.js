/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import api from '../routes/api.js';
import { initializeMongoServer } from './mongoConfigTesting.js';
import passportConfig from '../config/passportConfig.js';
import seedDb from '../seed.js';
import Post from '../models/Post.js';

let token;
let user2Token;
let postId;
let user1Id;
let user2Id;
let commentId;
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
passportConfig(passport);
app.use(passport.initialize());

app.use('/api', api);
beforeAll(async () => {
  await initializeMongoServer();
  await seedDb();
});

test('API /api', (done) => {
  request(app)
    .get('/api')
    .expect('Content-Type', /json/)
    .expect(200, done);
});

describe('POST /register', () => {
  test('register user1', (done) => {
    request(app)
      .post('/api/register')
      .set('Content-type', 'application/json')
      .send({
        username: 'sdfsadfsdafasdf',
        password: '123456',
      })
      .then((res) => {
        user1Id = res.body.user._id;
        expect(res.status).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user).toBeDefined();
        done();
      });
  });

  test('register user2', (done) => {
    request(app)
      .post('/api/register')
      .set('Content-type', 'application/json')
      .send({
        username: 'dsafsadfsdaf',
        password: '123456',
      })
      .then((res) => {
        user2Id = res.body.user._id;
        expect(res.status).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user).toBeDefined();
        done();
      });
  });

  test('register already taken username', (done) => {
    request(app)
      .post('/api/register')
      .send({
        username: 'initialAccount',
        password: '123456',
      })
      .then((res) => {
        expect(res.status).toEqual(400);
        expect(res.body.msg).toEqual('this username is already taken');
        done();
      });
  });
});

describe('POST /login', () => {
  test('login user1', (done) => {
    request(app)
      .post('/api/login')
      .send({
        username: 'sdfsadfsdafasdf',
        password: '123456',
      })
      .then((res) => {
        token = res.body.token;

        expect(res.status).toEqual(200);
        expect(res.body.user).toBeDefined();
        expect(res.body.token).toBeDefined();
        done();
      });
  });

  test('login user2', (done) => {
    request(app)
      .post('/api/login')
      .send({
        username: 'dsafsadfsdaf',
        password: '123456',
      })
      .then((res) => {
        user2Token = res.body.token;

        expect(res.status).toEqual(200);
        expect(res.body.user).toBeDefined();
        expect(res.body.token).toBeDefined();
        done();
      });
  });

  test('login wrong username', (done) => {
    request(app)
      .post('/api/login')
      .send({
        username: 'unknown',
        password: '123456',
      })
      .then((res) => {
        expect(res.status).toEqual(404);
        expect(res.body.msg).toEqual('user not found');
        done();
      });
  });

  test('login wrong password', (done) => {
    request(app)
      .post('/api/login')
      .send({
        username: 'initialAccount',
        password: 'wrongPassword',
      })
      .then((res) => {
        expect(res.status).toEqual(400);
        expect(res.body.msg).toEqual('wrong password');
        done();
      });
  });
});

describe('GET /protected', () => {
  test('protected', (done) => {
    request(app)
      .get('/api/protected')
      .set('Authorization', token).then((res) => {
        expect(res.status).toEqual(200);

        done();
      });
  });
});

describe('GET /posts', () => {
  test('get existing posts', (done) => {
    request(app)
      .get('/api/posts')
      .set('Authorization', token)
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.posts).toBeDefined();
        done();
      });
  });

  test('get existing posts wrong token', (done) => {
    request(app)
      .get('/api/posts')
      .set('Authorization', 'Bearer 1234234324')
      .then((res) => {
        expect(res.status).toEqual(401);
        done();
      });
  });
  test('get no post', (done) => {
    Post.deleteMany({}, (err, result) => {
      if (err) {
        
        return;
      }
      if (result) {
        
      }
    });
    request(app)
      .get('/api/posts')
      .set('Authorization', token)
      .then((res) => {
        expect(res.status).toEqual(404);
        expect(res.body.msg).toEqual('there is no post');
        done();
      });
  });
});

describe('POST /posts', () => {
  test('create post', (done) => {
    request(app)
      .post('/api/posts')
      .set('Authorization', token)
      .send({
        content: 'first post',
      })
      .then((res) => {
        postId = res.body.post._id;
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('post successfully created');
        expect(res.body.post).toBeDefined();
        done();
      });
  });

  test('create post wrong token', (done) => {
    request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer 24324234234')
      .send({
        content: 'wrong token',
      })
      .then((res) => {
        expect(res.status).toEqual(401);
        done();
      });
  });
});

describe('POST /posts/:id/like', () => {
  test('like', (done) => {
    request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', token)
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('You liked!');
        done();
      });
  });

  test('unlike', (done) => {
    request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', token)
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('Unliked!');
        done();
      });
  });

  test('like wrong token', (done) => {
    request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', '123423412')
      .then((res) => {
        expect(res.status).toEqual(401);
        done();
      });
  });
});

describe('POST /posts/:id/comments', () => {
  test('make comment', (done) => {
    request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', token)
      .send({
        content: 'This is a comment!',
      })
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('You make comment!');
        commentId = res.body.result.comments[0]._id;
        done();
      });
  });

  test('make empty comment', (done) => {
    request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', token)
      .send({
        content: '',
      })
      .then((res) => {
        expect(res.status).toEqual(400);
        expect(res.body.msg).toEqual('empty content');
        done();
      });
  });

  test('make comment wrong token', (done) => {
    request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', '32423432')
      .send({
        content: 'wrong token content',
      })
      .then((res) => {
        expect(res.status).toEqual(401);
        done();
      });
  });
});

describe('POST /posts/:id/comments/:commentid/like', () => {
  test('like comment', (done) => {
    request(app)
      .post(`/api/posts/${postId}/comments/${commentId}/like`)
      .set('Authorization', token)
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('You liked!');
        done();
      });
  });

  test('unlike comment', (done) => {
    request(app)
      .post(`/api/posts/${postId}/comments/${commentId}/like`)
      .set('Authorization', token)
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('unliked!');
        done();
      });
  });

  test('like comment wrong token', (done) => {
    request(app)
      .post(`/api/posts/${postId}/comments/${commentId}/like`)
      .set('Authorization', '234534535')
      .then((res) => {
        expect(res.status).toEqual(401);
        done();
      });
  });
});

describe('POST /api/users/:id', () => {
  test('send friend request', (done) => {
    request(app)
      .post(`/api/users/${user2Id}`)
      .set('Authorization', token)
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('request sent!');
        expect(res.body.from).toEqual(user1Id);
        expect(res.body.to).toEqual(user2Id);
        done();
      });
  });

  test('cancel friend request', (done) => {
    request(app)
      .post(`/api/users/${user2Id}`)
      .set('Authorization', token)
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('request canceled!');
        expect(res.body.from).toEqual(user1Id);
        expect(res.body.to).toEqual(user2Id);
        done();
      });
  });

  test('send friend request again', (done) => {
    request(app)
      .post(`/api/users/${user2Id}`)
      .set('Authorization', token)
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('request sent!');
        expect(res.body.from).toEqual(user1Id);
        expect(res.body.to).toEqual(user2Id);
        done();
      });
  });

  test('friend request wrong token', (done) => {
    request(app)
      .post(`/api/users/${user2Id}`)
      .set('Authorization', 'sdafsadfsfsadf')
      .then((res) => {
        expect(res.status).toEqual(401);
        done();
      });
  });
});

describe('POST /api/requests/:id/yes', () => {
  test('accept friend request', (done) => {
    request(app)
      .post(`/api/requests/${user1Id}/yes`)
      .set('Authorization', user2Token)
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('accepted!');
        expect(res.body.sender).toEqual(user1Id);
        expect(res.body.accepter).toEqual(user2Id);
        done();
      });
  });

  test('delete friend', (done) => {
    request(app)
      .post(`/api/friends/${user1Id}/delete`)
      .set('Authorization', user2Token)
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('deleted');
        expect(res.body.deleter).toEqual(user2Id);
        expect(res.body.deleted).toEqual(user1Id);
        done();
      });
  });

  test('accept friend request does not exist', (done) => {
    request(app)
      .post(`/api/requests/${user1Id}/yes`)
      .set('Authorization', user2Token)
      .then((res) => {
        expect(res.status).toEqual(404);
        expect(res.body.msg).toEqual('request does not exist');
        done();
      });
  });
});

describe('POST /api/requests/:id/no', () => {
  // to able to test rejecting we need friend request
  test('send friend request again', (done) => {
    request(app)
      .post(`/api/users/${user2Id}`)
      .set('Authorization', token)
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('request sent!');
        expect(res.body.from).toEqual(user1Id);
        expect(res.body.to).toEqual(user2Id);
        done();
      });
  });

  test('reject request', (done) => {
    request(app)
      .post(`/api/requests/${user1Id}/no`)
      .set('Authorization', user2Token)
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('rejected');
        expect(res.body.rejecter).toEqual(user2Id);
        expect(res.body.sender).toEqual(user1Id);
        done();
      });
  });
});

describe('POST /api/posts/:postid/comments/:commentid/delete', () => {
  test('delete comment unauthorized', (done) => {
    request(app)
      .post(`/api/posts/${postId}/comments/${commentId}/delete`)
      .set('Authorization', user2Token)
      .then((res) => {
        expect(res.status).toEqual(401);
        expect(res.body.msg).toEqual('not permitted');
        done();
      });
  });

  test('delete comment', (done) => {
    request(app)
      .post(`/api/posts/${postId}/comments/${commentId}/delete`)
      .set('Authorization', token)
      .then((res) => {
        
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('removed');
        expect(res.body.deleter).toEqual(user1Id);
        done();
      });
  });
});

describe('POST /api/posts/:id/delete', () => {
  test('create post for deleting test', (done) => {
    request(app)
      .post('/api/posts')
      .set('Authorization', token)
      .send({
        content: 'first post',
      })
      .then((res) => {
        postId = res.body.post._id;
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('post successfully created');
        expect(res.body.post).toBeDefined();
        done();
      });
  });

  test('delete post unauthorized', (done) => {
    request(app)
      .post(`/api/posts/${postId}/delete`)
      .set('Authorization', user2Token)
      .then((res) => {
        expect(res.status).toEqual(401);
        expect(res.body.msg).toEqual('not permitted');
        done();
      });
  });

  test('delete post', (done) => {
    request(app)
      .post(`/api/posts/${postId}/delete`)
      .set('Authorization', token)
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body.msg).toEqual('removed');
        expect(res.body.deleter).toEqual(user1Id);
        done();
      });
  });

  test('delete post does not exist', (done) => {
    request(app)
      .post(`/api/posts/${postId}/delete`)
      .set('Authorization', token)
      .then((res) => {
        expect(res.status).toEqual(404);
        expect(res.body.msg).toEqual('not found');
        done();
      });
  });
});
