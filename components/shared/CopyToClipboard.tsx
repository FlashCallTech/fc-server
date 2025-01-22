import Image from "next/image";
import React from "react";
import { useToast } from "../ui/use-toast";
import * as Sentry from "@sentry/nextjs";
import { getDisplayName } from "@/lib/utils";

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
					toastStatus: "positive",
				});
			})
			.catch((err) => {
				Sentry.captureException(err);
				console.error("Failed to copy text: ", err);
			});
	};

	const fullName = getDisplayName({ firstName, lastName, username });

	const shareLink = async () => {
		const pronounPart = gender
			? `I had a wonderful session with ${gender === "other" ? "them" : gender === "male" ? "him" : "her"
			}.`
			: `I had a wonderful session with ${fullName}.`;
		const message = `Hi 👋,\n\n${fullName} is an amazing ${profession}. ${pronounPart}\n\nYou should consult with ${gender
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
					toastStatus: "negative",
				});
			}
		} else {
			toast({
				variant: "destructive",
				title: "Sharing not supported",
				description:
					"Your device or browser does not support the share feature.",
				toastStatus: "negative",
			});
		}
	};

	return (
		<div>
			<div className="flex justify-between items-center w-full gap-2 p-1 md:hidden">
				<div
					className="relative flex border w-full rounded-full px-4 p-2 bg-white justify-between items-center shadow-sm gap-2 group cursor-pointer"
					onClick={() => copyToClipboard(link)}
				>
					<Image
						src={"/link.svg"}
						width={24}
						height={24}
						alt="link"
						className="w-5 h-5"
					/>
					<div className="grid items-start justify-start overflow-x-hidden w-full group-hover:text-green-1">
						<p className="text-ellipsis whitespace-nowrap min-w-0 overflow-hidden">
							{link}
						</p>
					</div>

					<Image
						src={"/copy.svg"}
						width={24}
						height={24}
						alt="copy"
						className="w-10 h-10 p-2 object-fit rounded-full bg-gray-50 hoverScaleDownEffect hover:bg-gray-200"
					/>
				</div>
				<Image
					src="/share.svg"
					width={24}
					height={24}
					alt="share"
					className="w-10 h-10 p-2 bg-gray-800 rounded-full hoverScaleDownEffect cursor-pointer"
					onClick={shareLink}
				/>
			</div>
			{/* New Design */}
			<div className="hidden md:flex justify-between items-center w-full gap-2">
				<div
					className="relative flex bg-white border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] w-full rounded-xl p-4 justify-between items-center gap-2 group cursor-pointer"
					onClick={() => copyToClipboard(link)}
				>
					<Image
						src={"/link.svg"}
						width={24}
						height={24}
						alt="link"
						className="w-5 h-5"
					/>
					<div className="grid items-start justify-start px-3 py-2 text-[#4B5563] overflow-x-hidden w-full group-hover:text-black">
						<p className="text-ellipsis whitespace-nowrap min-w-0 overflow-hidden text-base font-normal leading-6 tracking-normal">
							{link}
						</p>
					</div>

					<Image
						src={"/copy.svg"}
						width={24}
						height={24}
						alt="copy"
						className="size-9 p-2 object-fit rounded hoverScaleDownEffect"
					/>
					<Image
						src={"/creator/refer.svg"}
						width={24}
						height={24}
						alt="copy"
						className="size-9 p-2 object-fit rounded hoverScaleDownEffect filter grayscale brightness-[0.3] sepia hue-rotate-[220deg]"
					/>
				</div>
				{/* <Image
				src="/share.svg"
				width={24}
				height={24}
				alt="share"
				className="w-10 h-10 p-2 bg-gray-800 rounded-full hoverScaleDownEffect cursor-pointer"
				onClick={shareLink}
				/> */}
			</div>
		</div>
	);
};

export default CopyToClipboard;
