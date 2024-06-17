import { Avatar, useCallStateHooks } from "@stream-io/video-react-sdk";

export const ParticipantsPreview = () => {
	const { useCallSession } = useCallStateHooks();
	const session = useCallSession();

	if (!session || !session.participants || session.participants.length === 0)
		return null;

	return (
		<div className="flex flex-col items-center justify-center gap-2 pb-2">
			<span className="text-green-1">Already in Session</span>
			<div className="flex items-center justify-center gap-2">
				{session.participants.map((participant, index) => (
					<div key={index} className="flex items-center justify-center gap-2">
						<Avatar
							name={participant.user.name}
							imageSrc={participant.user.image}
						/>
						{participant.user.name && <div>{participant.user.name}</div>}
					</div>
				))}
			</div>
		</div>
	);
};
