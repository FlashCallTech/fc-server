import React, { useEffect, useState } from "react";
import { Call } from "@stream-io/video-react-sdk";
import * as Sentry from "@sentry/nextjs";

const MyOutgoingCallUI = ({
	call,
	setEndedByMe,
}: {
	call: Call;
	setEndedByMe: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const [callState, setCallState] = useState("outgoing");
	const expert = call?.state?.members?.find(
		(member) => member.custom.type === "expert"
	);

	useEffect(() => {
		let audio: HTMLAudioElement | null = null;

		if (callState === "outgoing") {
			audio = new Audio("/sounds/outgoing.mp3");
			audio.loop = true;

			const playPromise = audio.play();
			if (playPromise !== undefined) {
				playPromise
					.then(() => {
						console.log("Audio autoplay started!");
					})
					.catch((error) => {
						Sentry.captureException(error);

						console.error("Audio autoplay was prevented:", error);
					});
			}
		}

		// Clean up when callState changes or on component unmount
		return () => {
			if (audio) {
				audio.pause();
				audio.currentTime = 0;
			}
		};
	}, [callState]);

	return (
		<div
			className="fixed inset-0 bg-black/50 z-50 size-full flex items-center justify-center"
			onClick={(e) => e.stopPropagation()}
		>
			<div className="text-center bg-dark-2 text-white h-full sm:h-fit w-full sm:max-w-sm flex flex-col items-center justify-between py-10 sm:rounded-xl gap-5">
				<h1 className="font-bold text-xl mb-2">Outgoing Call ...</h1>
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
										(match, p1, p2) =>
											`${p1} ${p2.replace(/(\d{5})$/, "xxxxx")}`
								  )
								: expert?.user?.name}
						</p>
					</div>
				</div>
				<div className="flex items-center justify-center w-full">
					<button
						className="bg-red-500 text-white p-4 rounded-full hoverScaleDownEffect"
						onClick={async () => {
							setEndedByMe(true);
							await call.leave({ reject: true, reason: "decline" });
							await call.endCall();
							return;
						}}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="size-6"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M15.75 3.75 18 6m0 0 2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
};

export default MyOutgoingCallUI;
