import { Schema, model, models } from "mongoose";

const TransactionSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			required: true,
			refPath: "userType",
		},
		userType: { type: String, required: true, enum: ["Client", "Creator"] },
		amount: { type: Number, required: true },
		type: { type: String, required: true, enum: ["credit", "debit"] },
		method: {type: String},
	},
	{
		timestamps: true,
	}
);

const Transaction =
	models.Transaction || model("Transaction", TransactionSchema);

export default Transaction;
