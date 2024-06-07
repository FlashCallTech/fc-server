import mongoose, { Schema, model, models } from "mongoose";

const CallSchema = new Schema({
	callId: { type: String, required: true, unique: true },
	type: { type: String, required: true },
	members: [
		{
			clientId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Client",
				required: true,
			},
			creatorId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Creator",
				required: true,
			},
		},
	],
	startedAt: { type: Date, default: Date.now },
	endedAt: { type: Date },
});

const Call = models.Call || model("Call", CallSchema);

export default Call;
