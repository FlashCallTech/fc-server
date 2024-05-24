import React from "react";
import { audio, chat, video } from "@/constants/icons";
import { creatorUser } from "@/types";

interface CallingOptions {
	creator: creatorUser;
}

const CallingOptions = ({ creator }: CallingOptions) => {
	return (
		<>
			{/* Book Video Call */}
			<div
				className="flex flex-col gap-2 border border-gray-300 w-[80%] rounded-xl py-3 px-4 justify-center items-center xl:w-[50%]"
				style={{
					boxShadow: `5px 5px 5px 0px ${creator.themeSelected}`,
				}}
			>
				<div
					className={`flex gap-4 items-center font-semibold`}
					style={{ color: creator.themeSelected }}
				>
					{video}
					Book Video Call
				</div>
				<span className="text-xs tracking-widest">
					Rs. {creator.videoRate}/Min
				</span>
			</div>
			{/* Book Audio Call */}
			<div
				className="flex flex-col gap-2 border border-gray-300 w-[80%] rounded-xl py-3 px-4 justify-center items-center xl:w-[50%]"
				style={{
					boxShadow: `5px 5px 5px 0px ${creator.themeSelected}`,
				}}
			>
				<div
					className={`flex gap-4 items-center font-semibold`}
					style={{ color: creator.themeSelected }}
				>
					{audio}
					Book Audio Call
				</div>
				<span className="text-xs tracking-widest">
					Rs. {creator.audioRate}/Min
				</span>
			</div>
			{/* Book Chat */}
			<div
				className="flex flex-col gap-2 border border-gray-300 w-[80%] rounded-xl py-3 px-4 justify-center items-center xl:w-[50%]"
				style={{
					boxShadow: `5px 5px 5px 0px ${creator.themeSelected}`,
				}}
			>
				<div
					className={`flex gap-4 items-center font-semibold`}
					style={{ color: creator.themeSelected }}
				>
					{chat}
					Chat Now
				</div>
				<span className="text-xs tracking-widest">
					Rs. {creator.chatRate}/Min
				</span>
			</div>
		</>
	);
};

export default CallingOptions;
