'use client'
import { useCurrentUsersContext } from '@/lib/context/CurrentUsersContext';
import React, { useState } from 'react';

const ReferralLink: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const { currentUser } = useCurrentUsersContext();

  const referralLink = 'https://app.flashcall.me/chiragbaba/chiragbaba@creator';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
    }).catch((error) => {
      console.error('Failed to copy the referral link:', error);
    });
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-semibold">Refer Friends</h3>
      <div className="flex items-center mt-3">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-1 p-2 border rounded-md border-gray-300 mr-2 text-lg"
        />
        <button 
          onClick={handleCopy} 
          className={`py-2 px-4 rounded-md ${copied ? 'bg-green-500' : 'bg-blue-500'} text-white border-none cursor-pointer`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {copied && <span className="mt-2 text-green-500">Referral link copied to clipboard!</span>}
    </div>
  );
};

export default ReferralLink;
