import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';
import { creatorUser } from '@/types';

interface Chat {
    startedAt: number;
    endedAt?: number;
    messages: {
        senderId: string;
        text: string;
        createdAt: Timestamp;
        img: string;
        audio: string;
        seen: boolean;
    }[];
}

interface User2 {
    _id: string;
    clientId: string;
    creatorId: string;
    request: string;
    fullName: string;
    photo: string;
}

const useChat = () => {
    const [chat, setChat] = useState<Chat | undefined>();
    const [chatEnded, setChatEnded] = useState(false);
    const [startedAt, setStartedAt] = useState<number>();
    const [endedAt, setEndedAt] = useState<number | undefined>();
    const [duration, setDuration] = useState<number | undefined>();
    const [amount, setAmount] = useState<number | undefined>(); // Use state for amount
    const [chatRatePerMinute, setChatRatePerMinute] = useState(0);
    const [user2, setUser2] = useState<User2 | undefined>();
    const { chatId } = useParams();
    const router = useRouter();

    useEffect(() => {
        const storedCreator = localStorage.getItem("currentCreator");
        if (storedCreator) {
            const parsedCreator: creatorUser = JSON.parse(storedCreator);
            if (parsedCreator.chatRate) {
                setChatRatePerMinute(parseInt(parsedCreator.chatRate, 10));
            }
        }
    }, [chatId]);

    useEffect(() => {
        const storedUser = localStorage.getItem("user2");
        if (storedUser) {
            setUser2(JSON.parse(storedUser));
        }
    }, [chatId]);

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "chats", chatId as string), (res: any) => {
            setChat(res.data());
            setStartedAt(res.data().startedAt as number);
            setChatEnded(res.data()?.status === "ended");
            if (res.data()?.status === "ended") {
                setEndedAt(res.data().endedAt); // Update endedAt using useState
            }
        });
        return () => unSub();
    }, [chatId]);

    useEffect(() => {
        if (chatEnded && startedAt && endedAt) {
            const chatDuration = endedAt - startedAt;
            setDuration(chatDuration);
            const chatDurationMinutes = chatDuration / (1000 * 60); // Convert milliseconds to minutes
            const calculatedAmount = chatDurationMinutes * chatRatePerMinute;
            setAmount(calculatedAmount);
        }
    }, [chatEnded, startedAt, endedAt, chatRatePerMinute]);

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
                const updatedMessages = chatData.messages.map((message: any) => ({
                    ...message,
                    seen: true,
                }));
                await updateDoc(chatRef, { messages: updatedMessages });
            }
        } catch (error) {
            console.error("Error marking messages as seen:", error);
        }
    };

    const handleEnd = async (chatId: string | string[], user2: User2 | undefined) => {
        try {
            const now = Date.now();
            await updateDoc(doc(db, "chats", chatId as string), {
                endedAt: now,
                status: "ended",
            });
            setEndedAt(now); // Update endedAt state
            await updateDoc(doc(db, "userchats", user2?.clientId as string), {
                online: false,
            });
            await updateDoc(doc(db, "userchats", user2?.creatorId as string), {
                online: false,
            });
            // transaction();
        } catch (error) {
            console.error("Error ending chat:", error);
        }
    };

    return { chatId, user2, chat, markMessagesAsSeen, handleEnd, startedAt, chatEnded, duration, amount };
};

export default useChat;
