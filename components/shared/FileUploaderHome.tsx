import { useCallback, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";
import { Button } from "../ui/button";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useToast } from "../ui/use-toast";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import * as Sentry from "@sentry/nextjs";

type FileUploaderProps = {
	fieldChange: (url: string) => void;
	mediaUrl: string;
	onFileSelect: (file: File) => void;
	creatorUser: any; // The creatorUser object is passed as props
};

const FileUploaderHome = ({
	fieldChange,
	mediaUrl,
	onFileSelect,
	creatorUser,
}: FileUploaderProps) => {
	const [fileUrl, setFileUrl] = useState(mediaUrl); // Old image
	const [newFileUrl, setNewFileUrl] = useState<string | null>(null); // New image preview
	const [uploadProgress, setUploadProgress] = useState(0);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const onDrop = useCallback(
		async (acceptedFiles: FileWithPath[]) => {
			setLoading(true);
			try {
				let file = acceptedFiles[0];

				// Convert the image to WebP format
				const options = {
					maxSizeMB: 0.5, // Specify the max size in MB
					maxWidthOrHeight: 1920,
					useWebWorker: true,
					fileType: "image/webp", // Convert to WebP format
				};

				// Compress the image
				const compressedFile = await imageCompression(file, options);

				const fileRef = ref(storage, `uploads/${compressedFile.name}`);
				const uploadTask = uploadBytesResumable(fileRef, compressedFile);

				onFileSelect(compressedFile);

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
							variant: "destructive",
							title: "Unable to Upload Image",
							description: "Please Try Again...",
						});
						setLoading(false); // Set loading state to false if upload fails
					},
					async () => {
						const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
						setNewFileUrl(downloadURL); // Show new image preview
						console.log("File available at", downloadURL);
						fieldChange(downloadURL); // Pass only new image URL to parent form state

						setLoading(false); // Set loading state to false once upload completes
					}
				);
			} catch (error) {
				Sentry.captureException(error);
				toast({
					variant: "destructive",
					title: "Unable to Upload Image",
					description: "Please Try Again...",
				});
				setLoading(false); // Set loading state to false if upload fails
			}
		},
		[fieldChange, onFileSelect, toast, creatorUser]
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
				<div className="w-1/2 bg-gray-200 rounded-xl h-2 dark:bg-gray-700">
					<div
						className="bg-green-1 h-2 rounded-xl transition-all duration-500"
						style={{ width: `${uploadProgress}%` }}
					></div>
				</div>
			</div>
		);

	console.log(fileUrl, newFileUrl);

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
				<div className="flex items-center justify-center w-full pt-2">
					<div className="flex flex-wrap justify-center items-center space-x-4">
						{/* Old Image */}
						{fileUrl && (
							<img
								src={fileUrl}
								alt="Current image"
								className={`${
									newFileUrl ? "w-32 h-32" : "w-32 h-32"
								} rounded-full border-2 border-white`}
							/>
						)}

						{/* New Image Preview */}
						{newFileUrl && (
							<img
								src={newFileUrl}
								alt="New image preview"
								className={` border-2 border-green-500 file_uploader-img`}
							/>
						)}
					</div>
				</div>
			)}

			<p className="file_uploader-label">
				{loading ? "" : "Click or drag photo to replace"}
			</p>
		</div>
	);
};

export default FileUploaderHome;
