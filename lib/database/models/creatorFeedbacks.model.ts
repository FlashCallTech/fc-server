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
		showFeedback: { type: Boolean, default: false },
		createdAt: { type: Date, default: Date.now },
		position: { type: Number, default: -1 },
	},
	{ _id: false }
);

// Define the call feedback schema
const CreatorFeedbackSchema = new Schema(
	{
		creatorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Creator",
			required: true,
		},
		feedbacks: [FeedbackEntrySchema],
	},

	{
		timestamps: true,
	}
);

// Check if the model already exists before defining it
const CreatorFeedback =
	models.CreatorFeedback || model("CreatorFeedback", CreatorFeedbackSchema);

export default CreatorFeedback;
