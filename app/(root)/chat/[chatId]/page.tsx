"use client";
import React, { useEffect, useState } from "react";
import { ChatTimerProvider } from "@/lib/context/ChatTimerContext";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import ChatInterface from "@/components/chat/ChatInterface";
import useEndChat from "@/hooks/useEndChat";
import { backendBaseUrl } from "@/lib/utils";

const Page = () => {
	const [queryParams, setQueryParams] = useState<{
		clientId: string | null;
		creatorId: string | null;
	}>({ clientId: null, creatorId: null });
	const { user2, chatId, handleEnd } = useEndChat();
	const {userType} = useCurrentUsersContext();

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
			// handleEnd(chatId as string, user2, userType!);
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
	}, [chatId, user2]);

	if (!queryParams.clientId || !queryParams.creatorId) {
		return null; // or Loading indicator or some error handling
	}

	return (
		<div>
			<ChatTimerProvider
				clientId={queryParams.clientId as string}
				creatorId={queryParams.creatorId as string}
			>
				<ChatInterface />
			</ChatTimerProvider>
		</div>
	);
};

export default Page;
