'use client'
import React, { useEffect, useState } from 'react';
import Loader from '../shared/Loader';

const KycForm: React.FC = () => {
  const [formLink, setFormLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFormStatus = async () => {
      try {
        const formResponse = await fetch('/api/get-form-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            verification_id: 'chirag1'
          })
        });

        const formStatus = await formResponse.json();
        const status = formStatus.data.form_status
        console.log(formStatus.data.form_status)
        console.log(formStatus.data.form_link);

        if (status === 'RECEIVED') {
          setFormLink(formStatus.data.form_link);
        } else {
          setFormLink(null);
        }
      } catch (error) {
        console.error('Error fetching form status:', error);
      }
    };

    getFormStatus(); // Call the async function
    setLoading(false);
  }, []);

  const handleKyc = async () => {
    try {
      const formResponse = await fetch('/api/kyc-form', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Chirag Goel',
          phone: "8791194073",
          template_name: 'Test',
          verification_id: 'chirag1'
        })
      });

      const formResult = await formResponse.json();

      if (formResult.data?.form_link) {
        setFormLink(formResult.data.form_link);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // console.log(formLink)
  if(loading){
    return <Loader/>
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
