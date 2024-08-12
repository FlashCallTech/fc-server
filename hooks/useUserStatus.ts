import { useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

const useUserStatus = () => {
	const { currentUser } = useCurrentUsersContext();

	const updateUserStatus = async (online: boolean) => {
		if (!currentUser?._id) return;

		try {
			const userChatsRef = doc(db, "userchats", currentUser?._id as string);
			const userChatsSnapshot = await getDoc(userChatsRef);

			if (userChatsSnapshot.exists()) {
				const userChatsData = userChatsSnapshot.data();
				userChatsData.online = online;

				await updateDoc(userChatsRef, {
					online: userChatsData.online,
				});
			}
		} catch (error) {
			console.error("Error updating user status:", error);
		}
	};

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				updateUserStatus(false);
			} else {
				updateUserStatus(true);
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, []);
};

export default useUserStatus;
