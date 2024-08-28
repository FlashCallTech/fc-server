import { Schema, model, models, Document } from 'mongoose';

interface BankDetails {
  ifsc: string;
  accountNumber: string;
  accountType: string;
}

interface Payment extends Document {
  userId: string;
  paymentMode: 'UPI' | 'BANK_TRANSFER';
  upiId?: string;
  bankDetails?: BankDetails;
}

const BankDetailsSchema = new Schema<BankDetails>({
  ifsc: { type: String },
  accountNumber: { type: String},
  accountType: { type: String }
}, { _id: false });

const PaymentSchema = new Schema<Payment>({
  userId: { type: String, required: true, unique: true },
  paymentMode: {
    type: String,
    enum: ['UPI', 'BANK_TRANSFER'],
    required: true
  },
  upiId: {
    type: String,
    required: false  // No conditional requirement here
  },
  bankDetails: {
    type: BankDetailsSchema,
    required: false  // No conditional requirement here
  }
});

// Ensure the model is only compiled once
const PaymentModel = models.Payment || model<Payment>('Payment', PaymentSchema);

export default PaymentModel;
