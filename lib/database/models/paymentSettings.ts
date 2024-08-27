import { Schema, model, Document } from 'mongoose';

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
  ifsc: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountType: { type: String, required: true }
});

const PaymentSchema = new Schema<Payment>({
  userId: { type: String, required: true, unique: true },
  paymentMode: {
    type: String,
    enum: ['UPI', 'BANK_TRANSFER'],
    required: true
  },
  upiId: {
    type: String,
    required: function (this: Payment) {
      return this.paymentMode === 'UPI';
    }
  },
  bankDetails: {
    type: BankDetailsSchema,
    required: function (this: Payment) {
      return this.paymentMode === 'BANK_TRANSFER';
    }
  }
});

const PaymentModel = model<Payment>('Payment', PaymentSchema);

export default PaymentModel;
