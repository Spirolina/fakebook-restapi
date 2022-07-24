/* eslint-disable no-underscore-dangle */
import passportJwt from 'passport-jwt';
import User from '../models/User.js';

const JwtStrategy = passportJwt.Strategy;
const { ExtractJwt } = passportJwt;

const PUB_KEY = process.env.PUBLIC_KEY;

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
  algorithms: ['RS256'],
};

const strategy = new JwtStrategy(opts, (payload, done) => {
  User.findOne({ _id: payload.sub })
    .then((user) => {
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    })
    .catch((err) => done(err, null));
});

export default (passport) => {
  passport.use(strategy);
};
