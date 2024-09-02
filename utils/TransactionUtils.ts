import { getCreatorById } from "@/lib/actions/creator.actions";
import { analytics, db } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import * as Sentry from "@sentry/nextjs";

export const handleTransaction = async ({
	call,
	callId,
	duration,
	isVideoCall,
	toast,
	router,
	updateWalletBalance,
}: {
	call: any;
	callId: string;
	duration: string;
	isVideoCall: boolean;
	toast: any;
	router: any;
	updateWalletBalance: () => Promise<void>;
}) => {
	const expert = call?.state?.members?.find(
		(member: any) => member.custom.type === "expert"
	);

	if (!expert?.user_id) {
		console.error("Creator ID is undefined");
		return;
	}

	const updateFirestoreTransactionStatus = async (callId: string) => {
		try {
			const transactionDocRef = doc(db, "transactions", expert?.user_id);
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
			console.error("Error updating Firestore timer: ", error);
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

	const creatorId = expert?.user_id;
	const clientId = call?.state?.createdBy?.id;

	if (!clientId) {
		console.error("Client ID is undefined");
		return;
	}

	try {
		const [transactionResponse, creator] = await Promise.all([
			fetch(`/api/v1/calls/transaction/getTransaction?callId=${callId}`).then(
				(res) => res.json()
			),
			getCreatorById(creatorId),
		]);

		if (transactionResponse) {
			toast({
				variant: "destructive",
				title: "Transaction Done",
				description: "Redirecting ...",
			});

			removeActiveCallId();

			return;
		}

		if (!creator) {
			console.error("Creator not found");
			return;
		}

		const rate = isVideoCall ? creator.videoRate : creator.audioRate;
		const amountToBePaid = ((parseFloat(duration) / 60) * rate).toFixed(2);
		const percentage = 0.2;
		const amountDeducted = (parseFloat(amountToBePaid) * percentage).toFixed(2);
		const netAmountForCreator = (
			parseFloat(amountToBePaid) - parseFloat(amountDeducted)
		).toFixed(2);

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
					userId: creatorId,
					userType: "Creator",
					amount: netAmountForCreator,
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
		updateFirestoreTransactionStatus(call?.id);

		logEvent(analytics, "call_ended", {
			callId: call.id,
			duration: duration,
			type: call?.type === "default" ? "video" : "audio",
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
		router.push(`${creatorURL ? creatorURL : "/"}`);
	} finally {
		// Update wallet balance after transaction
		router.push(`/feedback/${callId}`);
		updateWalletBalance();
	}
};
