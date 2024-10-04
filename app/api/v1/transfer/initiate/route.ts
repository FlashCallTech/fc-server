import { getUserByPhone } from "@/lib/actions/creator.actions";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { userId, phone } = await request.json();

    const userResponse = await getUserByPhone(phone);
    if (userResponse.walletBalance >= 500) {
      const paymentSettingsResponse = await fetch(`https://flashcall.me/api/v1/creator/getPayment?userId=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      const paymentSettingsResult = await paymentSettingsResponse.json();

      if (paymentSettingsResult.success) {
        const kycResponse = await fetch(`https://flashcall.me/api/v1/userKyc/getKyc?userId=${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const kycResult = await kycResponse.json();

        if (kycResult.success) {
          const getBeneficiary = await fetch(`https://flashcall.me/api/v1/beneficiary/getBeneficiary?userId=${userId}`, {
            method: 'GET',
            headers: {
              'Content-type': 'application/json'
            },
          })

          const getBeneficiaryResult = await getBeneficiary.json();

          if (getBeneficiaryResult.success) {
            const transfer_id = uuidv4();
            console.log(transfer_id);
            const payload = {
              transfer_id,
              transfer_amount: 1,
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
              fundsource_id: 'CF_WALLET'
            }

            const initiateResponse = await fetch('https://api.cashfree.com/payout/transfers', {
              method: 'POST',
              headers: {
                'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
                'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
                'x-api-version': '2024-01-01',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload)
            });

            const initiateResult = await initiateResponse.json();

            if (!initiateResponse.ok) {
              return NextResponse.json({ success: false, message: initiateResult.message });
            }
            
            const response = await fetch(`https://api.cashfree.com/payout/transfers?transfer_id=${initiateResult.transfer_id}`, {
              method: 'GET',
              headers: {
                'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
                'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
                'x-api-version': '2024-01-01',
                'Content-Type': 'application/json',
              }
            })

            const result = await response.json();

            if (!response.ok) {
              return NextResponse.json({ success: false, data: result, message: result.message })
            }

            if (result.status === 'SUCCESS') {
              const amountToBePaid = result.transfer_amount;
              const payout = await fetch("https://flashcall.me/api/v1/wallet/payout", {
                method: "POST",
                body: JSON.stringify({
                  userId: userId,
                  userType: "Creator",
                  amount: amountToBePaid,
                }),
                headers: { "Content-Type": "application/json" },
              });

              const payoutResult = await payout.json();

              if (!payout.ok) {
                throw new Error(payoutResult);
              }
              return NextResponse.json({ success: true, data: result });
            }
            else if (result.status === 'RECEIVED') {
              const amountToBePaid = result.transfer_amount;
              const payout = await fetch("https://flashcall.me/api/v1/wallet/payout", {
                method: "POST",
                body: JSON.stringify({
                  userId: userId,
                  userType: "Creator",
                  amount: amountToBePaid,
                }),
                headers: { "Content-Type": "application/json" },
              });

              const payoutResult = await payout.json();

              if (!payout.ok) {
                throw new Error(payoutResult);
              }

              return NextResponse.json({ success: true, data: result, message: 'RECEIVED' });
            }
            else if (result.status === 'APPROVAL_PENDING') {
              const amountToBePaid = result.transfer_amount;
              const payout = await fetch("https://flashcall.me/api/v1/wallet/payout", {
                method: "POST",
                body: JSON.stringify({
                  userId: userId,
                  userType: "Creator",
                  amount: amountToBePaid,
                }),
                headers: { "Content-Type": "application/json" },
              });

              const payoutResult = await payout.json();

              if (!payout.ok) {
                throw new Error(payoutResult);
              }
              return NextResponse.json({ success: true, data: result, message: 'APPROVAL_PENDING' });
            }
            else if (result.status === 'PENDING') {
              const amountToBePaid = result.transfer_amount;
              const payout = await fetch("https://flashcall.me/api/v1/wallet/payout", {
                method: "POST",
                body: JSON.stringify({
                  userId: userId,
                  userType: "Creator",
                  amount: amountToBePaid,
                }),
                headers: { "Content-Type": "application/json" },
              });

              const payoutResult = await payout.json();

              if (!payout.ok) {
                throw new Error(payoutResult);
              }
              return NextResponse.json({ success: true, data: result, message: 'PENDING' });
            }
            else {
              if (result.status === 'FAILED')
                return NextResponse.json({ success: false, message: 'IMPS_MODE_FAILED' });
              else if (result.status === 'REJECTED')
                return NextResponse.json({ success: false, data: result, message: 'INVALID_MODE_FOR_PYID' });
              return NextResponse.json({ success: false, message: result });
            }
          } else {
            return NextResponse.json({ success: false, error: getBeneficiaryResult, message: 'Beneficiary Not Found' });
          }
        } else {
          return NextResponse.json({ success: false, error: kycResult, message: 'KYC Verification Not Completed' });
        }
      } else {
        return NextResponse.json({ success: false, error: paymentSettingsResult, message: 'Payment Setting Not Found' });
      }
    } else {
      return NextResponse.json({ success: false, message: 'Minimum wallet balance required is 500' });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message })
  }
}