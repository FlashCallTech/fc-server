import pkg from "mongoose";
const { Schema, model, models } = pkg;

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
		category: { type: String, default: "Call Transaction" },
		method: { type: String },
		callType: { type: String },
	},
	{
		timestamps: true,
	}
);

const Transaction =
	models.Transaction || model("Transaction", TransactionSchema);

export default Transaction;
