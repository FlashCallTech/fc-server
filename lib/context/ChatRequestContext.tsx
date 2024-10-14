import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, query, where, onSnapshot, QuerySnapshot } from "firebase/firestore";
import useChatRequest from "@/hooks/useChatRequest";
import { useCurrentUsersContext } from "./CurrentUsersContext";
import { creatorUser } from "@/types";
import ChatRequest from "@/components/chat/ChatRequest";

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
	let collectionUnsubscribe: (() => void) | undefined;
	let docUnsubscribe: (() => void) | undefined;

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

	// Collection-level listener to find a pending chat request
	useEffect(() => {
		if ((!currentCreator && !creatorUser) || chatRequest) return;

		const q = query(
			chatRequestsRef,
			where("creatorId", "==", currentCreator?._id || creatorUser?._id),
			where("status", "==", "pending")
		);

		collectionUnsubscribe = onSnapshot(
			q,
			(snapshot: QuerySnapshot) => {
				const chatRequests = snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				}));
				if (chatRequests.length > 0) {
					setChatRequest(chatRequests[0]);
					if (collectionUnsubscribe) collectionUnsubscribe(); // Stop the collection listener

					// Start listening to changes in this specific document
					const chatRequestDoc = doc(chatRequestsRef, chatRequests[0].id);
					docUnsubscribe = onSnapshot(chatRequestDoc, (docSnapshot) => {
						if (docSnapshot.exists()) {
							const updatedRequest: any = { id: docSnapshot.id, ...docSnapshot.data() };
							// setChatRequest(updatedRequest);

							// Stop the listener if the status is now "accepted"
							if (updatedRequest.status !== "pending" && docUnsubscribe) {
								docUnsubscribe();
								setChatRequest(null); // Clear the state
							}
						}
					});
				} else {
					setChatRequest(null); // Clear chatRequest if no data
				}
			},
			(error) => {
				console.error("Snapshot listener error: ", error);
			}
		);

		return () => collectionUnsubscribe && collectionUnsubscribe(); // Cleanup collection listener
	}, [currentCreator, creatorUser, chatRequest]);

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
