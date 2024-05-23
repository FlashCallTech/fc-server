import React from "react";
import { creatorUser } from "@/types";
import UserReviews from "./UserReviews";
import { usePathname } from "next/navigation";

interface CreatorCardProps {
	creator: creatorUser;
}

const sparkles = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		className="w-7 h-7"
	>
		<path
			fillRule="evenodd"
			d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
			clipRule="evenodd"
		/>
	</svg>
);
const CreatorCard = ({ creator }: CreatorCardProps) => {
	const pathname = usePathname();
	return (
		<section
			key={creator._id}
			className="w-full lg:mx-auto h-full grid grid-cols-1 gap-4 items-start text-center justify-center"
		>
			{/* User Details */}
			<div className="flex flex-col items-center px-7">
				<div
					className={`relative flex flex-col items-center w-fit mx-auto gap-4 p-7 rounded-xl z-10`}
					style={{ backgroundColor: creator.themeSelected }}
				>
					<img
						src={creator.photo}
						alt="profile picture"
						width={24}
						height={24}
						className="rounded-xl w-full min-h-full max-w-64 h-60 lg:max-w-72 lg:h-72 object-cover"
					/>
					<div className="text-white flex flex-col items-start w-full">
						{/* Username*/}
						<p className="font-semibold text-3xl max-w-[90%] text-ellipsis whitespace-nowrap overflow-hidden">
							{creator.firstName ? (
								<span className="capitalize">
									{creator.firstName} {creator.lastName}
								</span>
							) : (
								creator.username
							)}
						</p>
						{/* Profession and Status */}
						<div className="flex items-center justify-between w-full mt-2">
							<span className="text-md h-full">
								{creator.profession ? creator.profession : "Expert"}
							</span>
							<span className="bg-green-500 text-xs rounded-xl px-4 py-2">
								Available
							</span>
						</div>
					</div>

					<span
						className="absolute top-1/2 -right-8"
						style={{ color: creator.themeSelected }}
					>
						{sparkles}
					</span>
				</div>
				{/* User Description */}
				{creator.bio && (
					<p className=" border-2 border-gray-200 p-4 -mt-7 pt-10 text-md text-center rounded-3xl rounded-tr-none lg:max-w-[80%] h-full   relative">
						{creator.bio}

						<span
							className="absolute top-0 -left-2"
							style={{ color: creator.themeSelected }}
						>
							{sparkles}
						</span>
					</p>
				)}
			</div>

			{/* Calling Options */}
			{pathname.includes("/creator") && (
				<div className="flex flex-col gap-7 items-center ">
					{/* Book Video Call */}
					<div
						className="flex flex-col gap-2 border border-gray-300 w-[80%] rounded-xl py-2 px-4 justify-center items-center lg:w-[55%]"
						style={{
							boxShadow: `5px 5px 5px 0px ${creator.themeSelected}`,
						}}
					>
						<div
							className={`flex gap-4 items-center font-semibold`}
							style={{ color: creator.themeSelected }}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="w-6 h-6"
							>
								<path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
							</svg>
							Book Video Call
						</div>
						<span className="text-xs tracking-widest">
							Rs. {creator.videoRate}/Min
						</span>
					</div>
					{/* Book Audio Call */}
					<div
						className="flex flex-col gap-2 border border-gray-300 w-[80%] rounded-xl py-2 px-4 justify-center items-center lg:w-[55%]"
						style={{
							boxShadow: `5px 5px 5px 0px ${creator.themeSelected}`,
						}}
					>
						<div
							className={`flex gap-4 items-center font-semibold`}
							style={{ color: creator.themeSelected }}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="w-6 h-6"
							>
								<path
									fillRule="evenodd"
									d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
									clipRule="evenodd"
								/>
							</svg>
							Book Audio Call
						</div>
						<span className="text-xs tracking-widest">
							Rs. {creator.audioRate}/Min
						</span>
					</div>
					{/* Book Chat */}
					<div
						className="flex flex-col gap-2 border border-gray-300 w-[80%] rounded-xl py-2 px-4 justify-center items-center lg:w-[55%]"
						style={{
							boxShadow: `5px 5px 5px 0px ${creator.themeSelected}`,
						}}
					>
						<div
							className={`flex gap-4 items-center font-semibold`}
							style={{ color: creator.themeSelected }}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="w-6 h-6"
							>
								<path
									fillRule="evenodd"
									d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z"
									clipRule="evenodd"
								/>
							</svg>
							Chat Now
						</div>
						<span className="text-xs tracking-widest">
							Rs. {creator.chatRate}/Min
						</span>
					</div>
					{/* User Reviews */}

					<UserReviews theme={creator.themeSelected} />
				</div>
			)}
		</section>
	);
};

export default CreatorCard;
