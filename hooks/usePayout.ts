import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useState } from "react";

const usePayout = () => {
  const { creatorUser } = useCurrentUsersContext();
  const [haveBeneficiary, setHaveBeneficiary] = useState<boolean>(false);
  const initiateWithdraw = async (creatorId: string) => {
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
      const transferResponse = fetch('/api/v1/transfer/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          
        })
      })
    }
  }

  return { initiateWithdraw };
}

export default usePayout
