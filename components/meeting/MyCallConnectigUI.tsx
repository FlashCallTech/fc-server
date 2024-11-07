import React from "react";
import { Call } from "@stream-io/video-react-sdk";
import { Cursor, Typewriter } from "react-simple-typewriter";

const MyCallConnectingUI = ({ call }: { call: Call | null }) => {
	const expert = call?.state?.members?.find(
		(member) => member.custom.type === "expert"
	);

	return (
		<section className="text-center bg-dark-2 text-white fixed h-full sm:h-fit z-50 w-full sm:max-w-sm flex flex-col items-center justify-between py-10 sm:rounded-xl bottom-0 right-0 sm:top-2 sm:right-2 gap-5">
			<h1 className="font-bold text-xl mb-2">Please Wait ...</h1>
			<div className="size-full flex flex-col items-center justify-center gap-10">
				<img
					src={expert?.user?.image || "/icons/logo_icon_dark.png"}
					alt=""
					className="rounded-full w-28 h-28 object-cover bg-white"
					onError={(e) => {
						e.currentTarget.src = "/images/defaultProfileImage.png";
					}}
				/>
				<div className="flex flex-col items-center justify-center gap-2">
					<p className="text-xs">Connecting Call With </p>
					<p className="font-semibold text-xl">
						{expert?.user?.name?.startsWith("+91")
							? expert?.user?.name?.replace(
									/(\+91)(\d+)/,
									(match, p1, p2) => `${p1} ${p2.replace(/(\d{5})$/, "xxxxx")}`
							  )
							: expert?.user?.name}
					</p>
				</div>
			</div>
			<div className="w-full h-fit flex items-center justify-center">
				<h1
					className="text-xl md:text-lg font-semibold"
					style={{ color: "#ffffff" }}
				>
					<Typewriter
						words={["Connecting  to the expert", "Hang tight"]}
						loop={true}
						cursor
						cursorStyle="_"
						typeSpeed={50}
						deleteSpeed={50}
						delaySpeed={2000}
					/>
					<Cursor cursorColor="#ffffff" />
				</h1>
			</div>
		</section>
	);
};

export default MyCallConnectingUI;
