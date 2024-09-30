import { Schema, model, models } from "mongoose";

const TransferSchema = new Schema({
  userId: { type: String, required: true }, // Reference to the user initiating the transfer
  transfer_id: { type: String, unique: true },
  cf_transfer_id: { type: String },
  status: { type: String },
  status_code: { type: String },
  status_description: { type: String },
  beneficiary_details: {
    beneficiary_id: { type: String },
    beneficiary_instrument_details: {
      bank_account_number: { type: String },
      bank_ifsc: { type: String }
    }
  },
  transfer_amount: { type: Number },
  transfer_service_charge: { type: Number },
  transfer_service_tax: { type: Number },
  transfer_mode: { type: String },
  transfer_utr: { type: String },
  fundsource_id: { type: String },
  added_on: { type: Date },
  updated_on: { type: Date }
}, { timestamps: true });

const Transfer = models.Transfer || model("Transfer", TransferSchema);

export default Transfer;
