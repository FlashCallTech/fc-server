"use client";
import React, { useEffect, useState } from "react";
import { ChatTimerProvider } from "@/lib/context/ChatTimerContext";
import ChatInterface from "@/components/chat/ChatInterface";
import { backendBaseUrl } from "@/lib/utils";
import ChatProvider from "@/lib/context/ChatContext";
import { useParams } from "next/navigation";

const Page = () => {
	const { chatId, clientId, callId } = useParams();

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
		window.addEventListener("beforeunload", handleTabCloseWarning);
		window.addEventListener('pagehide', handleTabClose);
		window.addEventListener("unload", handleTabClose);
		return () => {
			window.removeEventListener("beforeunload", handleTabCloseWarning);
			window.addEventListener('pagehide', handleTabClose);
			window.removeEventListener("unload", handleTabClose);
		};
	}, [chatId]);

	return (
		<div>
			<ChatProvider
				chatId={chatId as string}
				callId={callId as string}
			>
				<ChatTimerProvider
					chatId={chatId as string}
					clientId={clientId as string}
				>
					<ChatInterface />
				</ChatTimerProvider>
			</ChatProvider>
		</div>
	);
};

export default Page;
