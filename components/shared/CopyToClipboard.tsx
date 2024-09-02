import Image from "next/image";
import React from "react";
import { useToast } from "../ui/use-toast";
import * as Sentry from "@sentry/nextjs";

const CopyToClipboard = ({
	link,
	username,
	profession,
	gender,
	firstName,
	lastName,
}: {
	link: string;
	username: string;
	profession: string;
	gender: string;
	firstName: string;
	lastName: string;
}) => {
	const { toast } = useToast();
	const copyToClipboard = (text: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toast({
					variant: "destructive",
					title: "Creator Link Copied",
				});
			})
			.catch((err) => {
				Sentry.captureException(err);
				console.error("Failed to copy text: ", err);
			});
	};

	const fullName = `${firstName || ""} ${lastName || ""}`.trim() || username;

	const shareLink = async () => {
		const pronounPart = gender
			? `I had a wonderful session with ${
					gender === "other" ? "them" : gender === "male" ? "him" : "her"
			  }.`
			: `I had a wonderful session with ${fullName}.`;
		const message = `Hi 👋,\n\n${fullName} is an amazing ${profession}. ${pronounPart}\n\nYou should consult with ${
			gender
				? `${gender === "other" ? "them" : gender === "male" ? "him" : "her"}`
				: "them"
		} too.\n\nClick here to talk to ${fullName}.👇\n`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: `Consult with ${fullName}`,
					text: message,
					url: link,
				});
			} catch (err) {
				Sentry.captureException(err);
				console.error("Failed to share: ", err);
				toast({
					variant: "destructive",
					title: "Failed to share",
					description: `There was an error sharing the content. Please try again.`,
				});
			}
		} else {
			toast({
				variant: "destructive",
				title: "Sharing not supported",
				description:
					"Your device or browser does not support the share feature.",
			});
		}
	};

	return (
		<div className="flex justify-between items-center w-full gap-2 p-1">
			<div className="relative flex border w-full rounded-full p-2 bg-white justify-between items-center shadow-sm gap-2">
				<Image
					src={"/link.svg"}
					width={24}
					height={24}
					alt="link"
					className="w-5 h-5"
				/>
				<div className="grid items-start justify-start overflow-x-hidden w-full ">
					<p className="text-ellipsis whitespace-nowrap min-w-0 overflow-hidden">
						{link}
					</p>
				</div>

				<Image
					src={"/copy.svg"}
					width={24}
					height={24}
					alt="copy"
					className="w-10 h-10 p-2 rounded-full hover:bg-gray-100 cursor-pointer"
					onClick={() => copyToClipboard(link)}
				/>
			</div>
			<Image
				src="/share.svg"
				width={24}
				height={24}
				alt="share"
				className="w-10 h-10 p-2 bg-gray-800 rounded-full hover:bg-black cursor-pointer"
				onClick={shareLink}
			/>
		</div>
	);
};

export default CopyToClipboard;
