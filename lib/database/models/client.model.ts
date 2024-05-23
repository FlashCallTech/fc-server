import { Schema, model, models } from "mongoose";

const ClientSchema = new Schema({
	clerkId: { type: String, required: true, unique: true },
	username: { type: String, required: true, unique: true },
	phone: { type: String, required: true, unique: true },
	fullName: { type: String },
	firstName: { type: String },
	lastName: { type: String },
	photo: { type: String, required: true },
	role: { type: String, required: true },
	bio: { type: String },
});

const Client = models.Client || model("Client", ClientSchema);

export default Client;
