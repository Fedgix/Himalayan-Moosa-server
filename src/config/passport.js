import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from './env.js';
import { userService } from '../modules/users/services/user.service.js';

passport.use(new GoogleStrategy({
    clientID: config.GOOGLE.CLIENT_ID,
    clientSecret: config.GOOGLE.CLIENT_SECRET,
    callbackURL: config.GOOGLE.CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const user = await userService.findOrCreateGoogleUser({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0]?.value || null
        });
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

export default passport;