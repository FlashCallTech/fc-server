'use client'
import React, { useEffect, useState } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import { ChatTimerProvider } from '@/lib/context/ChatTimerContext';

const Page = () => {
    const [queryParams, setQueryParams] = useState<{ clientId: string | null, creatorId: string | null }>({ clientId: null, creatorId: null });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const clientId = params.get('clientId');
        const creatorId = params.get('creatorId');

        setQueryParams({ clientId, creatorId });
    }, []);

    if (!queryParams.clientId || !queryParams.creatorId) {
        return null; // or Loading indicator or some error handling
    }

    return (
        <div>
            <ChatTimerProvider
                clientId={queryParams.clientId as string}
                creatorId={queryParams.creatorId as string}
            >
                <ChatInterface />
            </ChatTimerProvider>
        </div>
    );
};

export default Page;
