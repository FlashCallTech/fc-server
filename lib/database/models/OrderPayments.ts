import mongoose, { Schema, Document, Model } from 'mongoose';

interface Payment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string | null;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  notes: Record<string, string>;
  fee: number | null;
  tax: number | null;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  acquirer_data: Record<string, any>;
  created_at: Date;
  upi: Record<string, string>;
}

interface OrderPaymentsDocument extends Document {
  order_id: string;
  payments: Payment[];
}

const PaymentSchema = new Schema<Payment>({
  id: { type: String, required: true },
  entity: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, required: true },
  order_id: { type: String, required: true },
  invoice_id: { type: String, default: null },
  international: { type: Boolean, required: true },
  method: { type: String, required: true },
  amount_refunded: { type: Number, default: 0 },
  refund_status: { type: String, default: null },
  captured: { type: Boolean, required: true },
  description: { type: String, default: null },
  card_id: { type: String, default: null },
  bank: { type: String, default: null },
  wallet: { type: String, default: null },
  vpa: { type: String, default: null },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  notes: { type: Map, of: String, default: {} },
  fee: { type: Number, default: null },
  tax: { type: Number, default: null },
  error_code: { type: String, default: null },
  error_description: { type: String, default: null },
  error_source: { type: String, default: null },
  error_step: { type: String, default: null },
  error_reason: { type: String, default: null },
  acquirer_data: { type: Map, of: String, default: {} },
  created_at: { type: Date, required: true },
  upi: { type: Map, of: String, default: {} },
});

const OrderPaymentsSchema = new Schema<OrderPaymentsDocument>({
  order_id: { type: String, required: true, unique: true },
  payments: { type: [PaymentSchema], required: true },
});

const OrderPayments: Model<OrderPaymentsDocument> = mongoose.models.OrderPayments || mongoose.model<OrderPaymentsDocument>('OrderPayments', OrderPaymentsSchema);

export default OrderPayments;
