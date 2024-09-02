'use client'
import React, { useEffect, useState } from 'react';
import Loader from '../shared/Loader';
import { useCurrentUsersContext } from '@/lib/context/CurrentUsersContext';
import { useRouter } from 'next/navigation';

const KycForm: React.FC = () => {
  const { currentUser, creatorUser } = useCurrentUsersContext();
  const [formLink, setFormLink] = useState<string | null>(null);
  const [verification_id, setVerification_id] = useState<string>();
  const [kycDone, setKycDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter()

  useEffect(() => {
    if(creatorUser?.kyc_status === 'COMPLETED'){
      setKycDone(true);
      return;
    }
    const getKyc = async () => {
      const response = await fetch(`/api/v1/userkyc/getKyc?userId=${currentUser?._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const kycResponse = await response.json();
      setVerification_id(kycResponse.verification_id);
    }

    const getFormStatus = async () => {
      if(!verification_id) return;
      try {
        const formResponse = await fetch('/api/get-form-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            verification_id
          })
        });

        const formStatus = await formResponse.json();
        const status = formStatus.data.form_status;

        if(formStatus.success){
          const user = {
            kyc_status: status
          };
          const response = await fetch('/api/v1/creator/updateUser', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: currentUser?._id,
              user
            })
          })
        }

        if (status === 'RECEIVED' || status === 'PENDING') {
          setFormLink(formStatus.data.form_link);
        } else {
          setFormLink(null);
        }
      } catch (error) {
        console.error('Error fetching form status:', error);
      }
    };

    if(currentUser){
      getKyc()
      getFormStatus(); // Call the async function
      setLoading(false);
    }
  }, [verification_id]);

  const generateVerificationId = () => {
    return `${currentUser?._id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleKyc = async () => {
    const verificationId = generateVerificationId();

    try {
      const formResponse = await fetch('/api/kyc-form', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentUser?.firstName + " " + currentUser?.lastName,
          phone: currentUser?.phone.replace(/^\+91/, ''),
          template_name: 'Test',
          verification_id: verificationId,
        })
      });

      const formResult = await formResponse.json();

      if (formResult.success) {
        const response = await fetch('/api/v1/userkyc/createKyc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser?._id,
            verification_id: verificationId,
            kyc_status: formResult.data.form_status,
          })
        })

      }

      if (formResult.data?.form_link) {
        setFormLink(formResult.data.form_link);
      }
    } catch (error) {
      console.error(error);
    }
  }


  if (loading) {
    return <Loader />;
  }

  if (kycDone) {
    return <div>You have completed your KYC</div>;
  }

  return (
    <div className='flex flex-col items-center justify-center h-full w-full'>
      <button className='rounded bg-black text-white font-bold p-4 mb-4' onClick={handleKyc}>
        Start Your Kyc
      </button>

      {formLink && (
        <a href={formLink} target="_blank" rel="noopener noreferrer" className='text-blue-500 underline'>
          Complete your KYC here
        </a>
      )}
    </div>
  )
}

export default KycForm;
