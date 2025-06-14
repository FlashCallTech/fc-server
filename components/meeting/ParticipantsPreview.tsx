import { Avatar, useCallStateHooks } from "@stream-io/video-react-sdk";
import Image from "next/image";

export const ParticipantsPreview = () => {
	const { useCallSession } = useCallStateHooks();
	const session = useCallSession();

	if (!session || !session.participants || session.participants.length === 0)
		return (
			<div className="flex items-center gap-2 text-[#6B7280] text-sm mt-2">
				<span className="bg-red-500 rounded-full size-2" />
				No one else here
			</div>
		);

	return (
		<div className="flex flex-col items-start justify-start gap-2.5 pb-2 ">
			<span className="text-green-1">Already in Session</span>
			<div className="flex items-center justify-center gap-2">
				{session.participants.map((participant, index) => (
					<div className="flex items-center justify-center gap-4" key={index}>
						<Image
							src={participant.user.image as string}
							alt=""
							width={1000}
							height={1000}
							className="rounded-full w-14 h-14 object-cover"
						/>
						<div className="flex flex-col items-start justif-center">
							<span className="text-lg text-green-1">
								{participant.user.name}
							</span>
							<span className="text-xs">Session&apos;s Participant</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
