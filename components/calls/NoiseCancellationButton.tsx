import { useNoiseCancellation } from "@stream-io/video-react-sdk";

export const NoiseCancellationButton = () => {
	const { isSupported, isEnabled, setEnabled } = useNoiseCancellation();
	if (!isSupported) return null;
	return (
		<button
			className={isEnabled ? "btn-toggle-nc-active" : "btn-toggle-nc"}
			type="button"
			onClick={() => setEnabled((enabled) => !enabled)}
		>
			Toggle Noise Cancellation
		</button>
	);
};
