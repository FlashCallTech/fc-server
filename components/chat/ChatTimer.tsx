import { useChatTimerContext } from "@/lib/context/ChatTimerContext";

const ChatTimer: React.FC = () => {
    const { timeLeft } = useChatTimerContext();
    const timeLeftInSeconds = parseFloat(timeLeft);
	const isLoading = isNaN(timeLeftInSeconds) || timeLeftInSeconds <= 0;

	const minutes = Math.floor(timeLeftInSeconds / 60);
	const seconds = Math.floor(timeLeftInSeconds % 60)
		.toString()
		.padStart(2, "0");

    return (
        <div className="text-[10px] text-white font-medium">
            {minutes}:{seconds} mins
        </div>
    )
}

export default ChatTimer;