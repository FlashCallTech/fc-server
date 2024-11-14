import { MemberRequest } from "@/types";
import { Schema, model, models, Document } from "mongoose";

interface CallDocument extends Document {
	callId: string;
	type: string;
	status: string;
	creator: string;
	members: MemberRequest[];
	startedAt: Date;
	endedAt: Date;
	duration: string;
	amount: number;
}

const CallSchema = new Schema<CallDocument>({
	callId: { type: String, required: true, unique: true },
	type: { type: String, required: true },
	status: { type: String, required: true },
	creator: { type: String, required: true },
	members: [
		{
			user_id: { type: String, required: true },
			custom: {
				name: { type: String, required: true },
				type: { type: String, required: true },
				image: { type: String, required: true },
			},
			role: { type: String, required: true },
		},
	],
	startedAt: { type: Date, default: Date.now },
	endedAt: { type: Date, default: Date.now },
	duration: { type: String },
	amount: { type: Number },
});

console.log(models)

const Call = models.Call || model<CallDocument>("Call", CallSchema);

export default Call;
