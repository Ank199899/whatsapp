import * as client from "openid-client";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Check for REPLIT_DOMAINS and provide a fallback for development
if (!process.env.REPLIT_DOMAINS && process.env.NODE_ENV === 'production') {
  console.warn("Warning: Environment variable REPLIT_DOMAINS not provided in production");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  // Use memory store for development, PostgreSQL for production
  let sessionStore;
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  }

  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    store: sessionStore, // undefined will use memory store
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    first_name: claims["first_name"],
    last_name: claims["last_name"],
    profile_image_url: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'development'
        ? "http://localhost:5000/api/auth/google/callback"
        : "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Google profile
        const user = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          first_name: profile.name?.givenName || '',
          last_name: profile.name?.familyName || '',
          profile_image_url: profile.photos?.[0]?.value || null,
        };

        // Store user in database
        await storage.upsertUser(user);

        console.log('✅ Google user authenticated:', user.email);
        return done(null, { claims: user });
      } catch (error) {
        console.error('Error during Google authentication:', error);
        return done(error, null);
      }
    }));
  }

  // Admin/Demo login route - always available for development
  app.get("/api/admin/login", async (req, res) => {
    try {
      console.log('🔐 Admin login attempt...');

      await storage.upsertUser({
        id: 'admin-user-123',
        email: 'admin@sendwopro.com',
        first_name: 'Admin',
        last_name: 'User',
        profile_image_url: null,
      });

      console.log('👤 Admin user created/updated in database');

      // Set up session for admin user
      const userSession = {
        claims: {
          sub: 'admin-user-123',
          email: 'admin@sendwopro.com',
          first_name: 'Admin',
          last_name: 'User'
        }
      };

      (req as any).session.user = userSession;
      console.log('📝 Session user set:', userSession);

      // Also save session to ensure it persists
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('❌ Session save error:', err);
          res.redirect('/login');
        } else {
          console.log('✅ Admin user logged in successfully, session saved');
          console.log('🔄 Redirecting to dashboard...');
          res.redirect('/');
        }
      });
    } catch (error) {
      console.error('❌ Error creating admin user:', error);
      res.redirect('/login');
    }
  });

  // Demo login route - always available
  app.get("/api/demo/login", async (req, res) => {
    try {
      await storage.upsertUser({
        id: 'demo-user-123',
        email: 'demo@sendwopro.com',
        first_name: 'Demo',
        last_name: 'User',
        profile_image_url: null,
      });

      // Set up session for demo user
      (req as any).session.user = {
        claims: {
          sub: 'demo-user-123',
          email: 'demo@sendwopro.com',
          first_name: 'Demo',
          last_name: 'User'
        }
      };

      // Also save session to ensure it persists
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
        }
        console.log('✅ Demo user logged in successfully');
        res.redirect('/');
      });
    } catch (error) {
      console.error('Error creating demo user:', error);
      res.redirect('/login');
    }
  });

  // Google OAuth routes
  app.get("/api/auth/google",
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      // Successful authentication, redirect to dashboard
      res.redirect('/');
    }
  );

  // Regular login route (redirects to Google OAuth)
  app.get("/api/login", (req, res) => {
    if (process.env.GOOGLE_CLIENT_ID) {
      res.redirect('/api/auth/google');
    } else {
      res.status(500).json({ error: 'Authentication not configured' });
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      (req as any).session.destroy((err: any) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
        res.redirect('/login');
      });
    });
  });

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  console.log('🔍 Authentication check for:', req.url);

  // Check session for authentication first (for admin/demo login)
  const session = (req as any).session;
  console.log('📋 Session exists:', !!session);
  console.log('👤 Session user:', session?.user ? 'exists' : 'not found');

  if (session && session.user) {
    req.user = session.user;
    console.log('✅ Session authentication successful for user:', session.user.claims?.email);
    return next();
  }

  // Check if user is authenticated via passport (Google OAuth)
  console.log('🔐 Checking passport authentication...');
  if (req.isAuthenticated() && req.user) {
    console.log('✅ Passport authentication successful');
    return next();
  }

  // For development, auto-create admin session if none exists
  console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔧 Checking development mode...');
  const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
  console.log('🔧 Is development mode:', isDevelopment);
  if (isDevelopment) {
    console.log('🔧 Development mode: Creating auto admin session');
    try {
      await storage.upsertUser({
        id: 'admin-user-123',
        email: 'admin@sendwopro.com',
        first_name: 'Admin',
        last_name: 'User',
        profile_image_url: null,
      });

      // Set up session for admin user
      (req as any).session.user = {
        claims: {
          sub: 'admin-user-123',
          email: 'admin@sendwopro.com',
          first_name: 'Admin',
          last_name: 'User'
        }
      };

      req.user = (req as any).session.user;
      console.log('✅ Auto admin session created for development');
      return next();
    } catch (error) {
      console.error('Error creating auto admin session:', error);
    }
  } else {
    console.log('🔧 Not in development mode, NODE_ENV is:', process.env.NODE_ENV);
  }

  // If no authentication found, return unauthorized
  console.log('❌ No authentication found, returning 401');
  return res.status(401).json({ message: "Unauthorized" });
};
