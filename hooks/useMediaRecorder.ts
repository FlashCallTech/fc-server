import { useState, useRef } from "react";
import * as Sentry from "@sentry/nextjs";

const useMediaRecorder = () => {
	const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const [mp3Blob, setMp3Blob] = useState<Blob | null>(null);

	const uploadAudioBlob = async (audioBlob: Blob) => {
		const formData = new FormData();

		// Create a file from the Blob
		const audioFile = new File([audioBlob], "audio.webm", {
			type: "audio/webm",
		});

		formData.append("file", audioFile);

		try {
			const response = await fetch("http://localhost:5000/api/v1/audio/convert", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				throw new Error("Failed to upload audio file");
			}

			const convertedAudioBlob: Blob = await response.blob();
			return convertedAudioBlob; // Handle the result as needed
		} catch (error) {
			console.error("Error uploading audio file:", error);
			throw error; // Re-throw or handle the error as needed
		}
	};


	const startRecording = () => {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices
				.getUserMedia({ audio: true })
				.then((stream: MediaStream) => {
					setAudioStream(stream);
					mediaRecorderRef.current = new MediaRecorder(stream, {
						mimeType: "audio/webm", // Change mimeType here
					});
					mediaRecorderRef.current.ondataavailable = (e: BlobEvent) => {
						audioChunksRef.current.push(e.data);
					};
					mediaRecorderRef.current.onstop = async() => {
						const AudioBlob = new Blob(audioChunksRef.current, {
							type: "audio/webm", // Ensure consistent type here
						});
						if (AudioBlob) {
							try {
								const result: Blob = await uploadAudioBlob(AudioBlob);
								setMp3Blob(result);
								console.log("Conversion result:", result); // Handle the conversion result as needed
							} catch (error) {
								console.error("Error during upload:", error);
							}
						}
						setAudioBlob(audioBlob);
						audioChunksRef.current = [];
						stream.getTracks().forEach((track) => track.stop());
						setAudioStream(null);
					};
					mediaRecorderRef.current.start();
					setIsRecording(true);
				})
				.catch((error: Error) => {
					Sentry.captureException(error);
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

	return {
		audioStream,
		isRecording,
		startRecording,
		stopRecording,
		mediaRecorderRef,
		setAudioStream,
		setIsRecording,
		mp3Blob,
		setMp3Blob,
	};
};

export default useMediaRecorder;
