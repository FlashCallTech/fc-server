import { Schema, model, models } from "mongoose";

const WalletSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			required: true,
			unique: true,
			refPath: "userType",
		},
		userType: { type: String, required: true, enum: ["Client", "Creator"] },
		balance: { type: Number, default: 0 },
	},
	{
		timestamps: true,
	}
);

const Wallet = models.Wallet || model("Wallet", WalletSchema);

export default Wallet;
