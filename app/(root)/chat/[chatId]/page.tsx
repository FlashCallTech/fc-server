'use client'
import React, { useEffect, useState } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import { ChatTimerProvider } from '@/lib/context/ChatTimerContext';
import useChat from '@/hooks/useChat';
import { handleTransaction } from '@/utils/ChatTransaction';
import { useWalletBalanceContext } from '@/lib/context/WalletBalanceContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import useEndChat from '@/hooks/useEndChat';
import { useUser } from '@clerk/nextjs';

const Page = () => {
    const [queryParams, setQueryParams] = useState<{ clientId: string | null, creatorId: string | null }>({ clientId: null, creatorId: null });
    const { duration } = useChat();
    const { chatEnded, user2, chatId, handleEnd } = useEndChat();
    const {updateWalletBalance} = useWalletBalanceContext();
    const [check, setCheck] = useState(true);
    const clientId = user2?.clientId;
    const router = useRouter();
    const {toast} = useToast()
    let isTabClosing = false;
    const {user} = useUser()

    const handleTabCloseWarning = (event: BeforeUnloadEvent) => {
        // This line is necessary for the warning to appear
        event.preventDefault();
        event.returnValue = '';
        isTabClosing = true;
    };

    const handleTabClose = () => {
        if (isTabClosing) {
            handleEnd(chatId as string, user2);
        }
    };
    
    useEffect(() => {
        if(chatEnded && duration !== undefined && check && user2 && chatId && user2.clientId === user?.publicMetadata?.userId){
            handleTransaction({duration: duration? duration?.toString(): '', clientId: clientId, chatId: chatId as string, updateWalletBalance, router, toast});
            setCheck(false);
        }
    }, [chatEnded, duration])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const clientId = params.get('clientId');
        const creatorId = params.get('creatorId');

        setQueryParams({ clientId, creatorId });
    }, []);

    useEffect(() => {
        window.addEventListener('beforeunload', handleTabCloseWarning);
        window.addEventListener('unload', handleTabClose);
        return () => {
            window.removeEventListener('beforeunload', handleTabCloseWarning);
            window.removeEventListener('unload', handleTabClose);
        };
    }, [chatId, user2]);

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
