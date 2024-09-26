import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

const usePayout = () => {
  const { creatorUser } = useCurrentUsersContext();
  const [beneficiary_details, setBeneficiary_details] = useState<any>();
  const [transfer_details, setTransfer_details] = useState<any>();
  const [loadingTransfer, setLoading] = useState<boolean>(false);
  const router = useRouter();


  const initiateWithdraw = async (creatorId: string) => {
    setLoading(true);
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
      setLoading(false);
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
      setLoading(false);
      return;
    } else {
      if (kycResult.data.kyc_status === 'FAILED' || kycResult.data.kyc_status === 'PENDING') {
        alert('Complete KYC Verification');
        router.push('/kyc');
        setLoading(false);
        return;
      }
    }

    // const getBeneficiary = 
      
    }
  //   setLoading(false);
  //   setTimeout(() => {
  //     console.log(beneficiary_details);
  //   }, 1000);
  //   console.log(transfer_details);
  // }

  return { initiateWithdraw, loadingTransfer };
}

export default usePayout
