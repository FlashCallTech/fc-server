import { Schema, model, models } from "mongoose";

const ClientSchema = new Schema(
	{
		username: { type: String, unique: true },
		onlineStatus: { type: Boolean, default: false },
		phone: { type: String, required: true, unique: true },
		fullName: { type: String },
		firstName: { type: String },
		lastName: { type: String },
		photo: { type: String },
		role: { type: String, default: "client" },
		bio: { type: String },
		walletBalance: { type: Number, default: 0 },
		gender: { type: String },
		dob: { type: String },
	},
	{
		timestamps: true,
	}
);

const Client = models.Client || model("Client", ClientSchema);

export default Client;
