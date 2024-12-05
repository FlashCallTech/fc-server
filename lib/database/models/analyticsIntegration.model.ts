import { model, models, Schema, Types } from "mongoose";

const AnalyticsIntegrationSchema = new Schema({
	creator: {
		type: Types.ObjectId,
		ref: "Creator",
		required: true,
	},
	pixelId: { type: String, required: true, default: "" },
	accessToken: { type: String, required: true, default: "" },
});

const AnalyticsIntegration =
	models.AnalyticsIntegration ||
	model("AnalyticsIntegration", AnalyticsIntegrationSchema);

export default AnalyticsIntegration;
