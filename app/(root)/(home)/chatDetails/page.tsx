// pages/chatDetails.tsx

'use client'

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatDetails from "@/components/chat/ChatDetails";
import { SelectedChat } from "@/types";

const ChatDetailsPage = () => {
    const [creatorId, setCreatorId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const creatorId = params.get('creatorId');

        setCreatorId( creatorId );
    }, []);

    if (!creatorId) {
        return <div>Loading...</div>; // Show a loading indicator or message
    }

    return (
        < ChatDetails creatorId={creatorId? creatorId: null} />
    );
}

export default ChatDetailsPage;
