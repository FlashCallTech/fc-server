import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, phone } = await request.json();

    const paymentSettingsResponse = await fetch(`http://localhost:3000/api/v1/creator/getPayment?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    const paymentSettingsResult = await paymentSettingsResponse.json();

    if (paymentSettingsResult.success) {
      const kycResponse = await fetch(`/api/v1/userkyc/getKyc?userId=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const kycResult = await kycResponse.json();

      if (kycResult.success) {
        const getBeneficiary = await fetch(`http://localhost:3000/api/v1/beneficiary/getBeneficiary?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Content-type': 'application/json'
          },
        })

        const getBeneficiaryResult = await getBeneficiary.json();

        if (getBeneficiaryResult.success) {
          const payload = {
            transfer_id: 'transfer8',
            transfer_amount: 2,
            transfer_mode: paymentSettingsResult.data.paymentMode === 'UPI' ? 'upi' : 'banktransfer',
            beneficiary_details: {
              beneficiary_id: getBeneficiaryResult.data.beneficiary_id,
              beneficiary_name: getBeneficiaryResult.data.beneficiary_name,
              beneficiary_instrument_details: paymentSettingsResult.data.paymentMode === 'UPI' ? {
                vpa: getBeneficiaryResult.data.beneficiary_instrument_details.vpa
              } : {
                bank_account_number: getBeneficiaryResult.data.beneficiary_instrument_details.bank_account_number,
                bank_ifsc: getBeneficiaryResult.data.beneficiary_instrument_details.bank_ifsc
              },
              beneficiary_contact_details: {
                beneficiary_phone: phone
              }
            },
            fundsource_id: 'CASHFREE_65828'
          }

          const response = await fetch('https://api.cashfree.com/payout/transfers', {
            method: 'POST',
            headers: {
              'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
              'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
              'x-api-version': '2024-01-01',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });

          const result = await response.json();

          if (!response.ok) {
            return NextResponse.json({ success: false, message: result.message });
          }
          if (result.status === 'SUCCESS')
            return NextResponse.json({ success: true, data: result });
          else if (result.status === 'RECEIVED')
            return NextResponse.json({success: true, data: result, message: 'RECEIVED'});
          else if (result.status === 'APPROVAL_PENDING')
            return NextResponse.json({ success: true, data: result, message: 'APPROVAL_PENDING' });
          else if (result.status === 'PENDING')
            return NextResponse.json({ success: true, data: result, message: 'PENDING' });
          else {
            if (result.status === 'FAILED')
              return NextResponse.json({ success: false, message: 'IMPS_MODE_FAILED' });
            else if (result.status === 'REJECTED')
              return NextResponse.json({ success: false, message: 'INVALID_MODE_FOR_PYID' });
            return NextResponse.json({ success: false, message: result });
          }

          return NextResponse.json({success: true, data: payload});
        } else {
          return NextResponse.json({ success: false, error: getBeneficiaryResult, message: 'Beneficiary Not Found' });
        }
      } else {
        return NextResponse.json({ success: false, error: kycResult, message: 'KYC Verification Not Completed' });
      }
    } else {
      return NextResponse.json({ success: false, error: paymentSettingsResult, message: 'Payment Setting Not Found' });
    }


  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message })
  }
}