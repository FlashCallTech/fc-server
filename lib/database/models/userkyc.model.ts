import mongoose, { Schema, model, models } from "mongoose";

const UserKycSchema = new Schema({
	transactionId: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		enum: ["auto_approved", "auto_declined", "needs_review"],
		required: true,
	},
	details: {
		fullName: {
			type: String,
			required: true,
		},
		countrySelected: {
			type: String,
			required: true,
		},
		dateOfBirth: {
			type: String,
			required: true,
		},
		dateOfIssue: {
			type: String,
			required: true,
		},
		selfieImage: {
			type: String,
			required: true,
		},
		idFrontImage: {
			type: String,
			required: true,
		},
		idBackImage: {
			type: String,
			required: true,
		},
	},
});

const UserKyc = models.UserKyc || model("UserKyc", UserKycSchema);

export default UserKyc;
