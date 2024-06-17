import { Schema, Document, model, models } from "mongoose";

interface ICallTransaction extends Document {
	callId: string;
	amountPaid: number;
	isDone: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const CallTransactionSchema: Schema = new Schema(
	{
		callId: {
			type: String,
			required: true,
			unique: true,
		},
		amountPaid: {
			type: Number,
			required: true,
		},
		isDone: {
			type: Boolean,
			required: true,
			default: false,
		},
		callDuration: {
			type: Number,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

const CallTransaction =
	models.CallTransaction || model("CallTransaction", CallTransactionSchema);

export default CallTransaction;
