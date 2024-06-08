import mongoose, { Schema, model, models } from "mongoose";

// Define the feedback entry schema
const FeedbackEntrySchema = new Schema(
	{
		clientId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Client",
			required: true,
		},
		rating: { type: Number, required: true },
		feedback: { type: String, required: true },
		createdAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

// Define the call feedback schema
const CallFeedbackSchema = new Schema(
	{
		callId: {
			type: String,
			required: true,
			unique: true, // Ensure callId is unique
		},
		creatorId: {
			type: String,
			required: true,
		},
		feedbacks: [FeedbackEntrySchema],
	},
	{
		timestamps: true,
	}
);

// Check if the model already exists before defining it
const CallFeedbacks =
	models.CallFeedbacks || model("CallFeedbacks", CallFeedbackSchema);

export default CallFeedbacks;
