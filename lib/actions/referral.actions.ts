import { connectToDatabase } from "../database";
import Referral from "../database/models/referral.model";

export async function createReferralAction(referralData: any) {
  try {
    await connectToDatabase();

    // Validate referral data (e.g., referralId, referredBy, referredTo)
    if (!referralData.referralId || !referralData.referredBy || !referralData.referredTo) {
      return { error: "Referral data is incomplete" };
    }

    // Create a new referral document
    const newReferral = await Referral.create(referralData);

    return JSON.parse(JSON.stringify(newReferral));
  } catch (error) {
    console.error(error);
    return { error: "Internal Server Error" };
  }
}
