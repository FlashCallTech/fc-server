// hooks/useMediaRecorder.ts
import { useState, useRef } from 'react';

const useMediaRecorder = () => {
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
   

    const startRecording = () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream: MediaStream) => {
                setAudioStream(stream);
                mediaRecorderRef.current = new MediaRecorder(stream);
                mediaRecorderRef.current.ondataavailable = (e: BlobEvent) => {
                    audioChunksRef.current.push(e.data);
                };
                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                    setAudioBlob(audioBlob);
                    audioChunksRef.current = [];
                    stream.getTracks().forEach(track => track.stop());
                    setAudioStream(null);
                };
                mediaRecorderRef.current.start();
                setIsRecording(true);
            }).catch((error: Error) => {
                console.error("Error accessing microphone:", error);
            });
        } else {
            console.error("getUserMedia not supported on your browser!");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    



    return { audioStream, isRecording, audioBlob, startRecording, stopRecording, mediaRecorderRef, setAudioStream, setIsRecording };
};

export default useMediaRecorder;
