import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

const usePayout = () => {
  const { creatorUser } = useCurrentUsersContext();
  const [beneficiary_details, setBeneficiary_details] = useState<any>();
  const [transfer_details, setTransfer_details] = useState<any>();
  const router = useRouter();


  const initiateWithdraw = async (creatorId: string) => {
    const response = await fetch(`/api/v1/creator/getPayment?userId=${creatorId}`,);
    const result = await response.json();
    if (result.success) {
      const method = result.data.paymentMode === "BANK_TRANSFER" ? "banktransfer" : "upi";
      if (method === 'upi') {
        const details = {
          method,
          vpa: result.data.upiId
        }
        setTransfer_details(details);
      }
      else if (method === 'banktransfer') {
        const details = {
          method,
          bank_account_number: result.data.bank_account_number,
          bank_ifsc: result.data.ifsc
        }
        setTransfer_details(details);
      }
    } else {
      alert('Complete your Payment Settings')
      router.push('/payment-settings');
      return;
    }
    const kycResponse = await fetch(
      `/api/v1/userkyc/getKyc?userId=${creatorId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const kycResult = await kycResponse.json();
    if (!kycResult.success) {
      alert('Complete KYC Verification');
      router.push('/kyc');
      return;
    } else {
      if (kycResult.data.kyc_status === 'FAILED' || kycResult.data.kyc_status === 'PENDING') {
        alert('Complete KYC Verification');
        router.push('/kyc');
        return;
      }
    }


    const getBeneficiaryResponse = await fetch(`/api/v1/beneficiary/getBeneficiary?user_id=${creatorId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    const getBeneficiaryResult = await getBeneficiaryResponse.json();
    if (getBeneficiaryResult.success) {
      if (getBeneficiaryResult.data.beneficiary_status !== 'VERIFIED') {
        const beneficiary_id = creatorId + '2';
        const beneficiaryResponse = await fetch('/api/v1/beneficiary/create-beneficiary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            beneficiary_id,
            beneficiary_name: creatorUser?.firstName + ' ' + creatorUser?.lastName,
            phone: creatorUser?.phone
          })
        })

        const beneficiaryResult = await beneficiaryResponse.json();

        if (beneficiaryResult.success && beneficiaryResult.data.beneficiary_status === 'VERIFIED') {
          const payload = {
            user_id: creatorId,
            beneficiary_id,
            beneficiary_name: creatorUser?.firstName + ' ' + creatorUser?.lastName,
            beneficiary_status: beneficiaryResult.data.beneficiary_status,
            added_on: beneficiaryResult.data.added_on,
          }
          const postBeneficiaryResponse = await fetch('/api/v1/beneficiary/post-beneficiary', {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              payload
            })
          })
        }
      }
      else {
        setBeneficiary_details(getBeneficiaryResult.data)
      }
      setTimeout(() => {

        const transferResponse = fetch('/api/v1/transfer/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transfer_id: 'transfer1',
            transfer_amount: 1,
            beneficiary_details,
          })
        })

      }, 10);
    }
  }

  return { initiateWithdraw };
}

export default usePayout
