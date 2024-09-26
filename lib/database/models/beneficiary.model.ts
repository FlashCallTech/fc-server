import { Schema, model, models, Document } from 'mongoose';

interface BeneficiaryInstrumentDetails {
  bank_account_number: string;
  bank_ifsc: string;
  vpa: string;
}

interface BeneficiaryContactDetails {
  beneficiary_phone: string;
}

interface BeneficiaryDocument extends Document {
  user_id: string;
  beneficiary_id: string;
  beneficiary_name: string;
  beneficiary_instrument_details: BeneficiaryInstrumentDetails;
  beneficiary_contact_details: BeneficiaryContactDetails;
  beneficiary_status: string;
  added_on: String;
}

const BeneficiaryInstrumentDetailsSchema = new Schema<BeneficiaryInstrumentDetails>({
  bank_account_number: { type: String, unique: true, sparse: true },
  bank_ifsc: { type: String, unique: true, sparse: true },
  vpa: { type: String, unique: true, sparse: true }
}, { _id: false });

const BeneficiaryContactDetailsSchema = new Schema<BeneficiaryContactDetails>({
  beneficiary_phone: { type: String, required: true },
}, { _id: false });

const BeneficiarySchema = new Schema<BeneficiaryDocument>({
  user_id: {type: String, required: true},
  beneficiary_id: { type: String, required: true, unique: true },
  beneficiary_name: { type: String, required: true },
  beneficiary_instrument_details: { type: BeneficiaryInstrumentDetailsSchema },
  beneficiary_contact_details: { type: BeneficiaryContactDetailsSchema },
  beneficiary_status: { type: String, required: true },
  added_on: { type: String, required: true }
});

const Beneficiary = models.Beneficiary || model<BeneficiaryDocument>('Beneficiary', BeneficiarySchema);

export default Beneficiary;
