import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, isSameDay } from "date-fns";
import { useToast } from "../ui/use-toast";

// Define types for chat messages and chat document data
type ChatMessage = {
    createdAt: number;
    senderId: string;
    text: string;
};

type ChatData = {
    chatId: string;
    clientId: string;
    clientImg: string;
    clientName: string;
    clientPhone: string;
    createdAt: number;
    creatorId: string;
    creatorImg: string;
    creatorName: string;
    creatorPhone: string;
    global: boolean;
    messages: ChatMessage[];
};

type Props = {
    clientId: string;
    creatorId: string;
};

const Chat: React.FC<Props> = ({ clientId, creatorId }) => {
    // State to hold the fetched chat document from helpChat collection
    const [chat, setChat] = useState<ChatData | null>(null);
    const [fetchedChat, setFetchedChat] = useState(false);
    const [text, setText] = useState<string>("");

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { toast } = useToast();


    useEffect(() => {
        const fetchChat = async () => {
            try {
                // 1. Fetch the document from userHelpChats collection.
                const userHelpChatsRef = doc(db, "userHelpChats", creatorId);
                const userHelpChatsDoc = await getDoc(userHelpChatsRef);

                if (userHelpChatsDoc.exists()) {
                    const data = userHelpChatsDoc.data();
                    const chatsArray = data.chats || [];
                    // 2. Check if any chat in the array has receiverId equal to clientId
                    const matchingChat = chatsArray.find(
                        (c: any) => c.receiverId === clientId
                    );

                    if (matchingChat && matchingChat.chatId) {
                        // 3. Fetch the corresponding helpChat document using chatId
                        activateChatListener(matchingChat.chatId);
                    } else {
                        console.log("No matching chat found for receiverId:", clientId);
                    }
                } else {
                    console.log("No userHelpChats document found for creatorId:", creatorId);
                }
            } catch (error) {
                console.error("Error fetching chat:", error);
            }
        };

        fetchChat();
    }, [clientId, creatorId]);

    const activateChatListener = async (chatId: string) => {
        try {
            const chatHelpDocRef = doc(db, "helpChat", chatId);
            const chatUnSub = onSnapshot(
                chatHelpDocRef,
                (doc) => {
                    if (doc.exists()) {
                        try {
                            const data = doc.data();
                            setChat(data as any);
                        } catch (error) {
                            console.log(error);
                        } finally {
                            setFetchedChat(true);
                        }
                    } else {
                        toast({
                            variant: "destructive",
                            title: "No such chat exists",
                            toastStatus: "negative",
                        });
                    }
                },
                (error) => {
                    // This error callback handles asynchronous errors from onSnapshot.
                    console.error("Error with onSnapshot:", error);
                    toast({
                        variant: "destructive",
                        title: "Error listening to chat",
                        toastStatus: "negative",
                    });
                }
            );
            return chatUnSub;
        } catch (error) {
            console.error("Error activating chat listener:", error);
            toast({
                variant: "destructive",
                title: "Error activating chat listener",
                toastStatus: "negative",
            });
            throw error; // Rethrow if needed, or handle it here.
        }
    };

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current && fetchedChat) {
            messagesEndRef.current.scrollIntoView();
        }
    }, [fetchedChat, chat]);

    useLayoutEffect(() => {
        if (fetchedChat) {
            scrollToBottom();
        }
    }, [fetchedChat, chat]);

    const handleSend = async () => {
        if (text === "") {
            return;
        }
        try {
            if (!chat) {
                return;
            }

            const userIDs = [chat.clientId, chat.creatorId];

            // Update each user's chat record concurrently and wait for all updates.
            await Promise.all(
                userIDs.map(async (id: string) => {
                    const userHelpChatsRef = doc(db, "userHelpChats", id);
                    const userHelpChatsSnapshot = await getDoc(userHelpChatsRef);

                    if (userHelpChatsSnapshot.exists()) {
                        const userChatsData = userHelpChatsSnapshot.data();
                        const chatIndex = userChatsData.chats.findIndex(
                            (c: any) => c.chatId === chat?.chatId
                        );

                        if (chatIndex !== -1) {
                            // Update the relevant chat data.
                            userChatsData.chats[chatIndex].lastMessage = text;
                            userChatsData.chats[chatIndex].isSeen = id === creatorId;
                            userChatsData.chats[chatIndex].updatedAt = Date.now();

                            return updateDoc(userHelpChatsRef, {
                                chats: userChatsData.chats,
                            });
                        } else {
                            console.warn(`Chat with chatId ${chat?.chatId} not found for user ${id}`);
                        }
                    }
                })
            );

            await updateDoc(doc(db, "helpChat", chat?.chatId as string), {
                messages: arrayUnion({
                    senderId: creatorId as string,
                    createdAt: Date.now(),
                    text,
                }),
            });

        } catch (error) {
            console.error(error);
        } finally {
            setText("");
            scrollToBottom();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && text.trim()) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
    };

    return (
        <div className="flex flex-col p-6">
            {/* Header Section */}
            {chat &&
                <h2 className="text-lg font-semibold mb-6">Messages</h2>
            }
            {chat?.chatId &&
                <div
                    className="w-[98%] h-[98%] rounded-lg border p-4"
                >
                    <div className="mt-auto">
                        {/* Chat Messages */}
                        {chat?.messages?.length ? (
                            <div className="z-20">
                                <div
                                    className="flex-1 p-4 overflow-y-auto"
                                    style={{ maxHeight: "calc(100vh - 200px)" }}
                                >
                                    <div className="mb-4 text-left">
                                        {chat.messages.map((message: ChatMessage, index: number) => {
                                            const isCurrentUserMessage =
                                                message.senderId === (creatorId as string);
                                            const isNextMessageDifferentSender =
                                                index < chat.messages.length - 1 &&
                                                chat.messages[index + 1].senderId !== message.senderId;
                                            const marginBottom = isNextMessageDifferentSender ? "mb-3" : "mb-1";
                                            const showDateSeparator =
                                                index === 0 ||
                                                !isSameDay(
                                                    new Date(message.createdAt),
                                                    new Date(chat.messages[index - 1]?.createdAt)
                                                );

                                            return (
                                                <React.Fragment key={`${message.createdAt}-${index}`}>
                                                    {showDateSeparator && (
                                                        <div className="flex justify-center">
                                                            <div className="text-center bg-gray-400 opacity-50 rounded-lg py-1 px-2 my-2">
                                                                <div className="text-white text-xs font-bold">
                                                                    {format(new Date(message.createdAt), "d MMM, yyyy")}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`${isCurrentUserMessage
                                                            ? "bg-[#16BC88] p-[5px] max-w-[60%] min-w-[25%] lg:max-w-[35%] w-fit rounded-lg ml-auto text-white text-sm relative"
                                                            : "bg-gray-200 p-[5px] max-w-[60%] min-w-[25%] lg:max-w-[35%] w-fit rounded-lg text-black text-sm leading-5 relative"
                                                            } ${marginBottom}`}
                                                        style={{ wordBreak: "break-word" }}
                                                    >
                                                        <div className="p-2 mb-2">
                                                            {message.text && (
                                                                <div style={{ wordBreak: "break-word" }}>
                                                                    {message.text}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div
                                                            className={
                                                                message.senderId === (creatorId as string)
                                                                    ? "w-fit flex justify-end items-center absolute bottom-1 right-1"
                                                                    : "w-full flex justify-end items-center absolute bottom-1 right-1"
                                                            }
                                                        >
                                                            <span className={`text-[10px] ${message.senderId === (creatorId as string) ? "text-white" : "text-gray-700"} mr-2`}>
                                                                {formatTime(message.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Sticky Chat Input at the Bottom */}
                    <div className="w-full z-30 px-1">
                        <div className="flex w-full p-2 bg-white rounded-lg border text-black">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                onChange={handleInputChange}
                                value={text ?? ""}
                                onKeyDown={handleKeyDown}
                                className="px-2 font-normal flex-auto bg-transparent outline-none"
                            />
                            <div className="flex flex-row items-center justify-center max-w-screen">
                                <div className="bg-black p-2 rounded-full flex items-center justify-center">
                                    <button
                                        onClick={handleSend}
                                        onContextMenu={(e) => e.preventDefault()}
                                        className="flex gap-2 text-white text-sm px-2 items-center justify-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="15.944661140441895" height="16.008665084838867" viewBox="0 0 15.944661140441895 16.008665084838867"><g transform="matrix(1,0,0,-1,0,32.017330169677734)"><path d="M15.5019,31.82826508483887Q16,31.484565084838867,15.9377,30.859565084838867L13.9455,17.85951508483887Q13.8521,17.39076508483887,13.4475,17.14076508483887Q13.0117,16.922017084838867,12.5759,17.10951508483887L8.84047,18.64076508483887L6.72374,16.328267084838867Q6.22568,15.859517084838867,5.60311,16.078267384838867Q5.01167,16.359517084838867,4.98054,17.01576508483887L4.98054,19.64076508483887Q4.98054,19.82826508483887,5.10506,19.95326508483887L10.3346,25.67201508483887Q10.5837,26.01576508483887,10.3035,26.359565084838867Q9.99222,26.64076508483887,9.61868,26.39076508483887L3.29961,20.73451508483887L0.560311,22.10951508483887Q0.0311284,22.39076508483887,0,22.98451508483887Q0,23.57826508483887,0.498054,23.89076508483887L14.4436,31.89076508483887Q15.0039,32.17206508483886,15.5019,31.82826508483887Z" fill="#FFFFFF" fill-opacity="1" /></g></svg>
                                        <span>Send</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {!chat &&
                <div className='flex border rounded-lg p-6 items-center justify-center flex-col'>
                    <div className='p-4 rounded-full bg-[#F3F4F6] mb-4'>
                        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="29.81366539001465" height="24" viewBox="0 0 29.81366539001465 24"><g transform="matrix(1,0,0,-1,0,48)"><path d="M9.68944,31.5Q13.7888,31.59375,16.5373,33.9375Q19.2857,36.2344,19.3789,39.75Q19.2857,43.2656,16.5373,45.5625Q13.7888,47.9062,9.68944,48Q5.59006,47.9062,2.84162,45.5625Q0.0931677,43.2656,0,39.75Q0.0465839,36.9844,1.86335,34.9219Q1.58385,34.2188,1.1646,33.75Q0.838509,33.32812,0.559006,33.09375Q0.419255,32.95312,0.372671,32.90625Q0.326087,32.85938,0.326087,32.85938L0.279503,32.85938Q-0.0931677,32.53125,0.0465839,32.01562Q0.232919,31.54688,0.745342,31.5Q2.32919,31.54688,3.63354,32.0625Q4.28571,32.34375,4.79814,32.625Q6.98758,31.54688,9.68944,31.5ZM20.8696,39.75Q20.7298,35.7188,17.8882,33.09375Q15,30.46875,10.8075,30.04688Q11.6925,27.375,14.2081,25.73438Q16.7236,24.046875,20.1242,24Q22.8261,24.046875,25.0155,25.125Q25.528,24.84375,26.1801,24.5625Q27.4845,24.046875,29.0683,24Q29.5807,24.046875,29.7671,24.515625Q29.9068,25.03125,29.4876,25.35938L29.4876,25.40625Q29.441,25.40625,29.441,25.40625Q29.3944,25.45312,29.2547,25.59375Q28.9752,25.82812,28.6491,26.25Q28.2298,26.76562,27.9503,27.42188Q29.7671,29.48438,29.8137,32.25Q29.7205,35.5781,27.205,37.875Q24.6894,40.1719,20.823,40.5Q20.8696,40.125,20.8696,39.75Z" fill="#9CA3AF" fill-opacity="1" /></g></svg>
                    </div>
                    <span className='text-lg font-semibold mb-1'>
                        Your Messages
                    </span>
                    <span className='text-[#6B7280]'>
                        Client will send you a message to start a chat
                    </span>
                </div>
            }
        </div>
    );
};

export default Chat;
