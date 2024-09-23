import { db } from "@/lib/firebase";
import * as Sentry from "@sentry/nextjs";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export const transactionHandler = async ({
	expertId,
	clientId,
	callId,
	duration,
	isVideoCall,
}: {
	expertId: string;
	clientId: string;
	callId: string;
	duration: string;
	isVideoCall: boolean;
}) => {
	const updateFirestoreSessions = async (
		userId: string,
		callId: string,
		status: string
	) => {
		try {
			const SessionDocRef = doc(db, "sessions", userId);
			const SessionDoc = await getDoc(SessionDocRef);
			if (SessionDoc.exists()) {
				await updateDoc(SessionDocRef, {
					ongoingCall: { id: callId, status: status },
				});
			} else {
				await setDoc(SessionDocRef, {
					ongoingCall: { id: callId, status: status },
				});
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error updating Firestore Sessions: ", error);
		}
	};

	const updateFirestoreTransactionStatus = async (callId: string) => {
		try {
			const transactionDocRef = doc(db, "transactions", expertId);
			const transactionDoc = await getDoc(transactionDocRef);
			if (transactionDoc.exists()) {
				await updateDoc(transactionDocRef, {
					previousCall: { id: callId, status: "success" },
				});
			} else {
				await setDoc(transactionDocRef, {
					previousCall: { id: callId, status: "success" },
				});
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error updating Firestore Transactions: ", error);
		}
	};

	// Check if a transaction already exists for the given callId
	const transactionResponse = await fetch(
		`/api/v1/calls/transaction/getTransaction?callId=${callId}`
	);
	const existingTransaction = await transactionResponse.json();
	// If a transaction exists and any of the callDetails have isDone: true, return early
	if (existingTransaction) {
		console.log("Transaction for this callId has already been completed.");
		await updateFirestoreTransactionStatus(callId);
		await updateFirestoreSessions(clientId, callId, "ended");
		return;
	}

	try {
		const creatorResponse = await fetch(`/api/v1/creator/getUserById`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: expertId }),
		});
		const creator = await creatorResponse.json();

		if (!creator) {
			console.error("Creator not found.");
			return;
		}

		const rate = isVideoCall ? creator.videoRate : creator.audioRate;
		const amountToBePaid = ((parseFloat(duration) / 60) * rate).toFixed(2);

		// Perform wallet transactions
		await Promise.all([
			fetch("/api/v1/wallet/payout", {
				method: "POST",
				body: JSON.stringify({
					userId: clientId,
					userType: "Client",
					amount: amountToBePaid,
				}),
				headers: { "Content-Type": "application/json" },
			}),
			fetch("/api/v1/wallet/addMoney", {
				method: "POST",
				body: JSON.stringify({
					userId: expertId,
					userType: "Creator",
					amount: (parseInt(amountToBePaid) * 0.8).toFixed(2),
				}),
				headers: { "Content-Type": "application/json" },
			}),
			fetch("/api/v1/calls/transaction/create", {
				method: "POST",
				body: JSON.stringify({
					callId,
					amountPaid: amountToBePaid,
					isDone: true,
					callDuration: parseInt(duration, 10),
				}),
				headers: { "Content-Type": "application/json" },
			}),
		]);

		await updateFirestoreTransactionStatus(callId);
		await updateFirestoreSessions(clientId, callId, "ended");
	} catch (error) {
		Sentry.captureException(error);
		console.error("Error handling wallet changes:", error);
	}
};
