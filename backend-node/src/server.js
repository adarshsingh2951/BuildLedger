import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
await connectDatabase();
app.listen(env.port, "0.0.0.0", () => console.log(`BuildLedger Node API listening on ${env.port}`));