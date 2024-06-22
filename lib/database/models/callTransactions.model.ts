import { Schema, Document, model, models } from "mongoose";

// Define the interface for the elements inside the callDetails array
interface ICallDetail {
	amountPaid: number;
	isDone: boolean;
	callDuration: number;
	createdAt: Date;
	updatedAt: Date;
}

interface ICallTransactions extends Document {
	callId: string;
	callDetails: ICallDetail[];
	createdAt: Date;
	updatedAt: Date;
}

const CallDetailSchema: Schema = new Schema({
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
	createdAt: {
		type: Date,
		require: true
	},
	updatedAt: {
		type: Date,
		require: true
	},

});

const CallTransactionsSchema: Schema = new Schema(
	{
		callId: {
			type: String,
			required: true,
			unique: true,
		},
		callDetails: {
			type: [CallDetailSchema], // Array of CallDetailSchema objects
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

const CallTransactions =
	models.CallTransactions || model<ICallTransactions>("CallTransactions", CallTransactionsSchema);

export default CallTransactions;
