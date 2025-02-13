"use client"
import Loader from '@/components/shared/Loader';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUsersContext } from '@/lib/context/CurrentUsersContext';
import { db } from '@/lib/firebase';
import { format, isSameDay } from 'date-fns';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import AuthenticationSheet from '../shared/AuthenticationSheet';

interface Messages {
    senderId: string;
    text: string;
    createdAt: number;
    global?: boolean;
}

const HelpChat = () => {
    const [loading, setLoading] = useState(true);
    const [chat, setChat] = useState<any>();
    const [text, setText] = useState<string>("");
    const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);

    const { chatId } = useParams();
    const { toast } = useToast();
    const { currentUser, userType } = useCurrentUsersContext();
    const router = useRouter();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const temporaryClientId = localStorage.getItem("temporaryClientId");

    const creatorURL = localStorage.getItem("creatorURL");

    useEffect(() => {
        if (chatId) {
            const chatHelpDocRef = doc(db, "helpChat", chatId as string);
            const chatUnSub = onSnapshot(chatHelpDocRef, (doc) => {
                if (doc.exists()) {
                    try {
                        const data = doc.data();
                        setChat(data);
                    } catch (error) {
                        console.log(error);
                    } finally {
                        setLoading(false);
                    }
                } else {
                    toast({
                        variant: "destructive",
                        title: "No such chat exists",
                        toastStatus: "negative",
                    });
                }
            });
            return () => {
                chatUnSub();
            };
        }
    }, [chatId]);

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current && !loading) {
            messagesEndRef.current.scrollIntoView();
        }
    }, [chatId, loading]);

    useEffect(() => {
        if (!loading) {
            scrollToBottom();
        }
    }, [chatId, loading]);

    const handleSend = async () => {
        if (text === "") {
            return;
        }
        try {
            if (!chatId) {
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
                            (c: any) => c.chatId === chatId
                        );

                        if (chatIndex !== -1) {
                            // Update the relevant chat data.
                            userChatsData.chats[chatIndex].lastMessage = text;
                            userChatsData.chats[chatIndex].isSeen = id === (currentUser?._id ?? temporaryClientId);
                            userChatsData.chats[chatIndex].updatedAt = Date.now();

                            return updateDoc(userHelpChatsRef, {
                                chats: userChatsData.chats,
                            });
                        } else {
                            console.warn(`Chat with chatId ${chatId} not found for user ${id}`);
                        }
                    }
                })
            );

            // Update the main helpChat document with the new message.
            await updateDoc(doc(db, "helpChat", chatId as string), {
                messages: arrayUnion({
                    senderId: (currentUser?._id ?? temporaryClientId) as string,
                    createdAt: Date.now(),
                    text,
                }),
            });
        } catch (error) {
            console.error("Error in handleSend:", error);
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

    const handleEnd = () => {
        setLoading(true);
        router.replace(`${userType === "client" && creatorURL ? `${creatorURL}` : "/home"}`)
    };

    if (loading) {
        return <Loader />
    }

    console.log("currentUser...", currentUser);

    return (
        <div>
            {/* Mobile Layout */}
            <div
                className={`flex flex-col h-screen justify-between w-full overflow-y-auto scrollbar-hide bg-gray-100 md:hidden`}
            >
                <div className="fixed top-0 left-0 w-full flex flex-col z-30 md:hidden">
                    <div className='flex justify-between items-center px-4 py-[2px] border bg-white'>
                        <div className="flex items-center gap-2 py-2">
                            <Image
                                src={`${userType === "client" ? chat?.creatorPhoto ?? 'https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2FM_preview.png?alt=media&token=750fc704-c540-4843-9cbd-bfc4609780e0' : chat?.clienPhoto ?? 'https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2FM_preview.png?alt=media&token=750fc704-c540-4843-9cbd-bfc4609780e0'}`}
                                alt="profile"
                                width={1000}
                                height={1000}
                                className="size-10 min-w-10 rounded-full object-cover"
                            />
                            <div className="font-bold md:text-lg">
                                {userType === "client" ? chat?.creatorName : chat?.clientName}
                            </div>
                        </div>
                        <div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEnd}
                                    className="px-2 rounded-lg hoverScaleDownEffect border"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    </div>
                    {!currentUser &&
                        <div className='w-full text-center text-xs p-2 bg-yellow-100 text-gray-500 border-b-2 border-yellow-200'>
                            <span>Your chat will be erased if you close the browser. <br />
                                <button
                                    onClick={() => setIsAuthSheetOpen(true)}
                                    className='text-green-500'
                                >
                                    Log in
                                </button>
                                {" "} to save the chat.
                            </span>
                        </div>
                    }
                </div>


                <div className="mt-auto">
                    {/* Chat Messages */}
                    <div className="mb-[56px] z-20">
                        {chat?.messages?.length ? (
                            <div className="z-20">
                                <div
                                    className="flex-1 p-4 overflow-y-auto scrollbar-hide"
                                    style={{ maxHeight: "calc(100vh - 200px)" }}
                                >
                                    <div className="mb-4 text-left">
                                        {chat.messages.map((message: Messages, index: number) => {
                                            const isCurrentUserMessage =
                                                message.senderId === ((currentUser?._id ?? temporaryClientId) as string);
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
                                                            <div className="text-center my-2">
                                                                <div className="text-gray-600 text-xs font-bold">
                                                                    {format(new Date(message.createdAt), "d MMM, yyyy")}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`${isCurrentUserMessage
                                                            ? "bg-white px-4 py-2 shadow-sm max-w-[60%] min-w-[25%] lg:max-w-[35%] w-fit rounded-2xl  ml-auto text-black text-sm relative"
                                                            : "bg-gray-200 px-4 py-2 shadow-sm max-w-[60%] min-w-[25%] lg:max-w-[35%] w-fit rounded-2xl  text-black text-sm leading-5 relative"
                                                            } ${marginBottom}`}
                                                        style={{ wordBreak: "break-word", justifyContent: "center" }}
                                                    >
                                                        <div className="flex flex-col items-start mb-[1px]">
                                                            {message.text && (
                                                                <div style={{ wordBreak: "break-word", marginBottom: "12px" }}>
                                                                    {message.text}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div
                                                            className={
                                                                message.senderId === ((currentUser?._id ?? temporaryClientId) as string)
                                                                    ? "w-fit flex justify-end items-center absolute bottom-1 right-1"
                                                                    : "w-full flex justify-end items-center absolute bottom-1 right-1"
                                                            }
                                                        >
                                                            <span className={`text-[10px] mr-2`}>
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
                    <div
                        className="fixed bg-white bottom-0 w-full z-30 bg-cover bg-center p-safe-bottom md:hidden"
                    >
                        <div className="flex flex-row w-full gap-2 p-2">
                            <div className="flex w-full flex-row px-3 py-2 bg-white rounded-lg border border-gray-300 text-black">
                                <input
                                    type="text"
                                    placeholder="Start typing your message"
                                    onChange={handleInputChange}
                                    value={text ?? ""}
                                    onKeyDown={handleKeyDown}
                                    className="px-2 font-normal flex-auto bg-transparent outline-none"
                                />
                                <div className="flex flex-row items-center justify-center max-w-screen">
                                    <div className="bg-blue-500 p-2 rounded-full flex items-center justify-center">
                                        <button
                                            onClick={handleSend}
                                            onContextMenu={(e) => e.preventDefault()}
                                            className="flex gap-2 text-white text-sm px-2 items-center justify-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="15.944661140441895" height="16.008665084838867" viewBox="0 0 15.944661140441895 16.008665084838867"><g transform="matrix(1,0,0,-1,0,32.017330169677734)"><path d="M15.5019,31.82826508483887Q16,31.484565084838867,15.9377,30.859565084838867L13.9455,17.85951508483887Q13.8521,17.39076508483887,13.4475,17.14076508483887Q13.0117,16.922017084838867,12.5759,17.10951508483887L8.84047,18.64076508483887L6.72374,16.328267084838867Q6.22568,15.859517084838867,5.60311,16.078267384838867Q5.01167,16.359517084838867,4.98054,17.01576508483887L4.98054,19.64076508483887Q4.98054,19.82826508483887,5.10506,19.95326508483887L10.3346,25.67201508483887Q10.5837,26.01576508483887,10.3035,26.359565084838867Q9.99222,26.64076508483887,9.61868,26.39076508483887L3.29961,20.73451508483887L0.560311,22.10951508483887Q0.0311284,22.39076508483887,0,22.98451508483887Q0,23.57826508483887,0.498054,23.89076508483887L14.4436,31.89076508483887Q15.0039,32.17206508483886,15.5019,31.82826508483887Z" fill="#FFFFFF" fillOpacity="1" /></g></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Large Screen Layout */}
            <div
                className={`hidden md:flex items-center justify-center h-screen w-full bg-black`}
            >

                <div
                    className="md:w-[50%] lg:w-[70%] h-[98%] md:flex flex-col rounded-md bg-gray-100"
                >
                    <div className="flex w-full justify-between rounded-t-md items-center px-2 border bg-white">
                        <div className="flex items-center gap-2 py-2">
                            <div className="lg:flex items-center gap-2"></div>
                            <Image
                                src={`${userType === "client" ? chat?.creatorPhoto ?? 'https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2FM_preview.png?alt=media&token=750fc704-c540-4843-9cbd-bfc4609780e0' : chat?.clienPhoto ?? 'https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2FM_preview.png?alt=media&token=750fc704-c540-4843-9cbd-bfc4609780e0'}`}
                                alt="profile"
                                width={1000}
                                height={1000}
                                className="size-10 min-w-10 rounded-full object-cover"
                            />
                            <div className="font-bold md:text-lg">
                                {userType === "client" ? chat?.creatorName : chat?.clientName}
                            </div>

                        </div>
                        <div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEnd}
                                    className="px-2 rounded-lg hoverScaleDownEffect border"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    </div>
                    {!currentUser &&
                        <div className='w-full text-center text-xs p-2 bg-yellow-100 text-gray-500 border-b-2 border-yellow-200'>
                            <span>Your chat will be erased if you close the browser. <br />
                                <button
                                    onClick={() => setIsAuthSheetOpen(true)}
                                    className='text-green-500'
                                >
                                    Log in
                                </button>
                                {" "} to save the chat.
                            </span>
                        </div>
                    }
                    <div className="mt-auto overflow-y-auto scrollbar-hide">
                        {/* Chat Messages */}
                        {chat && (
                            <div className="z-20">
                                <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
                                    <div className="mb-4 text-left">
                                        {chat?.messages?.map((message: Messages, index: number) => {
                                            const isCurrentUserMessage =
                                                message.senderId === ((currentUser?._id ?? temporaryClientId) as string);
                                            const isNextMessageDifferentSender =
                                                index < chat?.messages.length - 1 &&
                                                chat?.messages[index + 1].senderId !== message.senderId;

                                            // Apply different margin if the next message is from a different sender
                                            const marginBottom = isNextMessageDifferentSender ? "mb-3" : "mb-1";
                                            // Check if this message starts a new day compared to the previous one
                                            const showDateSeparator =
                                                index === 0 ||
                                                !isSameDay(
                                                    new Date(message.createdAt),
                                                    new Date(chat?.messages[index - 1]?.createdAt)
                                                );

                                            return (
                                                <React.Fragment key={message?.createdAt}>
                                                    {showDateSeparator && (
                                                        <div className="flex justify-center ">
                                                            <div className="text-center my-2">
                                                                <div
                                                                    className={`text-gray-600 text-xs font-bold opacity-100`}
                                                                >
                                                                    {format(new Date(message.createdAt), "d MMM, yyyy")}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`${isCurrentUserMessage
                                                            ? `bg-white px-2 py-2 shadow-sm max-w-[60%] min-w-[25%] lg:max-w-[35%] w-fit rounded-2xl ml-auto text-sm relative`
                                                            : `bg-gray-200 px-2 py-2 shadow-sm max-w-[60%] min-w-[25%] lg:max-w-[35%] w-fit rounded-2xl text-sm leading-5 relative`
                                                            } ${marginBottom}`}
                                                        style={{
                                                            wordBreak: "break-word",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        {/* Message Text */}
                                                        <div className="flex flex-col items-start mb-[1px]">
                                                            {message.text && (
                                                                <div
                                                                    style={{ wordBreak: "break-word", marginBottom: "12px" }}
                                                                >
                                                                    {message.text}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div
                                                            className={
                                                                message.senderId === ((currentUser?._id ?? temporaryClientId) as string)
                                                                    ? "w-fit flex justify-end items-center absolute bottom-1 right-1"
                                                                    : "w-full flex justify-end items-center absolute bottom-1 right-1"
                                                            }
                                                        >
                                                            <span className={`text-[10px] mr-2`}>
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
                        )}
                    </div>
                    {/* Sticky Chat Input at the Bottom */}
                    <div className="w-full z-30 p-2 bg-white">
                        <div className="flex w-full p-2 bg-white rounded-lg border text-black">
                            <input
                                type="text"
                                placeholder="Start typing your message"
                                onChange={handleInputChange}
                                value={text ?? ""}
                                onKeyDown={handleKeyDown}
                                className="px-2 font-normal flex-auto bg-transparent outline-none"
                            />
                            <div className="flex flex-row items-center justify-center max-w-screen">
                                <div className="bg-blue-500 p-2 rounded-full flex items-center justify-center">
                                    <button
                                        onClick={handleSend}
                                        onContextMenu={(e) => e.preventDefault()}
                                        className="flex gap-2 text-white text-sm px-2 items-center justify-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="15.944661140441895" height="16.008665084838867" viewBox="0 0 15.944661140441895 16.008665084838867"><g transform="matrix(1,0,0,-1,0,32.017330169677734)"><path d="M15.5019,31.82826508483887Q16,31.484565084838867,15.9377,30.859565084838867L13.9455,17.85951508483887Q13.8521,17.39076508483887,13.4475,17.14076508483887Q13.0117,16.922017084838867,12.5759,17.10951508483887L8.84047,18.64076508483887L6.72374,16.328267084838867Q6.22568,15.859517084838867,5.60311,16.078267384838867Q5.01167,16.359517084838867,4.98054,17.01576508483887L4.98054,19.64076508483887Q4.98054,19.82826508483887,5.10506,19.95326508483887L10.3346,25.67201508483887Q10.5837,26.01576508483887,10.3035,26.359565084838867Q9.99222,26.64076508483887,9.61868,26.39076508483887L3.29961,20.73451508483887L0.560311,22.10951508483887Q0.0311284,22.39076508483887,0,22.98451508483887Q0,23.57826508483887,0.498054,23.89076508483887L14.4436,31.89076508483887Q15.0039,32.17206508483886,15.5019,31.82826508483887Z" fill="#FFFFFF" fill-opacity="1" /></g></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isAuthSheetOpen && (
                <AuthenticationSheet
                    isOpen={isAuthSheetOpen}
                    onOpenChange={setIsAuthSheetOpen}
                />
            )}
        </div>
    )
}

export default HelpChat
