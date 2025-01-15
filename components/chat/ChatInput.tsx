import React, { ChangeEventHandler, useState, useEffect } from 'react';
import Image from 'next/image';
import AudioVisualizer from '@/lib/AudioVisualizer';
import usePlatform from '@/hooks/usePlatform';
import { useCurrentUsersContext } from '@/lib/context/CurrentUsersContext';

interface Chat {
    creatorName: string;
    clientName: string;
    creatorId: string;
    clientId: string;
    messages: {
        senderId: string;
        text: string;
        createdAt: number;
        img: string;
        audio: string;
        seen: boolean;
        tip: string;
        global?: boolean;
    }[];
}

interface Props {
    isRecording: boolean;
    discardAudio: () => void;
    text: string;
    setText: (text: string) => void;
    handleImg: ChangeEventHandler<HTMLInputElement>;
    handleSend: () => void;
    toggleRecording: () => void;
    img: { file: File | null; url: string };
    audio: { file: Blob | null; url: string };
    audioStream: MediaStream | null;
    handleCapturedImg: ChangeEventHandler<HTMLInputElement>;
    isImgUploading: boolean;
    isAudioUploading: boolean;
    discardImage: () => void;
    isTyping: boolean;
    setIsTyping: (isTyping: boolean) => void;
    replyIndex: number | undefined;
    chat: Chat,
    discardReply: () => void;
}

const ChatInput: React.FC<Props> = ({
    isRecording,
    discardAudio,
    text,
    setText,
    handleImg,
    handleSend,
    toggleRecording,
    img,
    audio,
    audioStream,
    isAudioUploading,
    isTyping,
    setIsTyping,
    replyIndex,
    chat,
    discardReply,
}) => {
    const { currentUser, userType } = useCurrentUsersContext();
    const { getDevicePlatform } = usePlatform();

    const textSizeClass = getDevicePlatform() === 'iOS' ? 'text-base' : 'text-sm';

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && text.trim()) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
        if (!isTyping && e.target.value !== "") {
            setIsTyping(true);
        }
        if (!e.target.value || text === "") {
            setIsTyping(false);
        }
    };

    return (
        <div className={`flex ${replyIndex !== undefined ? "flex-col" : "flex-row"} gap-2 items-center w-full px-2 pb-2 justify-between`}>
            {replyIndex !== undefined && (
                <div className="relative flex w-full items-center gap-2 p-2 bg-gray-100 rounded-md">
                    <div className="flex w-full flex-col flex-1">
                        <span className="text-sm font-bold text-gray-600">
                            {chat.messages[replyIndex]?.senderId === currentUser?._id ? "You" : userType === "client" ? chat.creatorName : chat.clientName}
                        </span>
                        <span className="text-sm text-gray-500 truncate block w-full">
                            {chat.messages[replyIndex]?.text || 'Attachment'}
                        </span>
                    </div>
                    <button
                        className="absolute top-1 right-1 text-xs text-gray-500 hover:text-gray-800"
                        onClick={() => discardReply()}
                    >
                        ✕
                    </button>
                </div>
            )}
            <div className={`${replyIndex !== undefined ? "flex flex-row w-full gap-2" : "w-full flex gap-2"}`}>
                {isRecording && audioStream ? (
                    <div className="flex flex-row gap-3 flex-1 mr-5">
                        <button onClick={discardAudio}>
                            <Image src="/delete.svg" width={20} height={20} alt="discard" />
                        </button>
                        <AudioVisualizer audioStream={audioStream} />
                    </div>
                ) : (
                    <div className="flex w-full flex-row px-3 py-2 bg-white rounded-full text-black">
                        <input
                            type="text"
                            placeholder={img ? "Add a caption" : "Message"}
                            onChange={handleInputChange}
                            value={text ?? ""}
                            onKeyDown={handleKeyDown}
                            className={`px-2 font-normal flex-auto bg-transparent outline-none`}
                        />
                        {!img.url && <div className="flex flex-row gap-3 px-2 ml-auto">
                            <label htmlFor="file" onContextMenu={(e) => e.preventDefault()}>
                                <Image src="/file.svg" width={15} height={15} alt="file" className="size-6 cursor-pointer" />
                            </label>
                            <input
                                type="file"
                                id="file"
                                accept=".jpg,.jpeg,.png"
                                style={{ display: 'none' }}
                                onChange={handleImg}
                            />
                            {!text.trim() && getDevicePlatform() !== 'Windows' && (
                                <label htmlFor="capture" onContextMenu={(e) => e.preventDefault()}>
                                    <Image
                                        src="/cam.svg"
                                        width={25}
                                        height={25}
                                        alt="cam"
                                        className="size-6 cursor-pointer"
                                    />
                                    <input
                                        type="file"
                                        id="capture"
                                        accept="image/*"
                                        capture="environment"
                                        style={{ display: 'none' }}
                                        onChange={handleImg}
                                    />
                                </label>
                            )}
                        </div>}
                    </div>
                )}
                <div className="flex flex-row items-center justify-center max-w-screen">
                    <div className="bg-[#25D366] p-2 rounded-full flex items-center justify-center">
                        <div className="relative flex items-center justify-center">
                            {isAudioUploading ? (
                                // Loading Circle
                                <div className="size-6 border-4 border-t-transparent border-gray-500 rounded-full animate-spin"></div>
                            ) : text.trim() || img.file || audio.file ? (
                                <button onClick={handleSend} onContextMenu={(e) => e.preventDefault()} className="flex items-center justify-center">
                                    <Image
                                        src="/send.svg"
                                        width={24}
                                        height={24}
                                        alt="Send"
                                        className="cursor-pointer"
                                    />
                                </button>
                            ) : (
                                <button onClick={toggleRecording} onContextMenu={(e) => e.preventDefault()} className="flex items-center justify-center">
                                    <Image
                                        src={isRecording ? '/send.svg' : '/mic.svg'}
                                        alt={isRecording ? 'Send' : 'Mic'}
                                        width={24}
                                        height={24}
                                        className=" cursor-pointer"
                                    />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
