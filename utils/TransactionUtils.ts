import { getCreatorById } from "@/lib/actions/creator.actions";
import { analytics, db } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import * as Sentry from "@sentry/nextjs";

export const handleTransaction = async ({
	expertId,
	clientId,
	callId,
	duration,
	isVideoCall,
	toast,
	router,
	updateWalletBalance,
}: {
	expertId: string;
	clientId: string;
	callId: string;
	duration: string;
	isVideoCall: boolean;
	toast: any;
	router: any;
	updateWalletBalance: () => Promise<void>;
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

	const removeActiveCallId = () => {
		const activeCallId = localStorage.getItem("activeCallId");
		if (activeCallId) {
			localStorage.removeItem("activeCallId");
			console.log("activeCallId removed successfully");
		} else {
			console.warn("activeCallId was not found in localStorage");
		}
	};

	if (!clientId) {
		console.error("Client ID is undefined");
		return;
	}

	try {
		const [transactionResponse, creator] = await Promise.all([
			fetch(`/api/v1/calls/transaction/getTransaction?callId=${callId}`).then(
				(res) => res.json()
			),
			getCreatorById(expertId),
		]);

		if (transactionResponse) {
			toast({
				variant: "destructive",
				title: "Transaction Already Done",
				description: "Redirecting ...",
			});

			removeActiveCallId();
			await updateFirestoreSessions(clientId, callId, "ended");
			await updateFirestoreTransactionStatus(callId);
			logEvent(analytics, "call_ended", {
				callId: callId,
				duration: duration,
				type: isVideoCall,
			});

			return;
		}

		if (!creator) {
			console.error("Creator not found");
			return;
		}

		const rate = isVideoCall ? creator.videoRate : creator.audioRate;
		const amountToBePaid = ((parseFloat(duration) / 60) * rate).toFixed(2);

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

		removeActiveCallId();
		await updateFirestoreSessions(clientId, callId, "ended");
		await updateFirestoreTransactionStatus(callId);

		logEvent(analytics, "call_ended", {
			callId: callId,
			duration: duration,
			type: isVideoCall,
		});
	} catch (error) {
		Sentry.captureException(error);
		const creatorURL = localStorage.getItem("creatorURL");

		console.error("Error handling wallet changes:", error);
		toast({
			variant: "destructive",
			title: "Error",
			description: "An error occurred while processing the Transactions",
		});
		router.push(`${creatorURL ? creatorURL : "/home"}`);
	} finally {
		// Update wallet balance after transaction
		router.push(`/feedback/${callId}`);
		updateWalletBalance();
	}
};
