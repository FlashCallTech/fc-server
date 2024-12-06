import pkg, { Types } from "mongoose";
import { Schema, model, models } from "mongoose";

const NotificationConsentSchema = new Schema(
	{
		creatorId: {
			type: Types.ObjectId,
			ref: "Creator",
			required: true,
		},
		clients: [
			{
				clientId: {
					type: Types.ObjectId,
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

const NotificationConsent =
	models.NotificationConsent ||
	model("NotificationConsent", NotificationConsentSchema);

export default NotificationConsent;
