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

// Pre-save hook to round balance to the nearest two decimals
WalletSchema.pre("save", function (next) {
	if (this.isModified("balance")) {
		this.balance = Math.round(this.balance * 100) / 100;
	}
	next();
});

const Wallet = models.Wallet || model("Wallet", WalletSchema);

export default Wallet;
