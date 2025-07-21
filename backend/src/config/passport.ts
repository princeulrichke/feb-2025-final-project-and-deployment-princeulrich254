import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { logger } from '../utils/logger';

export const configurePassport = () => {
  // JWT Strategy
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_ACCESS_SECRET || 'default-secret',
    issuer: 'erp-business-suite',
    audience: 'erp-users'
  }, async (payload, done) => {
    try {
      const user = await User.findById(payload.sub)
        .populate('company')
        .select('-password');
      
      if (!user) {
        return done(null, false);
      }

      if (!user.isActive) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      logger.error('JWT Strategy error:', error);
      return done(error, false);
    }
  }));

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), false);
        }

        // Check if user already exists
        let user = await User.findOne({ 
          $or: [
            { email },
            { googleId: profile.id }
          ]
        }).populate('company');

        if (user) {
          // Update Google ID if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, user);
        }

        // For new Google users, they need to complete signup process
        // We'll handle this in the frontend by redirecting to signup with pre-filled data
        return done(null, false, { 
          message: 'google_signup_required',
          profile: {
            email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            avatar: profile.photos?.[0]?.value || '',
            googleId: profile.id
          }
        });
        
      } catch (error) {
        logger.error('Google Strategy error:', error);
        return done(error, false);
      }
    }));
  }

  // Serialize/Deserialize user for session (not used with JWT, but required by passport)
  passport.serializeUser((user: any, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id).populate('company');
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
