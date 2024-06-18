import { getUserById } from "@/lib/actions/creator.actions";

// Define the transaction logic in a utility function
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
	const creatorId = "664c90ae43f0af8f1b3d5803";
	const clientId = call?.state?.createdBy?.id;

	if (!clientId) {
		console.error("Client ID is undefined");
		return;
	}

	const expert = call?.state?.members?.find(
		(member: any) => member.custom.type === "expert"
	);

	if (!expert?.user_id) {
		console.error("Creator ID is undefined");
		return;
	}

	try {
		const [transactionResponse, creator] = await Promise.all([
			fetch(`/api/v1/calls/transaction/getTransaction?callId=${callId}`).then(
				(res) => res.json()
			),
			getUserById(creatorId),
		]);

		if (transactionResponse) {
			toast({
				title: "Transaction Done",
				description: "Redirecting ...",
			});
			return;
		}

		if (!creator) {
			console.error("Creator not found");
			return;
		}

		const rate = isVideoCall ? creator.videoRate : creator.audioRate;
		const amountToBePaid = ((parseInt(duration, 10) / 60) * rate).toFixed(2);

		await Promise.all([
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
					amount: amountToBePaid,
				}),
				headers: { "Content-Type": "application/json" },
			}),
		]);

		// remove the activeCallId after transaction is done otherwise user will be redirected to this page and then transactons will take place
		localStorage.removeItem("activeCallId");
	} catch (error) {
		console.error("Error handling wallet changes:", error);
		toast({
			title: "Error",
			description: "An error occurred while processing the Transactions",
		});
		router.push("/");
	} finally {
		// Update wallet balance after transaction
		router.push(`/feedback/${callId}`);
		updateWalletBalance();
	}
};
