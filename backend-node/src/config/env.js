import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT || 8001),
  mongoUrl: process.env.MONGO_URL,
  dbName: process.env.DB_NAME,
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  cookieSecure: process.env.COOKIE_SECURE === "true"
};

for (const key of ["mongoUrl", "dbName", "jwtSecret"]) {
  if (!env[key]) throw new Error(`Missing required environment variable for ${key}`);
}