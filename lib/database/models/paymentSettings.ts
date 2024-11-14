import { Schema, model, models, Document } from 'mongoose';

interface BankDetails {
  ifsc: string;
  accountNumber: string;
  accountType: string;
}

interface PaymentSettings extends Document {
  userId: string;
  paymentMode: 'UPI' | 'BANK_TRANSFER';
  upiId?: string;
  bankDetails?: BankDetails;
}

const BankDetailsSchema = new Schema<BankDetails>({
  ifsc: { type: String, unique: true, sparse: true },
  accountNumber: { type: String, unique: true, sparse: true},
  accountType: { type: String }
}, { _id: false });

// Create a partial index to enforce uniqueness on `ifsc` and `accountNumber` when they are not null
BankDetailsSchema.index({ ifsc: 1 }, { unique: true, partialFilterExpression: { ifsc: { $ne: null } } });
BankDetailsSchema.index({ accountNumber: 1 }, { unique: true, partialFilterExpression: { accountNumber: { $ne: null } } });

const PaymentSettingsSchema = new Schema<PaymentSettings>({
  userId: { type: String, required: true, unique: true },
  paymentMode: {
    type: String,
    enum: ['UPI', 'BANK_TRANSFER'],
    required: true
  },
  upiId: {
    type: String,
    required: false,  // No conditional requirement here
    unique: true,
    sparse: true
  },
  bankDetails: {
    type: BankDetailsSchema,
    required: false  // No conditional requirement here
  }
});

// Create a partial index to enforce uniqueness on `upiId` when it is not null
PaymentSettingsSchema.index({ upiId: 1 }, { unique: true, partialFilterExpression: { upiId: { $ne: null } } });

console.log(models);

// Ensure the model is only compiled once
const PaymentSettingsModel = models.PaymentSettings || model<PaymentSettings>('PaymentSettings', PaymentSettingsSchema);

export default PaymentSettingsModel;
