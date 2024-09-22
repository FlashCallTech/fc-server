import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { updateCreatorUser } from "@/lib/actions/creator.actions";
import { creatorUser } from "@/types";
import FileUploaderHome from "../shared/FileUploaderHome";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import Image from "next/image";
import { editIcons } from "@/constants/icons";
import ContentLoading from "../shared/ContentLoading";

const ProfileDialog = ({
	creator,
	imageSrc,
}: {
	creator: creatorUser;
	imageSrc: string;
}) => {
	const { refreshCurrentUser } = useCurrentUsersContext();
	const [uploadedImage, setUploadedImage] = useState<string>(imageSrc);
	const [isChanged, setIsChanged] = useState<boolean>(false);
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const handleImageUpload = (url: string) => {
		setUploadedImage(url);
		setIsChanged(true);
	};

	const handleUpdate = async () => {
		if (uploadedImage) {
			setIsLoading(true);
			try {
				await updateCreatorUser(creator._id, { photo: uploadedImage });
				refreshCurrentUser();
				setIsChanged(false);
			} finally {
				setIsOpen(false);
				setIsLoading(false);
			}
		}
	};

	const handleDialogClose = (open: boolean) => {
		setIsOpen(open);

		if (!open) {
			setUploadedImage(imageSrc);
			setIsChanged(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleDialogClose}>
			<DialogTrigger>
				<div className="relative flex items-center hoverScaleDownEffect">
					<Image
						src={creator.photo || uploadedImage}
						width={1000}
						height={1000}
						alt="avatar"
						className="w-32 h-32 rounded-full object-cover"
					/>
					<span className="absolute z-20 bottom-2 right-0 bg-black/50 rounded-full p-2 flex items-center justify-center">
						{editIcons}
					</span>
				</div>
			</DialogTrigger>
			<DialogContent className="bg-white border-none w-full md:max-w-md">
				{!isLoading ? (
					<>
						<FileUploaderHome
							fieldChange={handleImageUpload}
							mediaUrl={creator?.photo || ""}
							onFileSelect={(file) => console.log("File selected:", file)}
							creatorUser={creator}
						/>
						{isChanged && (
							<button
								className="mt-4 bg-green-1 text-white py-2 px-4 rounded hoverScaleDownEffect"
								onClick={handleUpdate}
							>
								Update
							</button>
						)}
					</>
				) : (
					<ContentLoading />
				)}
			</DialogContent>
		</Dialog>
	);
};

export default ProfileDialog;
