import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";

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

	const creatorId = "664c90ae43f0af8f1b3d5803";
	// const creatorId = expert?.user_id;
	const clientId = call?.state?.createdBy?.id;

	if (!clientId) {
		console.error("Client ID is undefined");
		return;
	}

	const initiateTransaction = async () => {
		try {
			const response = await fetch("/api/v1/calls/transaction/initiate", {
				method: "POST",
				body: JSON.stringify({
					callId,
					clientId,
					creatorId,
					duration,
					isVideoCall,
				}),
				headers: { "Content-Type": "application/json" },
			});

			const result = await response.json();

			if (result.message === "Transaction already done") {
				toast({
					title: "Transaction Done",
					description: "Redirecting ...",
				});
				router.push(`/feedback/${callId}`);
				updateWalletBalance();
				return;
			}

			// Log the event
			logEvent(analytics, "call_ended", {
				callId: call.id,
				duration: duration,
				type: call?.type === "default" ? "video" : "audio",
			});

			// Remove the activeCallId after a successful transaction
			localStorage.removeItem("activeCallId");
		} catch (error) {
			console.error("Error handling transaction:", error);
			toast({
				title: "Error",
				description: "An error occurred while processing the Transactions",
			});
			router.push("/");
		} finally {
			// Update wallet balance after enqueuing the job
			router.push(`/feedback/${callId}`);
			updateWalletBalance();
		}
	};

	// Attach the beforeunload event listener
	const handleBeforeUnload = (event: BeforeUnloadEvent) => {
		// Attempt to send the request using navigator.sendBeacon
		const data = {
			callId,
			clientId,
			creatorId,
			duration,
			isVideoCall,
		};
		const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
		navigator.sendBeacon("/api/v1/calls/transaction/initiate", blob);

		// Add a custom message if needed
		event.preventDefault();
		event.returnValue = "";
	};

	window.addEventListener("beforeunload", handleBeforeUnload);

	try {
		await initiateTransaction();
	} finally {
		window.removeEventListener("beforeunload", handleBeforeUnload);
	}
};
