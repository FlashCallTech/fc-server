"use client"
import Loader from '@/components/shared/Loader';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUsersContext } from '@/lib/context/CurrentUsersContext';
import { db } from '@/lib/firebase';
import { format, isSameDay, isToday, subDays } from 'date-fns';
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

    useEffect(() => {
        const setVh = () => {
            // Use visualViewport.height if available, otherwise fallback to window.innerHeight
            const vh = window.visualViewport ? window.visualViewport.height * 0.01 : window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVh();
        window.addEventListener('resize', setVh);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', setVh);
        }
        return () => {
            window.removeEventListener('resize', setVh);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', setVh);
            }
        };
    }, []);

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

    return (
        <div className='overflow-hidden border-red-500'>
            {/* Mobile Layout */}
            <div
                className={`flex flex-col justify-between w-full overflow-hidden bg-gray-100 md:hidden`}
                style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
            >
                <div className='flex flex-col'>
                    <div className="handle border p-2 rounded-t-lg flex justify-between items-center">
                        <div className='flex items-center gap-2'>
                            <Image
                                src={`${chat.creatorImg}`}
                                width={36}
                                height={36}
                                alt='photo'
                                className='size-9 object-cover rounded-full'
                            />
                            <span className="font-bold">{chat?.creatorName}</span>
                        </div>
                        <button
                            onClick={handleEnd}
                            className="px-2 rounded-lg hoverScaleDownEffect border"
                        >
                            &times;
                        </button>
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
                {/* Messages */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-2 gap-2 flex flex-col-reverse">
                    {chat?.messages &&
                        [...chat.messages].reverse().map((msg: any, index, arr) => {
                            const currentMsgDate = new Date(msg.createdAt);
                            let showSeparator = false;
                            if (index === arr.length - 1) {
                                showSeparator = true;
                            } else {
                                const nextMsgDate = new Date(arr[index + 1].createdAt);
                                if (!isSameDay(currentMsgDate, nextMsgDate)) {
                                    showSeparator = true;
                                }
                            }

                            let dateLabel = '';
                            if (showSeparator) {
                                if (isToday(currentMsgDate)) {
                                    dateLabel = 'Today';
                                } else if (isSameDay(currentMsgDate, subDays(new Date(), 1))) {
                                    dateLabel = 'Yesterday';
                                } else {
                                    dateLabel = format(currentMsgDate, 'd MMM, yyyy');
                                }
                            }

                            return (
                                <React.Fragment key={msg.createdAt + '-' + index}>
                                    <div className={`flex ${msg.senderId === (currentUser?._id ?? temporaryClientId) ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`px-4 py-2 text-sm shadow-sm rounded-2xl max-w-[70%] ${msg.senderId === (currentUser?._id ?? temporaryClientId) ? 'text-black bg-white' : 'bg-gray-200 text-black'}`}>
                                            {msg.text}
                                            <div className="text-[10px] text-right opacity-70 pl-10 mt-1">
                                                {format(new Date(msg.createdAt), 'hh:mm a')}
                                            </div>
                                        </div>
                                    </div>
                                    {index === 0 && <div ref={messagesEndRef} />} {/* Place ref after the latest message */}
                                    {showSeparator && (
                                        <div className="flex justify-center py-4">
                                            <div className="text-gray-600 font-semibold text-xs">
                                                {dateLabel}
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                </div>

                {/* Input */}
                <div className="p-2 bg-white">
                    <div className="flex justify-between rounded-lg border border-gray-300">
                        <input
                            type="text"
                            placeholder="Start typing your message"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="flex-1 p-2 focus:outline-none bg-transparent"
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <div className="p-1">
                            <button
                                onClick={handleSend}
                                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full"
                            >
                                {/* SVG Icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    xmlnsXlink="http://www.w3.org/1999/xlink"
                                    fill="none"
                                    version="1.1"
                                    width="15.94"
                                    height="16.01"
                                    viewBox="0 0 15.94 16.01"
                                >
                                    <g transform="matrix(1,0,0,-1,0,32.02)">
                                        <path
                                            d="M15.5019,31.8283Q16,31.4846,15.9377,30.8596L13.9455,17.8595Q13.8521,17.3908,13.4475,17.1408Q13.0117,16.922,12.5759,17.1095L8.8405,18.6408L6.7237,16.3283Q6.2257,15.8595,5.6031,16.0783Q5.0117,16.3595,4.9805,17.0158L4.9805,19.6408Q4.9805,19.8283,5.1051,19.9533L10.3346,25.672Q10.5837,26.0158,10.3035,26.3596Q9.9922,26.6408,9.6187,26.3908L3.2996,20.7345L0.5603,22.1095Q0.0311,22.3908,0,22.9845Q0,23.5783,0.4981,23.8908L14.4436,31.8908Q15.0039,32.1721,15.5019,31.8283Z"
                                            fill="#FFFFFF"
                                            fillOpacity="1"
                                        />
                                    </g>
                                </svg>
                            </button>
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
                                        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="15.944661140441895" height="16.008665084838867" viewBox="0 0 15.944661140441895 16.008665084838867"><g transform="matrix(1,0,0,-1,0,32.017330169677734)"><path d="M15.5019,31.82826508483887Q16,31.484565084838867,15.9377,30.859565084838867L13.9455,17.85951508483887Q13.8521,17.39076508483887,13.4475,17.14076508483887Q13.0117,16.922017084838867,12.5759,17.10951508483887L8.84047,18.64076508483887L6.72374,16.328267084838867Q6.22568,15.859517084838867,5.60311,16.078267384838867Q5.01167,16.359517084838867,4.98054,17.01576508483887L4.98054,19.64076508483887Q4.98054,19.82826508483887,5.10506,19.95326508483887L10.3346,25.67201508483887Q10.5837,26.01576508483887,10.3035,26.359565084838867Q9.99222,26.64076508483887,9.61868,26.39076508483887L3.29961,20.73451508483887L0.560311,22.10951508483887Q0.0311284,22.39076508483887,0,22.98451508483887Q0,23.57826508483887,0.498054,23.89076508483887L14.4436,31.89076508483887Q15.0039,32.17206508483886,15.5019,31.82826508483887Z" fill="#FFFFFF" fillOpacity="1" /></g></svg>
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
