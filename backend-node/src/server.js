import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
await connectDatabase();

const PORT = process.env.PORT || env.port || 4000;

app.listen(env.port, "0.0.0.0", () => console.log(`BuildLedger Node API listening on ${PORT}`));