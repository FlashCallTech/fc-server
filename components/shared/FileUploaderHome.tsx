import { useCallback, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";
import { Button } from "../ui/button";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { useToast } from "../ui/use-toast";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import * as Sentry from "@sentry/nextjs";
import { storage } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

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
	const [newFileUrl, setNewFileUrl] = useState<string | null>(null); // New image preview
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	// S3 client setup
	const s3Client = new S3Client({
		region: process.env.NEXT_PUBLIC_AWS_REGION!,
		credentials: {
			accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
			secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
		},
	});

	const onDrop = useCallback(
		async (acceptedFiles: FileWithPath[]) => {
			setLoading(true);

			try {
				let file = acceptedFiles[0];

				// Compress and convert the image to WebP format
				const options = {
					maxSizeMB: 0.1,
					maxWidthOrHeight: 1920,
					useWebWorker: true,
					fileType: "image/webp",
				};
				const compressedFile = await imageCompression(file, options);
				onFileSelect(compressedFile);

				let fileName = "";
				// Rename the file to have the .webp extension
				if (creatorUser?._id) {
					fileName = `${creatorUser._id}.webp`;
				} else {
					fileName = `${Date.now()}_${compressedFile.name.replace(
						/\.[^.]+$/,
						".webp"
					)}`;
				}

				const fileStream = compressedFile.stream();

				// S3 upload params
				const s3Params = {
					Bucket: "flashcall.me",
					Key: `uploads/${fileName}`,
					Body: fileStream,
					ContentType: compressedFile.type,
				};

				const upload = new Upload({
					client: s3Client,
					params: s3Params,
					queueSize: 4,
					leavePartsOnError: false,
				});

				// Execute upload
				await upload.done();

				// Generate CloudFront URL
				const cloudFrontUrl = `https://dxvnlnyzij172.cloudfront.net/uploads/${fileName}`;

				// Upload to Firebase Storage
				if (creatorUser?._id) {
					const firebaseStorageRef = ref(
						storage,
						`notifications/${creatorUser._id}`
					);

					const snapshot = await uploadBytes(
						firebaseStorageRef,
						compressedFile
					);
					const firebaseUrl = await getDownloadURL(snapshot.ref);

					console.log("Firebase URL:", firebaseUrl);
				}

				// Update UI and state
				setNewFileUrl(cloudFrontUrl);
				fieldChange(cloudFrontUrl);

				setLoading(false);
			} catch (error) {
				console.error("Upload error:", error); // Log the error for debugging
				Sentry.captureException(error);
				toast({
					variant: "destructive",
					title: "Unable to Upload Image",
					description: "Please Try Again...",
					toastStatus: "negative",
				});
				setLoading(false);
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
			</div>
		);

	return (
		<div
			{...getRootProps()}
			className="flex items-center justify-center w-full mx-auto flex-col rounded-xl cursor-pointer"
		>
			<input {...getInputProps()} className="cursor-pointer" />

			{!mediaUrl && !loading && !newFileUrl ? (
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
						{mediaUrl && (
							<img
								src={mediaUrl}
								alt="Current image"
								className={`${
									newFileUrl ? "w-20 h-20" : "w-32 h-32"
								} rounded-full border-2 border-white object-cover`}
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
