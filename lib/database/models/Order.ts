import mongoose, { Document, Model, Schema } from 'mongoose';

interface IOrder extends Document {
  order_id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

const OrderSchema: Schema = new Schema({
  order_id: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  receipt: { type: String, required: true },
  status: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
