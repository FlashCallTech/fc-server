"use client";
import Loader from "@/components/shared/Loader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { backendBaseUrl } from "@/lib/utils";
import * as Sentry from "@sentry/nextjs";
import axios from "axios";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const ReferralLink: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const { creatorUser } = useCurrentUsersContext();
  const [data, setData] = useState<any>();
  const [referralLink, setReferralLink] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const referralId = creatorUser?.referralId as string;

  useEffect(() => {
    const getReferrals = async () => {
      const response = await fetch(`api/v1/referral?userId=${creatorUser?._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json();
      setData(result);
      setLoading(false);
    }
    const generateReferralLink = async (referralCode: string) => {
      try {
        const response = await fetch(`api/v1/dynamicLink`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ referralCode }),
        });

        const data = await response.json();
        if (data.success) {
          setReferralLink(data.data.shortLink)
        }
        console.log('Generated Dynamic Link:', data.dynamicLink);  // Use the generated link
      } catch (error) {
        console.error('Error generating dynamic link:', error);
      }
    };
    if (creatorUser) {
      getReferrals();
      generateReferralLink(creatorUser.referralId);
    }

  }, [creatorUser])

  const handleCopy = () => {
    navigator.clipboard
      .writeText(referralId)
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

  console.log(data);

  if (loading) {
    return (
      <Loader />
    )
  }

  return (
    <div className="flex justify-center xl:max-w-[80%] mx-auto h-full">
      <div className="bg-gray-100 h-full w-full flex flex-col gap-2">
        <div className="p-4 bg-gray-100 h-full w-full flex flex-col gap-2">
          {/* Header */}
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-start flex-1">Refer Friends</h3>
          </div>

          {/* Invite Card */}
          <div className="bg-green-600 text-white p-4 rounded-lg flex flex-row items-center justify-between">
            <div className="text-md font-semibold">Invite your friends to try the service</div>
            <div className="flex flex-row gap-1 justify-between">
              <button
                onClick={handleCopy}
                className={`flex flex-row gap-1 justify-center p-1 items-center px-3 rounded-full text-xs ${copied ? 'bg-green-900' : 'bg-green-800'} text-white cursor-pointer`}
              >
                {referralId}
                <Image src={'/copy.svg'} width={0} height={0} alt="copy" className="w-[12px] h-[12px]" />
              </button>
              <div className="bg-green-800 size-7 flex items-center p-2 rounded-full justify-center">
                <button onClick={handleShare}>
                  <Image src={'/send.svg'} width={1000} height={1000} alt="share" className="size-5" />
                </button>
              </div>
            </div>
          </div>

          {/* How to Refer */}
          <div className="mt-6 flex-col">
            <h4 className="font-semibold mb-2">HOW TO REFER FRIENDS?</h4>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h5 className="font-semibold text-lg">Share your Referral Link</h5>
              <p className="text-gray-600 text-sm mt-2">Invite your friends via Whatsapp or a text message.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col z-10">
            <h4 className="font-semibold mb-2">Your Referrals</h4>
            {data && Array.isArray(data) && data.length > 0 ? (
              <ul className="space-y-3">
                {data.map((referral: any, index: number) => {
                  const goal = 5000; // Set the target amount
                  const percentage = ((5000 - referral.amount) / goal) * 100; // Calculate percentage

                  return (
                    <li key={index} className="bg-white p-4 rounded-lg shadow-md">
                      <div className="flex flex-row items-center gap-5">
                        <div className="">
                          <Image src={"https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2FM_preview.png?alt=media&token=750fc704-c540-4843-9cbd-bfc4609780e0"} width={1000} height={1000} alt="image" className="size-10 min-w-10 rounded-full" />
                        </div>
                        <div className="flex flex-col w-full gap-1">
                          <div className="text-xs">{`${referral.name || 'Username'}`}</div>
                          <div className="text-xs">{`${referral.creatorId || 'CreatorId'}`}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            {/* Progress Bar */}
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }} // Dynamically set width
                            ></div>
                          </div>
                          <div className="mt-1 text-gray-600 text-xs">
                            Amount Earned: ₹{5000 - referral.amount} of ₹5000
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-600">No referrals found.</p>
            )}
          </div>
        </div>

        {/* Refer Actions */}
        <div className="mt-auto sticky bottom-0 w-full px-4 py-2 bg-gray-100 z-20 ">
          <button
            onClick={handleShare}
            className="w-full p-3 bg-green-600 text-lg text-white font-semibold rounded-lg shadow-md"
          >
            Refer Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralLink;
