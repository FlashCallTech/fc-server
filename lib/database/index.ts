import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose || { conn: null, promise: null };

export const connectToDatabase = async () => {
	if (cached.conn) {
		// Ensure the cached connection is still valid
		if (mongoose.connection.readyState === 1) {
			return cached.conn;
		} else {
			cached.conn = null; // Reset connection if not ready
		}
	}

	if (!MONGODB_URI) throw new Error("MONGODB_URI is missing");

	cached.promise =
		cached.promise ||
		mongoose.connect(MONGODB_URI, {
			dbName: "flash",
			bufferCommands: false,
			connectTimeoutMS: 10000,
			socketTimeoutMS: 60000,
			minPoolSize: 5,
		});

	try {
		cached.conn = await cached.promise;
	} catch (error: any) {
		cached.promise = null; // Reset the promise if connection fails
		throw new Error(`Database connection failed: ${error.message}`);
	}

	// Ensure the connection is ready before proceeding
	if (mongoose.connection.readyState !== 1) {
		throw new Error("Database connection not ready");
	}

	console.log("Connected to DataBase ✅");

	return cached.conn;
};
