import mongoose, { Schema, model, models } from "mongoose";

// Define the feedback entry schema
const FeedbackEntrySchema = new Schema(
	{
		creatorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Creator",
			required: true,
		},
	},
	{ _id: false }
);

// Define the call feedback schema
const Favouriteschema = new Schema(
	{
		clientId: {
			type: String,
			required: true,
		},
		favorites: [FeedbackEntrySchema],
	},
	{
		timestamps: true,
	}
);

// Check if the model already exists before defining it
const Favorites = models.Favorites || model("Favorites", Favouriteschema);

export default Favorites;
