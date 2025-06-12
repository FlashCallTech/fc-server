"use client";

import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Copy, ExternalLink } from "lucide-react";

const OpenInBrowserBanner = () => {
	const [isInApp, setIsInApp] = useState(false);
	const [isIOS, setIsIOS] = useState(false);
	const [shouldShowDialog, setShouldShowDialog] = useState(false);
	const [checkedRedirect, setCheckedRedirect] = useState(false);
	const { toast } = useToast();

	useEffect(() => {
		const ua = navigator.userAgent || navigator.vendor;

		const isInstagram = /Instagram/i.test(ua);
		const isFacebook = /FBAN|FBAV/i.test(ua);
		const isMessenger = /Messenger/i.test(ua);
		const isTwitter = /Twitter/i.test(ua);
		const inApp = isInstagram || isFacebook || isMessenger || isTwitter;

		const isiOSDevice = /iPhone|iPad|iPod/i.test(ua);

		if (inApp) {
			setIsInApp(true);
			setIsIOS(isiOSDevice);

			// Redirect for Android only
			if (!isiOSDevice) {
				// Prevent dialog from rendering while redirecting
				const host = window.location.host;
				const path = window.location.pathname + window.location.search;
				const intentURL = `intent://${host}${path}#Intent;scheme=https;package=com.android.chrome;end;`;

				window.location.href = intentURL;

				// Fallback in case redirection fails
				setTimeout(() => {
					setCheckedRedirect(true);
					setShouldShowDialog(true);
				}, 2500);
			} else {
				// iOS: show dialog immediately
				setCheckedRedirect(true);
				setShouldShowDialog(true);
			}
		}
	}, []);

	const handleManualRedirect = () => {
		if (!isIOS) {
			const host = window.location.host;
			const path = window.location.pathname + window.location.search;
			const intentURL = `intent://${host}${path}#Intent;scheme=https;package=com.android.chrome;end;`;

			window.location.href = intentURL;
		}
	};

	const handleCopyLink = () => {
		navigator.clipboard
			.writeText(window.location.href)
			.then(() => {
				toast({
					title: "Link copied!",
					description: "Paste it in your browser to continue.",
					variant: "destructive",
					toastStatus: "positive",
				});
			})
			.catch(() => {
				toast({
					title: "Failed to copy link",
					description: "Please try manually.",
					variant: "destructive",
					toastStatus: "negative",
				});
			});
	};

	// Prevent dialog from rendering until we decide based on redirection
	if (!isInApp || !checkedRedirect || !shouldShowDialog) return null;

	return (
		<Dialog open>
			<DialogContent
				className="bg-white rounded-xl shadow-xl w-[92%] sm:max-w-md"
				hideCloseButton={true}
			>
				<DialogHeader>
					<DialogTitle className="text-yellow-800 text-lg">
						Open in Browser
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-3 text-sm text-yellow-900">
					<p>
						You’re currently inside an in-app browser (e.g. Instagram, Twitter,
						etc.).
					</p>
					<p>
						To use all features correctly, please open this link in your default
						browser.
					</p>

					{isIOS ? (
						<div className="bg-yellow-100 border border-yellow-300 rounded-md p-3">
							<p className="font-medium">iOS instructions:</p>
							<ul className="list-disc ml-5 mt-1 text-xs">
								<li>Tap the share icon (square with arrow).</li>
								<li>
									Select <strong>“Open in Safari”</strong>.
								</li>
							</ul>
						</div>
					) : (
						<div className="bg-yellow-100 border border-yellow-300 rounded-md p-3">
							<p className="font-medium">Android instructions:</p>
							<ul className="list-disc ml-5 mt-1 text-xs">
								<li>Tap the 3-dot menu in the corner.</li>
								<li>
									Select <strong>“Open in Chrome”</strong> or your browser.
								</li>
							</ul>
						</div>
					)}
				</div>

				<div className="flex w-full gap-3 justify-between mt-4">
					<Button
						variant="outline"
						size="sm"
						onClick={handleCopyLink}
						className="border border-gray-300 bg-black text-white hoverScaleDownEffect"
					>
						<Copy className="w-4 h-4 mr-1" />
						Copy Link
					</Button>
					{!isIOS && (
						<Button
							variant="default"
							size="sm"
							onClick={handleManualRedirect}
							className="border border-gray-300 bg-black text-white hoverScaleDownEffect"
						>
							<ExternalLink className="w-4 h-4 mr-1" />
							Open In Browser
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default OpenInBrowserBanner;
