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
	data: {
		poa_front_dob: {
			type: String,
			default: null,
		},
		poi_imagePath: {
			type: String,
		},
		face_imagePath: {
			type: String,
		},
		digilocker_address: {
			type: String,
			default: null,
		},
		poa_backImagePath: {
			type: String,
		},
		poa_front_name: {
			type: String,
		},
		poi_name: {
			type: String,
		},
		poa_back_name: {
			type: String,
			default: null,
		},
		poa_front_idNumber: {
			type: String,
		},
		poa_back_idNumber: {
			type: String,
		},
		poa_back_dob: {
			type: String,
		},
		digilocker_idPhoto: {
			type: String,
			default: null,
		},
		poi_dob: {
			type: String,
		},
		poa_frontImagePath: {
			type: String,
		},
		digilocker_dob: {
			type: String,
			default: null,
		},
	},
});

const UserKyc = models.UserKyc || model("UserKyc", UserKycSchema);

export default UserKyc;
