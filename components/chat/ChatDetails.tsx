'use client'

import { SelectedChat } from "@/types";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import ContentLoading from "../shared/ContentLoading";
import { formatDateTime } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface ChatDetailsProps {
    selectedChat: SelectedChat;
}

const ChatDetails: React.FC<ChatDetailsProps> = ({ selectedChat }) => {
    const { user } = useUser();
    const [chats, setChats] = useState<SelectedChat[]>([]);
    const [loading, setLoading] = useState(true);
    const [chatsCount, setChatsCount] = useState(8);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
                setChatsCount((prevCount) => prevCount + 6);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    useEffect(() => {
        const getChats = async () => {
            try {
                const response = await fetch(
                    `/api/v1/chats/getUserChats?userId=${String(user?.publicMetadata?.userId)}`
                );
                const data = await response.json();
                setChats(data);
            } catch (error) {
                console.warn(error);
            } finally {
                setLoading(false); // Set loading to false after data is fetched
            }
        };

        getChats();
    }, [user]);

    const visibleChats = chats.slice(0, chatsCount);

    const formatDuration = (duration: number | undefined) => {
        const minutes = Math.floor(duration! / 60000);
        const seconds = Math.floor((duration! % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }

    if (loading) {
        return (
            <section className="w-full h-full flex items-center justify-center">
                <ContentLoading />
            </section>
        );
    }

    return (
        <section
            className={`grid grid-cols-1 ${chats.length > 0 && "xl:grid-cols-2 3xl:grid-cols-3"
                } items-center gap-5 xl:gap-10 w-full h-fit text-black px-4`}
        >
            {selectedChat.chatDetails.map((chat, index) => {
                const formattedDate = formatDateTime(chat.startedAt as Date);
                const duration = formatDuration(chat.duration)
                return (
                    <div
                        key={index}
                        className={`flex h-full w-full items-start justify-between pt-2 pb-4 xl:max-w-[568px] border-b xl:border xl:rounded-xl xl:p-4 xl:shadow-md border-gray-300 ${pathname.includes("/profile") && "mx-auto"
                            }`}
                    >
                        <div className="w-1/2 flex flex-col items-start justify-between h-full gap-2">
                            <span className="text-sm text-[#A7A8A1] pr-1 pt-1 whitespace-nowrap">
                                {formattedDate.dateTime}
                            </span>
                            <span
                                className={`text-sm ${chat.status === "ended"
                                    ? "text-green-1"
                                    : "text-red-500"
                                    }`}
                            >
                                {chat.status}
                            </span>
                        </div>
                        {chat.status === "ended" && (
                            <div>
                                <span className="text-sm text-[#A7A8A1] pr-1 pt-1 whitespace-nowrap">
                                    {duration}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </section>
    )
}

export default ChatDetails
