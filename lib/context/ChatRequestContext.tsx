import React, { createContext, useContext, useState, useEffect } from "react";
import { query, where, onSnapshot, QuerySnapshot } from "firebase/firestore";
import useChatRequest from "@/hooks/useChatRequest";
import { useCurrentUsersContext } from "./CurrentUsersContext";
import { creatorUser } from "@/types";
import ChatRequest from "@/components/chat/ChatRequest";
import { trackEvent } from "../mixpanel";

const ChatRequestContext = createContext<any>(null);

export const useChatRequestContext = () => {
	const context = useContext(ChatRequestContext);
	if (!context) {
		throw new Error(
			"useChatRequestContext must be used within a ChatRequestProvider"
		);
	}
	return context;
};

export const ChatRequestProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [chatRequest, setChatRequest] = useState<any>(null);
	const { chatRequestsRef } = useChatRequest();
	const [currentCreator, setCurrentCreator] = useState<creatorUser>();
	const [currentCreatorId, setCurrentCreatorId] = useState<string>();
	const { creatorUser, currentUser } = useCurrentUsersContext();

	// Load the current creator from localStorage
	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			setCurrentCreator(parsedCreator);
		}
	}, []);

	useEffect(() => {
		const currentUser = localStorage.getItem("currentUserID");
		if (currentUser) {
			setCurrentCreatorId(currentUser);
		}
	}, []);

	// Listen for chat requests
	useEffect(() => {
		if (!currentCreator && !creatorUser) return; // Only subscribe if currentCreator is available

		const q = query(
			chatRequestsRef,
			where("creatorId", "==", currentCreator?._id || creatorUser?._id),
			where("status", "==", "pending")
		);

		const unsubscribe = onSnapshot(
			q,
			(snapshot: QuerySnapshot) => {
				const chatRequests = snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				}));
				if (chatRequests.length > 0) {
					setChatRequest(chatRequests[0]);
					// trackEvent('Creator_Chat_Initiated', {
					// 	Creator_ID: chatRequests[0].creatorId,
					// })
				} else {
					setChatRequest(null); // Clear chatRequest if no data
				}
			},
			(error) => {
				console.error("Snapshot listener error: ", error);
				// Optionally, handle error cases
			}
		);

		return () => unsubscribe(); // Cleanup subscription on component unmount or when dependencies change
	}, []); // Dependencies

	return (
		<ChatRequestContext.Provider value={{ chatRequest, setChatRequest }}>
			{currentCreatorId === creatorUser?._id && chatRequest ? (
				<ChatRequest chatRequest={chatRequest} />
			) : (
				children
			)}
		</ChatRequestContext.Provider>
	);
};
