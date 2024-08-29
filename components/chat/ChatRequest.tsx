import useChatRequest from '@/hooks/useChatRequest'
import React from 'react'

const ChatRequest = ({ chatRequest }: { chatRequest: any }) => {
  const { handleAcceptChat, handleRejectChat } = useChatRequest();

  return (
    <div className='w-screen h-screen flex items-end justify-between p-4 bg-gray-900'>
      <button 
        onClick={() => handleAcceptChat(chatRequest)} 
        className='bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600'>
        Accept
      </button>
      <button 
        onClick={() => handleRejectChat(chatRequest)} 
        className='bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600'>
        Reject
      </button>
    </div>
  )
}

export default ChatRequest;
