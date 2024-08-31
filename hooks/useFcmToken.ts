import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { creatorUser } from "@/types";
import * as Sentry from "@sentry/nextjs";

const useFcmToken = () => {
	const fetchCreatorToken = async (creatorUser: creatorUser) => {
		try {
			// Reference to the specific document in the FCMtoken collection
			const tokenDocRef = doc(db, "fcmTokenWeb", creatorUser._id);

			// Fetch the document
			const tokenDoc = await getDoc(tokenDocRef);

			if (tokenDoc.exists()) {
				// Document found, return the token data
				return tokenDoc.data().token;
			} else {
				// Document not found
				console.error("No such token document!");
				return null;
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error fetching the token:", error);
			throw new Error("Failed to fetch the token.");
		}
	};

	return { fetchCreatorToken };
};

export default useFcmToken;
