import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import ImageModal from '@/lib/imageModal';
import { useUser } from '@clerk/nextjs';
import { Timestamp } from 'firebase/firestore';


interface Chat {
    messages: {
        senderId: string;
        text: string;
        createdAt: number;
        img: string;
        audio: string;
        seen: boolean;
    }[];
}

interface Img {
    file: File | null;
    url: string | null;
}

interface Props {
    chat: Chat;
    img: Img;
    isImgUploading: boolean;
}

const Messages: React.FC<Props> = ({ chat, img, isImgUploading }) => {
    const { user } = useUser();
    const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
    const endRef = useRef<HTMLDivElement | null>(null);
    const handleImageClick = (imageUrl: string) => {
        setFullImageUrl(imageUrl);
    };

    const handleCloseModal = () => {
        setFullImageUrl(null);
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    // const formatTime = (timestamp: Timestamp) => {
    //     const date = timestamp.toDate();
    //     const hours = date.getHours().toString().padStart(2, '0');
    //     const minutes = date.getMinutes().toString().padStart(2, '0');
    //     return `${hours}:${minutes}`;
    // };

    return (
        <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
            <div className="mb-4 text-left">
                {chat?.messages?.map((message, index) => (
                    <div
                        className={message.senderId === user?.publicMetadata?.userId as string ?
                            "bg-[rgba(255,255,255,1)] p-3 mb-3 max-w-[60%] min-w-[40%] lg:min-w-[10%] lg:max-w-[40%] w-fit rounded-lg rounded-tr-none ml-auto text-black font-normal leading-5 relative" :
                            "bg-[rgba(80,166,92,1)] p-3 mb-3 max-w-[60%] min-w-[40%] lg:min-w-[10%] lg:max-w-[40%] w-fit rounded-lg rounded-tl-none text-white font-normal leading-5 relative"}
                        key={message?.createdAt}
                        style={{ wordBreak: 'break-word', justifyContent: 'center' }}
                    >
                        {message.img && (
                            <div className='relative mb-2' style={{ display: 'inline-block' }}>
                                <img
                                    src={message.img}
                                    alt=""
                                    className='cursor-pointer'
                                    onClick={() => handleImageClick(message.img)}
                                    style={{ width: '200px', height: '250px', objectFit: 'cover' }} // Define your desired width and height here
                                />
                            </div>
                        )}
                        {fullImageUrl && (
                            <ImageModal imageUrl={fullImageUrl} onClose={handleCloseModal} />
                        )}
                        {message.audio && (
                            <div className='w-full items-center justify-center'>
                                <audio controls src={message.audio} className='w-[40vw] lg:w-[20vw] mb-3'></audio>
                            </div>
                        )}
                        {message.text && (
                            <div style={{ wordBreak: 'break-word', marginBottom: '10px'}}>
                                {message.text}
                            </div>
                        )}
                        <p className="text-xs text-gray-600 text-right mt-1"></p>
                        <div className={message.senderId === user?.publicMetadata?.userId as string ?
                            'rotate-90 absolute right-[-4px] top-[-4px] w-0 h-0 rounded-full border-[8px] border-l-white border-r-0 border-solid border-transparent' :
                            'rotate-90 absolute left-[-4px] top-[-4px] w-0 h-0 rounded-full border-[8px] border-l-[rgba(80,166,92,1)] border-r-0 border-solid border-transparent'}>
                        </div>
                        <div className={message.senderId === user?.publicMetadata?.userId as string ? 'w-full flex justify-end items-center absolute bottom-1 right-1' : 'w-full flex justify-end items-center absolute bottom-1 right-1'}>
                            {/* <span className="text-xs text-gray-500 mr-2">{formatTime(message.createdAt)}</span> */}
                            {message.seen && message.senderId === user?.publicMetadata?.userId as string && <Image src={ '/seen1.svg'} width={13} height={13} alt='seen' />}
                        </div>
                    </div>
                ))}
                {img.url && (
                    <div className="bg-[rgba(255,255,255,1)] p-3 rounded-lg rounded-tr-none max-w-[30%] ml-auto text-black font-normal leading-5 relative" style={{ marginBottom: '10px', wordBreak: 'break-word' }}>
                        <div className="texts">
                            <img
                                src={img.url}
                                alt=""
                                className='w-full h-auto cursor-pointer'
                                onClick={() => handleImageClick(img.url!)}
                            />
                            {isImgUploading && <p>Uploading image...</p>}
                        </div>
                    </div>
                )}
                <div ref={endRef}></div>
            </div>
        </div>
    );
};

export default Messages;
