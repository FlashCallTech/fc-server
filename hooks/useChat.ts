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
    const [user2, setUser2] = useState<User2>();
    const { chatId } = useParams();
    const router = useRouter();

    useEffect(() => {
		const storedUser = localStorage.getItem("user2");
		if (storedUser) {
			setUser2(JSON.parse(storedUser));
		}
	}, []);

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

    const handleEnd = async (chatId: string | string[], user2: User2 | undefined) => {
        try {
            await updateDoc(doc(db, "chats", chatId as string), {
                endedAt: new Date(),
                status: "ended",
            });
            await updateDoc(doc(db, "userchats", user2?.clientId as string), {
                online: false,
            });
            await updateDoc(doc(db, "userchats", user2?.creatorId as string), {
                online: false,
            });
    
            // await updateDoc(doc(db, "chatRequests", user2?.request as string), {
            // 	duration: getTime(chat?.createdAt!, chat?.endedAt!),
            // });
            
        } catch (error) {
            console.error("Error ending chat:", error);
        }
    };

    return { chatId, user2, chat, markMessagesAsSeen, handleEnd };
};

export default useChat;
