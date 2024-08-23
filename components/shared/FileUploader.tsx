import { useCallback, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";
import { Button } from "../ui/button";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useToast } from "../ui/use-toast";
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
	const { toast } = useToast();

	const onDrop = useCallback(
		(acceptedFiles: FileWithPath[]) => {
			setLoading(true); // Set loading state to true
			try {
				const file = acceptedFiles[0];
				const fileRef = ref(storage, `uploads/${file.name}`);
				const uploadTask = uploadBytesResumable(fileRef, file);

				onFileSelect(file); // Pass the file blob to the parent component

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
						toast({
							title: "Unable to Upload Image",
							description: "Please Try Again...",
						});
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
			} catch (error) {
				toast({
					title: "Unable to Upload Image",
					description: "Please Try Again...",
				});
				setLoading(false); // Set loading state to false if upload fails
			}
		},
		[fieldChange, onFileSelect, toast]
	);

	const { getRootProps, getInputProps } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".png", ".jpeg", ".jpg"],
		},
	});

	if (loading)
		return (
			<div className="flex flex-col items-center justify-center">
				<div
					className={`file_uploader-img bg-slate-300 animate-pulse mx-auto`}
				/>
				<div className="flex flex-col items-center justify-normal">
					<Image
						src="/icons/loader.gif"
						width={1000}
						height={1000}
						alt="Loading..."
						className="w-20 h-20"
					/>
				</div>
				{/* Progress Bar */}
				<div className="w-[25%] bg-gray-200 rounded-xl h-2 dark:bg-gray-700">
					<div
						className="bg-green-1 h-2 rounded-xl transition-all duration-500"
						style={{ width: `${uploadProgress}%` }}
					></div>
				</div>
			</div>
		);

	return (
		<div
			{...getRootProps()}
			className="flex items-center justify-center w-full mx-auto flex-col rounded-xl cursor-pointer"
		>
			<input {...getInputProps()} className="cursor-pointer" />

			{!fileUrl && !loading ? (
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
			) : (
				<div className="flex flex-1 items-center justify-center w-full pt-2">
					<img src={fileUrl} alt="image" className={`file_uploader-img`} />
				</div>
			)}

			<p className="file_uploader-label">
				{loading ? "" : "Click or drag photo to replace"}
			</p>
		</div>
	);
};

export default FileUploader;
