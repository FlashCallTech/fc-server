import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

interface UserStatusContextType {
	userStatus: Record<string, string>; // Store statuses for multiple users
}

const UserStatusContext = createContext<UserStatusContextType | undefined>(
	undefined
);

export const UserStatusProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [userStatus, setUserStatus] = useState<Record<string, string>>({});
	const { toast } = useToast();
	const [notifyList, setNotifyList] = useState<Record<string, string>>({});

	// Only access localStorage on the client side
	useEffect(() => {
		if (typeof window !== "undefined") {
			const storedNotifyList = JSON.parse(
				localStorage.getItem("notifyList") || "{}"
			);
			setNotifyList(storedNotifyList);
		}
	}, []);

	useEffect(() => {
		const unsubscribeList: (() => void)[] = [];

		// Listen for changes in each user's status
		Object.entries(notifyList).forEach(([username, phone]) => {
			const docRef = doc(db, "userStatus", phone);
			const unsubscribe = onSnapshot(
				docRef,
				(docSnap) => {
					if (docSnap.exists()) {
						const data = docSnap.data();
						const status = data.status || "Offline";

						// Update user status in state
						setUserStatus((prevStatus) => ({
							...prevStatus,
							[phone]: status,
						}));

						// Handle notification when the user goes online
						if (status === "Online") {
							try {
								const notificationSound = new Audio("/sounds/statusChange.mp3");
								notificationSound.play().catch((error) => {
									console.error("Failed to play sound:", error);
								});

								toast({
									variant: "destructive",
									title: `${username} is now online`,
								});

								// Remove the notified user from the notifyList in state and localStorage
								setNotifyList((prevList) => {
									const updatedNotifyList = { ...prevList };
									delete updatedNotifyList[username];
									localStorage.setItem(
										"notifyList",
										JSON.stringify(updatedNotifyList)
									);
									return updatedNotifyList;
								});
							} catch (error) {
								console.error("Error handling notification:", error);
							}
						}
					}
				},
				(error) => {
					console.error("Error fetching status:", error);
				}
			);

			unsubscribeList.push(unsubscribe);
		});

		// Cleanup subscriptions on unmount
		return () => {
			unsubscribeList.forEach((unsubscribe) => unsubscribe());
		};
	}, [notifyList]); // Only re-run when notifyList changes

	return (
		<UserStatusContext.Provider value={{ userStatus }}>
			{children}
		</UserStatusContext.Provider>
	);
};

export const useUserStatus = () => {
	const context = useContext(UserStatusContext);
	if (context === undefined) {
		throw new Error("useUserStatus must be used within a UserStatusProvider");
	}
	return context;
};
