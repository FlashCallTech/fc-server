import { useChatTimerContext } from "@/lib/context/ChatTimerContext";

interface Props{
    endCall: () => void
}

const ChatTimer: React.FC<Props> = (endCall) => {
    const { timeLeft } = useChatTimerContext();
    const timeLeftInSeconds = parseFloat(timeLeft);
	const isLoading = isNaN(timeLeftInSeconds) || timeLeftInSeconds <= 0;

	const minutes = Math.floor(timeLeftInSeconds / 60);
	const seconds = Math.floor(timeLeftInSeconds % 60)
		.toString()
		.padStart(2, "0");

    return (
        <div className="leading-5 text-center text-white font-bold py-1 bg-[rgba(255,255,255,0.36)] mb-4">
            Time Left: {minutes}:{seconds}
        </div>
    )
}

export default ChatTimer;