"use client";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import * as Sentry from "@sentry/nextjs";
import React, { useState } from "react";

const ReferralLink: React.FC = () => {
	const [copied, setCopied] = useState(false);
	const { currentUser } = useCurrentUsersContext();

  const referralLink = `http://localhost:3000/authenticate/?userType=${'creator'}&refId=${currentUser?._id}`;

	const handleCopy = () => {
		navigator.clipboard
			.writeText(referralLink)
			.then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
			})
			.catch((error) => {
				Sentry.captureException(error);
				console.error("Failed to copy the referral link:", error);
			});
	};
	const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Invite your friends to try the service',
        text: 'Check out this awesome service! Use my referral link to sign up:',
        url: referralLink,
      }).then(() => {
        console.log('Referral link shared successfully');
      }).catch((error) => {
        console.error('Error sharing the referral link:', error);
      });
    } else {
      alert('Web Share API is not supported in your browser.');
    }
  };

  return (
    <div className="p-4 bg-gray-100 h-full flex flex-col font-helvetica">
      {/* Header */}
      <div className="flex items-center mb-6">
        <h3 className="text-lg font-semibold text-start flex-1">Refer Friends</h3>
      </div>

      {/* Invite Card */}
      <div className="bg-green-600 text-white p-4 rounded-lg flex items-center justify-between">
        <p className="text-lg font-semibold">Invite your friends to try the service</p>
        <button 
          onClick={handleCopy}
          className={`p-2 rounded-md ml-4 ${copied ? 'bg-green-900' : 'bg-green-800'} text-white cursor-pointer`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* How to Refer */}
      <div className="mt-6 flex-grow">
        <h4 className="font-semibold mb-2">HOW TO REFER FRIENDS?</h4>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h5 className="font-semibold text-lg">Share your Referral Link</h5>
          <p className="text-gray-600 text-sm mt-2">Invite your friends via Whatsapp or a text message.</p>
        </div>
      </div>

      {/* Refer Actions */}
      <div className="mt-auto">
        <button 
          onClick={handleShare} 
          className="w-full p-3 bg-green-600 text-lg font-semibold rounded-lg shadow-md bottom-0 left-0 right-0"
        >
          Refer Now
        </button>
      </div>
    </div>
  );
};

export default ReferralLink;
