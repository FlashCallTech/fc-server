import { Schema, model, models } from "mongoose";

// const UserKycSchema = new Schema({
// 	userId : {type: String, required: true, unique: true},
// 	verification_id: {type: String, required: true},
// 	kyc_status: {type: String, required: true}
// });

const PanSchema = new Schema({
	pan_number: {type: String, required: true, unique: true},
	reference_id: {type: Number, required: true, unique: true},
	registered_name: {type: String},
	name_match_score: {type: Number},
	valid: {type: Boolean}
});

const AadhaarSchema = new Schema({
	ref_id: {type: Number, required: true, unique: true},
	name: {type: String},
	img_link: {type: String},
	status: {type: String},
});

const LivelinessSchema = new Schema({
	reference_id: {type: Number},
	verification_id: {type: String},
	img_url: {type: String},
	status: {type: String},
	liveliness: {type: Boolean},
	score: {type: Number},
})

const NameMatchSchema = new Schema({
	reference_id:{type: Number},
	verification_id: {type: String},
	name_1: {type: String},
	name_2: {type: String},
	status: {type: String},
	score: {type: Number},
	reason: {type: String},
});

const FaceMatchSchema = new Schema({
	reference_id:{type: Number},
	verification_id: {type: String},
	face_match_result: {type: String},
	face_match_score: {type: Number},
	status: {type: String},
})

const UserKycSchema = new Schema({
	userId : {type: String, required: true, unique: true},
	pan: {type: PanSchema, default: null},
	aadhaar: {type: AadhaarSchema, default: null},
	liveliness: {type: LivelinessSchema, default: null},
	name_match: {type: NameMatchSchema, default: null},
	face_match: {type: FaceMatchSchema, default:null}, 
});

const UserKyc = models.UserKyc || model("UserKyc", UserKycSchema);

export default UserKyc;
