import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const usePayout = () => {
  const { creatorUser } = useCurrentUsersContext();
  const [beneficiary_details, setBeneficiary_details] = useState<any>();
  const [transfer_details, setTransfer_details] = useState<any>();
  const [loadingTransfer, setLoading] = useState<boolean>(false);
  const router = useRouter();


  const initiateWithdraw = async (creatorId: string, phone: string) => {
    setLoading(true);
    const response = await fetch('/api/v1/transfer/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: creatorId,
        phone
      })
    });
    
    const result = await response.json();
    console.log(result);
    setLoading(false);
  }


  return { initiateWithdraw, loadingTransfer };
}

export default usePayout
