import { NextRequest, NextResponse } from "next/server";
import Beneficiary from '@/lib/database/models/beneficiary.model'; // Adjust the import path as needed
import PaymentModel from "@/lib/database/models/paymentSettings";
import Transaction from "@/lib/database/models/transaction.model";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      throw new Error("User ID is required");
    }

    const beneficiary = await Beneficiary.findOne({ user_id: userId });
    const paymentDetails = await PaymentModel.findOne({ userId });

    if (beneficiary === null) {
      const getUserResponse = await fetch('http://localhost:3000/api/v1/creator/getUserById', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId
        })
      });
      const user = await getUserResponse.json();
      console.log(user);

      if (user) {
        const beneficiary_id = userId;
        const beneficiary_contact_details = {
          beneficiary_phone: user.phone
        }

        const beneficiaryResponse = await fetch('https://api.cashfree.com/payout/beneficiary', {
          method: 'POST',
          headers: {
            'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
            'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
            'x-api-version': ' 2024-01-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            beneficiary_id,
            beneficiary_name: user.firstName + ' ' + user.lastName,
            beneficiary_instrument_details: {
              vpa: paymentDetails.upiId
            },
            beneficiary_contact_details,

          })
        })

        const beneficiaryResult = await beneficiaryResponse.json();

        if (!beneficiaryResponse.ok) {
          throw new Error(beneficiaryResult.message);
        }

        if (beneficiaryResult.beneficiary_status === 'VERIFIED') {
          const payload = {
            user_id: userId,
            beneficiary_id: beneficiaryResult.beneficiary_id,
            beneficiary_name: beneficiaryResult.beneficiary_name,
            beneficiary_status: beneficiaryResult.beneficiary_status,

            beneficiary_contact_details: beneficiary_contact_details,
            added_on: beneficiaryResult.added_on,
          }
          const postBeneficiaryResponse = await fetch('http:/localhost:3000/api/v1/beneficiary/postBeneficiary', {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({payload})
          })

          const postBeneficiaryResult = await postBeneficiaryResponse.json();

          if (!postBeneficiaryResult.success) {
            throw new Error(postBeneficiaryResult.message)
          }

          return NextResponse.json({ success: true, data: postBeneficiaryResult.data });
        }

        return NextResponse.json({ success: false, message: 'Beneficiary is not verified' })

      } else {
        throw new Error('Failed to create beneficiary');
      }
    }

    const payload = {
      transfer_id: "transfer4",
      transfer_amount: 2.00,
      transfer_mode: paymentDetails.paymentMode === "UPI" ? 'upi' : 'backtransfer',
      beneficiary_details: {
        beneficiary_id: beneficiary.beneficiary_id,
        beneficiary_name: beneficiary.beneficiary_name,
        beneficiary_instrument_details: paymentDetails.paymentMode === "UPI" ? {
          vpa: paymentDetails.upiId
        } : {
          bank_account_number: paymentDetails.accountNumber,
          bank_ifsc: paymentDetails.ifsc
        }
      }
    };
    
    const transferResponse = await fetch('https://api.cashfree.com/payout/transfers', {
      method: 'POST',
      headers: {
        'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
        'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
        'x-api-version': ' 2024-01-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const transferResult = await transferResponse.json();

    if (!transferResponse.ok) {
      throw new Error(transferResult.message);
    }

    if (transferResult.success === 'SUCCESS') {
      await Transaction.create({
        userId: userId,
        userType: 'Creator',
        amount: 1,
        type: "debit",
      })

      return NextResponse.json({ success: true, data: transferResult });
    } else {
      return NextResponse.json({success: false, status: transferResult.status, message: transferResult.status_description});
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, message: (error as Error).message });
  }
}
