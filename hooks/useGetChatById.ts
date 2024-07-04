import { db } from '@/lib/firebase';
import { Timestamp, doc, onSnapshot } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react'

interface Chat {
    startedAt: number;
    endedAt?: number;
    creatorId: string;
    clientId: string;
    messages: {
        senderId: string;
        text: string;
        createdAt: number;
        img: string;
        audio: string;
        seen: boolean;
    }[];
}

const useGetChatById = (chatId: string) => {
    const [chat, setChat] = useState<Chat>();
    const [isChatLoading, setIsChatLoading] = useState(true);

    useEffect(() => {
        if (chatId) {

            const unSub = onSnapshot(doc(db, "chats", chatId as string), (res: any) => {
                setChat(res.data());
                setIsChatLoading(false);
            });
            return () => unSub();
        }
    }, [chatId]);

    return { chat, isChatLoading }
}

export default useGetChatById
