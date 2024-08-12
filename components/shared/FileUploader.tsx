import { useCallback, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";
import { Button } from "../ui/button";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import Image from "next/image";

type FileUploaderProps = {
	fieldChange: (url: string) => void;
	mediaUrl: string;
	onFileSelect: (file: File) => void;
};

const FileUploader = ({
	fieldChange,
	mediaUrl,
	onFileSelect,
}: FileUploaderProps) => {
	const [fileUrl, setFileUrl] = useState(mediaUrl);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [loading, setLoading] = useState(false);

	const onDrop = useCallback(
		(acceptedFiles: FileWithPath[]) => {
			const file = acceptedFiles[0];
			const fileRef = ref(storage, `uploads/${file.name}`);
			const uploadTask = uploadBytesResumable(fileRef, file);

			onFileSelect(file); // Pass the file blob to the parent component
			setLoading(true); // Set loading state to true

			uploadTask.on(
				"state_changed",
				(snapshot) => {
					const progress =
						(snapshot.bytesTransferred / snapshot.totalBytes) * 100;
					setUploadProgress(progress);
					console.log(`Upload is ${progress}% done`);
				},
				(error) => {
					console.error("Upload failed", error);
					setLoading(false); // Set loading state to false if upload fails
				},
				() => {
					getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
						setFileUrl(downloadURL);
						console.log("File available at", downloadURL);
						fieldChange(downloadURL); // Pass URL to the parent
						setLoading(false); // Set loading state to false once upload completes
					});
				}
			);
		},
		[fieldChange, onFileSelect]
	);

	const { getRootProps, getInputProps } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".png", ".jpeg", ".jpg"],
		},
	});

	return (
		<div
			{...getRootProps()}
			className="flex items-center justify-center w-full mx-auto flex-col rounded-xl cursor-pointer"
		>
			<input {...getInputProps()} className="cursor-pointer" />

			{fileUrl ? (
				<>
					<div className="flex flex-1 items-center justify-center w-full pt-2">
						{loading ? (
							<div className={`file_uploader-img bg-slate-300 animate-pulse`} />
						) : (
							<img src={fileUrl} alt="image" className={`file_uploader-img`} />
						)}
					</div>
					<p className="file_uploader-label">
						{loading ? "" : "Click or drag photo to replace"}
					</p>
				</>
			) : (
				<div className="file_uploader-box">
					<img
						src="/icons/file-upload.svg"
						width={96}
						height={77}
						alt="file upload"
					/>
					<h3 className="base-medium text-light-2 mb-2 mt-6">
						Drag photo here
					</h3>
					<p className="text-light-4 small-regular mb-6">SVG, PNG, JPG</p>
					<Button type="button" className="shad-button_dark_4">
						Select from computer
					</Button>
				</div>
			)}

			{uploadProgress > 0 && uploadProgress < 100 && !loading && "Uploading"}
		</div>
	);
};

export default FileUploader;
