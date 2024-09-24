import { Schema, model, models } from "mongoose";

const PanSchema = new Schema({
	pan_number: { type: String, required: true, unique: true, sparse: true },
	reference_id: { type: Number, required: true, unique: true, sparse: true },
	registered_name: { type: String, required: true },
	name_match_score: { type: Number },
	valid: { type: Boolean },
});

const AadhaarSchema = new Schema({
	ref_id: { type: Number, required: true, unique: true, sparse: true },
	aadhaar_number: {type: String, required: true, unique: true, sparse: true},
	name: { type: String, required: true },
	img_link: { type: String },
	status: { type: String },
});

const LivelinessSchema = new Schema({
	reference_id: { type: String, required: true, unique: true, sparse: true },
	verification_id: { type: String, required: true },
	img_url: { type: String },
	status: { type: String, required: true },
	liveliness: { type: Boolean, required: true },
});

const NameMatch = new Schema({
	reference_id: { type: Number, required: true, unique: true, sparse: true },
	verification_id: { type: String, required: true },
	name_1: { type: String },
	name_2: { type: String },
	status: { type: String },
	score: { type: String },
	reason: { type: String },
});

const FaceMatch = new Schema({
	reference_id: { type: Number, required: true, unique: true, sparse: true }, 
	verification_id: { type: String, required: true },
	status: { type: String },
	face_match_result: { type: String },
	face_match_score: { type: Number },
});

const UserKycSchema = new Schema({
	userId: { type: String, required: true, unique: true },
	kyc_status: {type: String, required: true, enum: ['PENDING', 'FAILED', 'COMPLETED']},
	pan: { type: PanSchema, default: null },
	aadhaar: { type: AadhaarSchema, default: null },
	liveliness: { type: LivelinessSchema, default: null },
	name_match: { type: NameMatch, default: null },
	face_match: { type: FaceMatch, default: null },
});

const UserKyc = models.UserKyc || model("UserKyc", UserKycSchema);

export default UserKyc;
