import React, { useEffect } from "react";
import { sparkles } from "@/constants/icons";
import { creatorUser } from "@/types";
import { usePathname } from "next/navigation";

interface CreatorDetailsProps {
	creator: creatorUser;
}

const CreatorDetails = ({ creator }: CreatorDetailsProps) => {
	const pathname = usePathname();
	const isCreatorOrExpressPath =
		pathname.includes("/creator") || pathname.includes("/expert");

	useEffect(() => {
		if (isCreatorOrExpressPath) {
			localStorage.setItem("currentCreator", JSON.stringify(creator));
		}
	}, [creator]);

	return (
		<>
			<div className="flex flex-col items-center px-4 sm:px-7 justify-center">
				<div
					className={`relative flex flex-col items-center w-fit mx-auto gap-4 p-4 sm:p-7 rounded-xl z-10 ${
						!isCreatorOrExpressPath && "!w-[85%]"
					}`}
					style={{
						backgroundColor: creator.themeSelected
							? creator.themeSelected
							: "#50A65C",
					}}
				>
					<img
						src={
							creator.photo ? creator.photo : "/images/defaultProfileImage.png"
						}
						alt="profile picture"
						width={24}
						height={24}
						className={`rounded-xl w-full min-h-full max-w-64 h-60 xl:max-w-80 xl:h-80 object-cover ${
							!isCreatorOrExpressPath && "!max-w-full xl:!max-w-full xl:h-80"
						} `}
						onError={(e) => {
							e.currentTarget.src = "/images/defaultProfileImage.png";
						}}
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
						style={{
							color: creator.themeSelected ? creator.themeSelected : "#50A65C",
						}}
					>
						{sparkles}
					</span>
				</div>
				{/* User Description */}

				<p
					className={`border-2 border-gray-200 p-4 -mt-7 pt-10 text-center rounded-3xl rounded-tr-none  h-full w-full relative ${
						isCreatorOrExpressPath
							? "text-base lg:max-w-[80%] xl:max-w-[55%]"
							: "text-base lg:text-lg"
					}`}
				>
					{creator.bio
						? creator.bio
						: isCreatorOrExpressPath
						? "Select the Call Type Below ..."
						: "Tap the Card to Visit Creator's Profile"}

					<span
						className="absolute max-xl:-top-2 xl:-bottom-2 -left-4"
						style={{ color: creator.themeSelected }}
					>
						{sparkles}
					</span>
				</p>
			</div>
		</>
	);
};

export default CreatorDetails;
