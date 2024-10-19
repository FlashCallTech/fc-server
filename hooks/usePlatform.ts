const usePlatform = () => {
	function getDevicePlatform() {
		const userAgent = navigator.userAgent || navigator.vendor;

		// Detect iOS
		if (/iPad|iPhone|iPod/.test(userAgent)) {
			return "iOS";
		}

		// Detect Android
		if (/android/i.test(userAgent)) {
			return "Android";
		}

		// Detect Windows
		if (/Win/i.test(userAgent)) {
			return "Windows";
		}

		return "Unknown Platform";
	}

	return { getDevicePlatform };
};

export default usePlatform;
