import React, { ChangeEventHandler, useState } from 'react';

import Image from 'next/image';
import AudioVisualizer from '@/lib/AudioVisualizer';
import usePlatform from '@/hooks/usePlatform';

interface Props {
    isRecording: boolean;
    discardAudio: () => void;
    text: string;
    setText: (text: string) => void;
    handleImg: ChangeEventHandler<HTMLInputElement>; // Updated to handle both types
    handleSend: () => void;
    toggleRecording: () => void;
    img: { file: File | null; url: string };
    audio: { file: Blob | null; url: string };
    audioStream: MediaStream | null;
    audioContext: AudioContext;
    handleCapturedImg: ChangeEventHandler<HTMLInputElement>; // Updated to handle both types
    isImgUploading: boolean;
    discardImage: () => void;
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
    audioContext,
    handleCapturedImg,
    isImgUploading,
    discardImage
}) => {
    const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
    const { getDevicePlatform } = usePlatform();

    const handleImageClick = (imageUrl: string) => {
        setFullImageUrl(imageUrl);
    };

    // If img.url is present, only display the image section
    if (img.url) {
        return (
            <div className='flex relative bg-white p-2 pt-6'>
                <div className="flex flex-col mb-5 justify-center gap-3 items-center px-4">
                    <div
                        className="ml-auto text-black font-normal leading-5 relative"
                        style={{ wordBreak: "break-word" }}
                    >
                        <div className="relative">
                            {/* Container for the image to ensure no overflow */}
                            <div className="max-w-[90vw] max-h-[80vh] overflow-hidden">
                                <img
                                    src={img.url}
                                    alt="Uploaded"
                                    className="w-full h-full object-contain cursor-pointer rounded-xl"
                                    onClick={() => handleImageClick(img.url)}
                                />
                            </div>
                            {/* Cross button to discard the image */}
                            <button
                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                onClick={() => discardImage()} // Function to discard the image
                            >
                                &times;
                            </button>
                            {isImgUploading && <p>Sending Image...</p>}
                        </div>
                    </div>
                    <div className='flex flex-row w-[99%] items-center justify-center px-3 py-2 bg-gray-300 rounded-xl text-black'>
                        <input
                            type="text"
                            placeholder="Add a caption"
                            value={isImgUploading ? 'Sending Image' : text}
                            onChange={e => setText(e.target.value)}
                            className="px-2 text-sm leading-5 font-normal flex-auto bg-transparent outline-none "
                        />
                        <button onClick={handleSend} onContextMenu={(e) => e.preventDefault()}>
                            <div className='flex justify-center items-center bg-green-500 rounded-full px-2 py-2'>
                                <Image src="/send.svg" width={0} height={0} alt="Send" className="w-5 h-5" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    // If no img.url, show the normal chat input and controls
    return (
        <div className="flex flex-row items-center max-w-screen px-4 py-2 relative">
            {isRecording && audioStream ? (
                <div className="flex flex-row gap-3 flex-1 mr-5">
                    <button onClick={discardAudio}>
                        <Image src='/delete.svg' width={20} height={20} alt='discard' />
                    </button>
                    <AudioVisualizer audioContext={audioContext} audioStream={audioStream} />
                </div>
            ) : (
                <div className="sticky flex flex-1 flex-row px-3 py-2 bg-white rounded-full text-black mr-2 ">
                    <input
                        type="text"
                        placeholder="Message"
                        value={isImgUploading ? 'Sending Image' : text}
                        onChange={e => setText(e.target.value)}
                        className="px-2 text-sm leading-5 font-normal flex-auto bg-transparent outline-none "
                    />
                    <div className="flex flex-row gap-3 px-2 ml-auto">
                        <label htmlFor="file" onContextMenu={(e) => e.preventDefault()}>
                            <Image src='/file.svg' width={15} height={15} alt='file' className='w-7 h-7' />
                        </label>
                        <input
                            type="file"
                            id="file"
                            accept=".jpg,.jpeg,.png" 
                            style={{ display: "none" }}
                            onChange={handleImg}
                            
                        />
                        {!text.trim() && getDevicePlatform() !== 'Windows' && (
                            <label htmlFor="capture" onContextMenu={(e) => e.preventDefault()}>
                                <Image src='/cam.svg' width={25} height={25} alt='cam' className='w-7 h-7 cursor-pointer' />
                                <input
                                    type="file"
                                    id="capture"
                                    accept="image/*"
                                    capture="environment"
                                    style={{ display: "none" }}
                                    onChange={handleImg}
                                />
                            </label>
                        )}
                    </div>
                </div>
            )}

            {text.trim() || img.file || audio.file ? (
                <button onClick={handleSend} onContextMenu={(e) => e.preventDefault()}>
                    <Image src="/send.svg" width={0} height={0} alt="Send" className="w-11 h-11 bg-green-500 px-[14px] rounded-full" />
                </button>
            ) : (
                <button onClick={toggleRecording} onContextMenu={(e) => e.preventDefault()} >
                    <Image src={isRecording ? '/send.svg' : "/mic.svg"} width={30} height={30} alt="Mic" className="w-11 h-11 bg-green-500 rounded-full p-3" />
                </button>
            )}
        </div>
    );
};

export default ChatInput;
