import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';

interface Chat {
    createdAt: Timestamp;
    endedAt: Timestamp;
    messages: {
        senderId: string;
        text: string;
        createdAt: Timestamp;
        img: string;
        audio: string;
        seen: boolean;
    }[];
}

const useChat = () => {
    const [chat, setChat] = useState<Chat | undefined>();
    const [chatEnded, setChatEnded] = useState(false);
    const { chatId } = useParams();
    const router = useRouter();

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "chats", chatId as string), (res: any) => {
            setChat(res.data());
            setChatEnded(res.data()?.status === "ended");
        });

        return () => unSub();
    }, [chatId]);

    useEffect(() => {
        if (chatEnded) {
            router.replace('/chat-ended');
        }
    }, [chatEnded, router]);

    const markMessagesAsSeen = async () => {
        if (!chatId) return;

        try {
            const chatRef = doc(db, "chats", chatId as string);
            const chatSnapshot = await getDoc(chatRef);
            if (chatSnapshot.exists()) {
                const chatData = chatSnapshot.data();
                chatData.messages.forEach((message: { seen: boolean; }) => {
                    if (!message.seen) {
                        message.seen = true;
                    }
                });

                await updateDoc(chatRef, {
                    messages: chatData.messages,
                });
            }
        } catch (error) {
            console.error("Error marking messages as seen:", error);
        }
    };

    return { chat, markMessagesAsSeen };
};

export default useChat;
