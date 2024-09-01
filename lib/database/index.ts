import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose || { conn: null, promise: null };

export const connectToDatabase = async () => {
	if (cached.conn) return cached.conn;

	if (!MONGODB_URI) throw new Error("MONGODB_URI is missing");

	if (!cached.promise) {
		cached.promise = mongoose.connect(MONGODB_URI, {
			dbName: "flash",
			bufferCommands: false,
			connectTimeoutMS: 10000,
			socketTimeoutMS: 45000,
			minPoolSize: 5,
		});
	}

	cached.conn = await cached.promise;

	// Ensure the connection is ready before proceeding
	if (mongoose.connection.readyState !== 1) {
		throw new Error("Database connection not ready");
	}

	console.log("Connected to DataBase");

	return cached.conn;
};
