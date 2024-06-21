import { useEffect } from "react";

const useWarnOnUnload = (message: string, onUnload: () => void) => {
	useEffect(() => {
		const handleBeforeUnload = (event: any) => {
			// Show warning message
			event.preventDefault();
			event.returnValue = message;
			return message;
		};

		const handleUnload = () => {
			onUnload();
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		window.addEventListener("unload", handleUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			window.removeEventListener("unload", handleUnload);
		};
	}, [message, onUnload]);
};

export default useWarnOnUnload;
