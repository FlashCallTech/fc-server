import Image from "next/image";
import React from "react";
import { useToast } from "../ui/use-toast";
import { Button } from "../ui/button";

const CopyToClipboard = ({ link }: { link: string }) => {
	const { toast } = useToast();
	const copyToClipboard = (text: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toast({
					title: "Creator Link Copied",
				});
			})
			.catch((err) => {
				console.error("Failed to copy text: ", err);
			});
	};
	return (
		<div className="flex justify-between items-center w-full gap-2 p-1">
			<div className="relative flex  border w-full max-w-[90%] xl:max-w-[95%] rounded-full p-2 bg-white justify-start items-center shadow-sm">
				<Image
					src={"/link.svg"}
					width={24}
					height={24}
					alt="link"
					className="w-auto h-auto "
				/>
				<p className="pl-2 text-ellipsis w-full min-w-0 max-w-[85%] overflow-hidden">
					{link}
				</p>

				<Image
					src={"/copy.svg"}
					width={24}
					height={24}
					alt="copy"
					className="w-10 h-10 p-2 rounded-full absolute right-0 hover:bg-gray-100 cursor-pointer"
					onClick={() => copyToClipboard(link)}
				/>
			</div>
			<Image
				src="/share.svg"
				width={24}
				height={24}
				alt="share"
				className="w-10 h-10 p-2 bg-gray-800 rounded-full hover:bg-black cursor-pointer"
			/>
		</div>
	);
};

export default CopyToClipboard;
