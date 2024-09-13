// pages/chatDetails.tsx

'use client'

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatDetails from "@/components/chat/ChatDetails";
import { SelectedChat } from "@/types";
import { trackEvent } from '@/lib/mixpanel';
import { useCurrentUsersContext } from '@/lib/context/CurrentUsersContext';

const ChatDetailsPage = () => {
    const [creatorId, setCreatorId] = useState<string | null>(null);
    const { clientUser } = useCurrentUsersContext();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const creatorId = params.get('creatorId');

        setCreatorId( creatorId );
    }, []);

    useEffect(() => {
        trackEvent('OrderHistory_Profile_Clicked', {
            Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split('T')[0],
			Creator_ID: creatorId,
			Walletbalace_Available: clientUser?.walletBalance,
        })
    }, [])

    if (!creatorId) {
        return <div>Loading...</div>; // Show a loading indicator or message
    }

    return (
        < ChatDetails creatorId={creatorId? creatorId: null} />
    );
}

export default ChatDetailsPage;
