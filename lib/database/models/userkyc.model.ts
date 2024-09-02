import { Schema, model, models } from "mongoose";

const UserKycSchema = new Schema({
	userId : {type: String, required: true, unique: true},
	verification_id : { type: String, required: true, unique: true },
	// valid : { type: Date, required: true },
	kyc_status: { type: String, required: true }
});

const UserKyc = models.UserKyc || model("UserKyc", UserKycSchema);

export default UserKyc;
