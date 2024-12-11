import React, { ChangeEventHandler, useState, useEffect } from 'react';
import Image from 'next/image';
import AudioVisualizer from '@/lib/AudioVisualizer';
import usePlatform from '@/hooks/usePlatform';

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
    handleCapturedImg,
    isImgUploading,
    isAudioUploading,
    discardImage,
    isTyping,
    setIsTyping
}) => {
    const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
    const { getDevicePlatform } = usePlatform();

    const handleImageClick = (imageUrl: string) => {
        setFullImageUrl(imageUrl);
    };

    const textSizeClass = getDevicePlatform() === 'iOS' ? 'text-base' : 'text-sm';

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && text.trim()) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
        if (!isTyping && e.target.value !== " ") {
            setIsTyping(true);
        }
        if(!e.target.value) {
            setIsTyping(false);
        }
    };

    if (img.url) {
        return (
            <div className="flex relative bg-white p-2 pt-6">
                <div className="flex flex-col mb-5 justify-center gap-3 items-center px-4">
                    <div
                        className="ml-auto text-black font-normal leading-5 relative"
                        style={{ wordBreak: 'break-word' }}
                    >
                        <div className="relative">
                            <div className="max-w-[90vw] max-h-[80vh] overflow-hidden">
                                <img
                                    src={img.url}
                                    alt="Uploaded"
                                    className="w-full h-full object-contain cursor-pointer rounded-xl"
                                    onClick={() => handleImageClick(img.url)}
                                />
                            </div>
                            <button
                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                onClick={() => discardImage()}
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-row w-[99%] items-center justify-center px-3 py-2 bg-gray-300 rounded-xl text-black">
                        <input
                            type="text"
                            placeholder="Add a caption"
                            value={isImgUploading ? 'Sending Image' : text}
                            onChange={handleInputChange}
                            className={`px-2 ${textSizeClass} font-normal flex-auto bg-transparent outline-none`}
                        />
                        <button onClick={handleSend} onContextMenu={(e) => e.preventDefault()} disabled={isImgUploading}>
                            <div className="bg-[#25D366] p-1 rounded-full size-10 flex items-center justify-center">
                                <Image src="/send.svg" width={1000} height={1000} alt="Send" className="size-5" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-row items-center max-w-screen px-4 py-2 relative">
            {isRecording && audioStream ? (
                <div className="flex flex-row gap-3 flex-1 mr-5">
                    <button onClick={discardAudio}>
                        <Image src="/delete.svg" width={20} height={20} alt="discard" />
                    </button>
                    <AudioVisualizer audioStream={audioStream} />
                </div>
            ) : (
                <div className="sticky flex flex-1 flex-row px-3 py-2 bg-white rounded-full text-black mr-2">
                    <input
                        type="text"
                        placeholder={isAudioUploading ? 'Sending...' : 'Message'}
                        value={isImgUploading ? 'Sending Image' : text}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className={`px-2 ${textSizeClass} font-normal flex-auto bg-transparent outline-none`}
                        disabled={isAudioUploading}
                    />
                    <div className="flex flex-row gap-3 px-2 ml-auto">
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
                    </div>
                </div>
            )}
            <div className="bg-[#25D366] p-1 rounded-full size-10 flex items-center justify-center">
                {text.trim() || img.file || audio.file ? (
                    <button onClick={handleSend} onContextMenu={(e) => e.preventDefault()}>
                        <Image src="/send.svg" width={1000} height={1000} alt="Send" className="size-5" />
                    </button>
                ) : (
                    <button onClick={toggleRecording} onContextMenu={(e) => e.preventDefault()}>
                        <Image
                            src={isRecording ? '/send.svg' : '/mic.svg'}
                            width={1000}
                            height={1000}
                            alt="Mic"
                            className="size-5"
                        />
                    </button>
                )}  
            </div>
        </div>
    );
};

export default ChatInput;
