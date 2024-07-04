// pages/chatDetails.tsx

'use client'

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatDetails from "@/components/chat/ChatDetails";
import { SelectedChat } from "@/types";

const ChatDetailsPage = () => {
    const searchParams = useSearchParams();
    const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);

    useEffect(() => {
        const chatData = searchParams.get('selectedChat');
        if (chatData) {
            setSelectedChat(JSON.parse(decodeURIComponent(chatData)));
        }
    }, [searchParams]);

    if (!selectedChat) {
        return <div>Loading...</div>; // Show a loading indicator or message
    }

    return (
        <ChatDetails selectedChat={selectedChat} />
    );
}

export default ChatDetailsPage;
