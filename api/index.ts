import app from "../src/app";
import { connectDatabase } from "../src/database/db";

// Establish database connection.
// Mongoose buffers operations internally so requests will wait
// for this connection to be established.
connectDatabase().catch((err) => {
    console.error("Failed to connect to MongoDB initially:", err);
});

export default app;
