"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DownloadPage() {
	useEffect(() => {
		const apkUrl = "/downloads/official.apk";
		const link = document.createElement("a");
		link.href = apkUrl;
		link.download = "official.apk";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, []);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-6">
			<h1 className="text-4xl font-bold text-gray-800 mb-4">
				Download Our Android App
			</h1>
			<p className="text-lg text-gray-600 mb-6">
				Your download should start automatically. If not, click the button
				below.
			</p>
			<a href="/downloads/official.apk" download="official.apk">
				<Button className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700">
					Download APK
				</Button>
			</a>
		</div>
	);
}
