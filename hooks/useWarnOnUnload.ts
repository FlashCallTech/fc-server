import { useEffect } from "react";

const useWarnOnUnload = (message: string, onUnload: () => void) => {
	const isReload = () => {
		const navigationEntry = window.performance.getEntriesByType(
			"navigation"
		)[0] as PerformanceNavigationTiming;
		return navigationEntry?.type === "reload";
	};

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!isReload()) {
				event.preventDefault();
				event.returnValue = message;
				return message;
			}
		};

		const handleUnload = () => {
			if (!isReload()) {
				onUnload(); // Call the unload handler if not a reload
			}
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
