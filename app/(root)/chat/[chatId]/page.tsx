"use client";
import React, { useEffect, useState } from "react";
import { ChatTimerProvider } from "@/lib/context/ChatTimerContext";
import ChatInterface from "@/components/chat/ChatInterface";
import { backendBaseUrl } from "@/lib/utils";
import ChatProvider from "@/lib/context/ChatContext";
import { useParams } from "next/navigation";

const Page = () => {
	const [queryParams, setQueryParams] = useState<{
		clientId: string | null;
		creatorId: string | null;
	}>({ clientId: null, creatorId: null });
	const { chatId } = useParams();

	let isTabClosing = false;

	const handleTabCloseWarning = (event: BeforeUnloadEvent) => {
		event.preventDefault();
		isTabClosing = true;
	};

	const handleTabClose = () => {
		if (isTabClosing) {
			const data = chatId;
			const url = `${backendBaseUrl}/endChat/endChat`; // Example endpoint
			navigator.sendBeacon(url, data as string);
		}
	};

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const clientId = params.get("clientId");
		const creatorId = params.get("creatorId");
		setQueryParams({ clientId, creatorId });
	}, []);

	useEffect(() => {
		window.addEventListener("beforeunload", handleTabCloseWarning);
		window.addEventListener("unload", handleTabClose);
		return () => {
			window.removeEventListener("beforeunload", handleTabCloseWarning);
			window.removeEventListener("unload", handleTabClose);
		};
	}, [chatId]);

	if (!queryParams.clientId || !queryParams.creatorId) {
		return null; // or Loading indicator or some error handling
	}

	return (
		<div>
			<ChatProvider chatId={chatId as string}>
				<ChatTimerProvider
					clientId={queryParams.clientId as string}
					creatorId={queryParams.creatorId as string}
					chatId={chatId as string}
				>
					<ChatInterface />
				</ChatTimerProvider>
			</ChatProvider>
		</div>
	);
};

export default Page;
