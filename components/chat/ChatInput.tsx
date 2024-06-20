import React, { ChangeEventHandler } from 'react';

import Image from 'next/image';
import AudioVisualizer from '@/lib/AudioVisualizer';

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
}) => {
    
    if (isRecording && !audioStream) {
        console.warn('Audio stream is not valid when recording:', audioStream);
    }

    return (
        <div className="flex items-center p-4 mb-4 relative">
            {isRecording && audioStream ? (
                <div className="flex flex-row gap-3 flex-1 mr-5">
                    <button onClick={discardAudio}>
                        <Image src='/delete.svg' width={20} height={20} alt='discard' />
                    </button>
                    <AudioVisualizer audioContext={audioContext} audioStream={audioStream} />
                </div>
            ) : (
                <div className="flex flex-1 flex-row px-3 py-2 bg-[rgba(255,255,255,0.12)] rounded-full text-white mr-2">
                    <input
                        type="text"
                        placeholder="Message"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        className="px-2 text-sm leading-5 font-normal flex-auto bg-transparent"
                    />
                    <div className="flex flex-row gap-4 px-2 ml-auto">
                        <label htmlFor="file">
                            <Image src='/file.svg' width={15} height={15} alt='file' className='w-7 h-7' />
                        </label>
                        <input
                            type="file"
                            id="file"
                            style={{ display: "none" }}
                            onChange={handleImg} 
                        />
                        {!text.trim() && (
                            <label htmlFor="capture">
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
                <button onClick={handleSend}>
                    <Image src="/send.svg" width={30} height={30} alt="Send" className="w-10 h-10 bg-[rgba(80,166,92,1)] rounded-full px-1 py-1" />
                </button>
            ) : (
                <button onClick={toggleRecording}>
                    <Image src={isRecording ? '/send.svg' : "/mic.svg"} width={30} height={30} alt="Mic" className="w-10 h-10 bg-[rgba(80,166,92,1)] rounded-full px-1 py-1" />
                </button>
            )}
        </div>
    );
};

export default ChatInput;
