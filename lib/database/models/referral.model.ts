import { model, models, Schema } from "mongoose";

const ReferralSchema = new Schema({
  referralId: {type: String, required: true},
  referredBy: {type: String, required: true},
  name: {type: String},
  img: {type: String},
  creatorId: {type: String},
  referredTo: {type: String, required: true},
  amount: {type: Number, default: 5000},
});

const Referral = models.Referral || model("Referral", ReferralSchema);

export default Referral;