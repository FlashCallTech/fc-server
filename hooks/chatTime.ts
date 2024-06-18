import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Timestamp, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Chat {
    startedAt: number;
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

const chatTime = () => {
    const { chatId } = useParams();
    const [chat, setChat] = useState<Chat | undefined>();
    const [startedAt, setStartedAt] = useState<number>()
    const [creator, setCreator] = useState();

    useEffect(() => {
        const storedCreator = localStorage.getItem("currentCreator");
        if (storedCreator) {
            setCreator(JSON.parse(storedCreator));
        }
    }, []);

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "chats", chatId as string), (res: any) => {
            setChat(res.data());
        });

        return () => unSub();
    }, [chatId]);

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "chats", chatId as string), (res: any) => {
            setStartedAt(res.data().startedAt as number);
        });

        return () => unSub();
    }, [chatId]);

    

    return { creator, startedAt };


}

export default chatTime
