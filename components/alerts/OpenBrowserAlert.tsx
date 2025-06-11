import { useEffect, useState } from "react";

const OpenInBrowserAlert = () => {
	const [showBanner, setShowBanner] = useState(false);
	const [isIOS, setIsIOS] = useState(false);

	useEffect(() => {
		const ua = navigator.userAgent || navigator.vendor;

		const isInstagram = /Instagram/i.test(ua);
		const isFacebook = /FBAN|FBAV/i.test(ua);
		const isMessenger = /Messenger/i.test(ua);
		const isTwitter = /Twitter/i.test(ua);
		const isInApp = isInstagram || isFacebook || isMessenger || isTwitter;

		const isiOSDevice = /iPhone|iPad|iPod/i.test(ua);

		if (isInApp) {
			setShowBanner(true);
			setIsIOS(isiOSDevice);
		}
	}, []);

	const handleCopy = () => {
		navigator.clipboard
			.writeText(window.location.href)
			.then(() => alert("Link copied! You can paste it in your browser."))
			.catch(() => alert("Failed to copy. Please do it manually."));
	};

	const handleTryOpenExternally = () => {
		const url = window.location.href;
		const success = window.open(url, "_blank");

		if (!success) {
			alert("Please use the browser option in the menu to open this link.");
		}
	};

	if (!showBanner) return null;

	return (
		<div className="fixed top-0 left-0 right-0 bg-yellow-100 text-sm text-black p-3 z-50 shadow-md flex flex-col items-center">
			<p className="text-center">
				You’re viewing this inside an in-app browser.
				<br />
				{isIOS
					? "Tap the Safari icon in the bottom bar to open in your browser."
					: "Tap the three dots or menu and choose 'Open in Browser'."}
			</p>
			<div className="flex gap-4 mt-2">
				<button
					className="underline font-semibold"
					onClick={handleTryOpenExternally}
				>
					Try to Open in Browser
				</button>
				<button className="underline font-semibold" onClick={handleCopy}>
					Copy Link
				</button>
			</div>
		</div>
	);
};

export default OpenInBrowserAlert;
