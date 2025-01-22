import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import { clientUser, creatorUser } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import {
	InfiniteData,
	QueryObserverResult,
	RefetchOptions,
} from "@tanstack/react-query";
import BlockUnblockAlert from "../alerts/BlockUnblockAlert";

const BlockUnblockButton = ({
	creatorId,
	clientId,
	currentCreator,
	refetch,
	refreshCurrentUser,
}: {
	currentCreator: clientUser | creatorUser | null;
	creatorId: string;
	clientId: string;
	refetch?: (
		options?: RefetchOptions
	) => Promise<QueryObserverResult<InfiniteData<any, unknown>, Error>>;
	refreshCurrentUser?: () => Promise<void>;
}) => {
	const queryClient = useQueryClient();
	// Use state to track blocked status, initialized from currentCreator
	const [isBlocked, setIsBlocked] = useState(false);
	const [showAlert, setShowAlert] = useState(false);

	// Sync the blocked state whenever currentCreator's blocked list updates
	useEffect(() => {
		const clientIsBlocked =
			currentCreator?.blocked?.includes(clientId) || false;
		setIsBlocked(clientIsBlocked);
	}, [currentCreator, clientId]);

	// Block or unblock a client
	const handleBlockClient = async () => {
		try {
			const action = isBlocked ? "unblock" : "block";
			const response = await axios.put(
				`${backendBaseUrl}/creator/blockUser/${creatorId}`,
				{
					blockClientId: clientId,
					action: action,
				}
			);

			if (response.data.success) {
				setIsBlocked(!isBlocked);

				// Invalidate queries for blocked and all clients
				queryClient.invalidateQueries({
					queryKey: ["get_blocked_clients", creatorId],
				});
				queryClient.invalidateQueries({ queryKey: ["get_clients"] });

				// Call refetch if passed
				if (refreshCurrentUser) await refreshCurrentUser();
				if (refetch) await refetch();
			}
		} catch (error) {
			console.error("Error updating blocked status:", error);
		} finally {
			setShowAlert(false); // Close alert after action
		}
	};

	return (
		<>
			<button
				onClick={() => setShowAlert(true)}
				className="hoverScaleDownEffect flex items-center gap-2 px-4 py-2 bg-green-1 lg:bg-black rounded-md lg:rounded-full text-white focus:outline-none"
			>
				{isBlocked ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-4 text-white"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
						/>
					</svg>
				) : (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-4 text-white"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
						/>
					</svg>
				)}
				<span className="text-sm">{isBlocked ? "Unblock" : "Block"}</span>
			</button>

			{showAlert && (
				<BlockUnblockAlert
					isBlocked={isBlocked}
					onConfirm={handleBlockClient}
					onCancel={() => setShowAlert(false)}
				/>
			)}
		</>
	);
};

export default BlockUnblockButton;
