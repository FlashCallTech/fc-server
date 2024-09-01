import React from "react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useToast } from "../ui/use-toast";

const ShareButton = ({
	username,
	profession,
	gender,
	firstName,
	lastName,
}: {
	username: string;
	profession: string;
	gender: string;
	firstName: string;
	lastName: string;
}) => {
	const { toast } = useToast();
	const fullName = `${firstName || ""} ${lastName || ""}`.trim() || username;

	const shareLink = async () => {
		const link = window.location.href;
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
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					className={`px-3 py-6 rounded-xl transition-all duration-300 hover:scale-105 group bg-[#232323]/35 hover:bg-green-1 flex gap-2 items-center`}
					onClick={shareLink}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="white"
						className="size-6"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
						/>
					</svg>
				</Button>
			</TooltipTrigger>
			<TooltipContent className="bg-green-1 border-none text-white">
				<p>Share Link</p>
			</TooltipContent>
		</Tooltip>
	);
};

export default ShareButton;
