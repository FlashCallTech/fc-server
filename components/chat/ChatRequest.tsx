'use client'
import React, { useEffect } from 'react';
import useChatRequest from '@/hooks/useChatRequest';
import Image from 'next/image';
import { trackEvent } from '@/lib/mixpanel';
import { useCurrentUsersContext } from '@/lib/context/CurrentUsersContext';
import usePlatform from '@/hooks/usePlatform';

const ChatRequest = ({ chatRequest }: { chatRequest: any }) => {
  const { handleAcceptChat, handleRejectChat } = useChatRequest();
  const { creatorUser } = useCurrentUsersContext();
  const { getDevicePlatform } = usePlatform();

  useEffect(() => {
    if(!chatRequest) {
      return
    }
    trackEvent('Creator_Chat_Initiated', {
      Creator_ID: chatRequest.creatorId,
      Creator_First_Seen: creatorUser?.createdAt?.toString().split('T')[0],
      Platform: getDevicePlatform(),
      Client_ID: chatRequest.clientId
    })
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      {/* Mobile Layout */}
      <div className="flex flex-col justify-between bg-gray-800 text-white p-6 h-screen w-screen lg:hidden">
        <div className="flex flex-col gap-20 items-center justify-between">
          <h2 className="text-lg font-medium mb-2">Incoming Chat Request</h2>
          <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <span className="text-2xl">👤</span>
          </div>
          <p className="text-xs mb-6 text-center">
            Chat from <br />
            <strong className="text-lg">{chatRequest.clientName}</strong>
          </p>
        </div>
        <div className="flex justify-between p-8">
          <div className='flex flex-col gap-2'>
            <button
              onClick={() => handleRejectChat(chatRequest)}
              className="bg-red-500 text-white p-4 rounded-full hover:bg-red-600 transition"
            >
              <Image src={'/reject.svg'} width={0} height={0} alt='reject' className='w-auto h-auto' />
            </button>
            <span className='text-center'>Reject</span>
          </div>
          <div className='flex flex-col gap-1'>
            <button
              onClick={() => handleAcceptChat(chatRequest)}
              className="bg-green-500 text-white p-4 rounded-full hover:bg-green-600 transition"
            >
              <Image src={'/accept.svg'} width={0} height={0} alt='reject' className='w-auto h-auto' />
            </button>
            <span className='text-center'>Accept</span>
          </div>
        </div>
      </div>

      {/* Laptop and Larger Screens Layout */}
      <div className="hidden lg:flex lg:flex-col items-center bg-gray-800 text-white w-80 rounded-lg shadow-lg p-6">
        <div className="flex flex-col items-center">
          <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <span className="text-2xl">👤</span>
          </div>
          <h2 className="text-lg font-semibold mb-2">Incoming Chat Request</h2>
          <p className="text-sm mb-6">Chat from <strong>{chatRequest.clientName}</strong></p>
        </div>
        <div className="flex justify-between w-full">
          <button
            onClick={() => handleRejectChat(chatRequest)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Decline
          </button>
          <button
            onClick={() => handleAcceptChat(chatRequest)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRequest;