import session from "express-session";
import connectPgSimple from "connect-pg-simple";

const databaseUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;

if (!databaseUrl) {
  throw new Error("DATABASE_URL est manquante.");
}

if (!sessionSecret || Buffer.byteLength(sessionSecret) < 32) {
  throw new Error("SESSION_SECRET doit contenir au moins 32 octets.");
}

const PgSession = connectPgSimple(session);

/**
 * Middleware de session HTTP.
 * Les sessions sont persistées dans PostgreSQL.
 */
export const sessionMiddleware = session({
  name: "mdd.sid",
  store: new PgSession({
    conString: databaseUrl,
    tableName: "user_sessions",
    createTableIfMissing: true,
  }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
});
