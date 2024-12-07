import mongoose, { Schema, model, models } from "mongoose";

const NotificationSchema = new Schema(
	{
		creatorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Creator",
			required: true,
		},
		clients: [
			{
				clientId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Client",
					required: true,
				},
				consent: {
					type: Boolean,
					default: true,
				},
			},
		],
	},
	{
		timestamps: true,
	}
);

const Notification =
	models.Notification || model("Notification", NotificationSchema);

export default Notification;
