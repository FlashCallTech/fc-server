import { toast } from "@/components/ui/use-toast";
import { getUserById } from "@/lib/actions/creator.actions";
import CallTransactions from "@/lib/database/models/callTransactions.model";

// Import the CallTransaction model

export const handleTransaction = async ({
	duration,
	clientId,
	chatId,
	router,
	toast,
	updateWalletBalance,
}: {
	duration: string | undefined;
	clientId: string | undefined;
	chatId: string | string[];
	router: any;
	toast: any;
	updateWalletBalance: () => Promise<void>;
}) => {
	// console.log("duration in handleTransaction", duration);
	if (!duration) return;

	const creatorId = "664c90ae43f0af8f1b3d5803";

	try {
		const creator = await getUserById(creatorId);
		const rate = creator.chatRate;
		const amountToBePaid = (
			(parseInt(duration, 10) / (1000 * 60)) *
			rate
		).toFixed(2);
		// console.log("amount paid", amountToBePaid);
		// console.log("clientID: ", clientId)

		if (amountToBePaid && clientId) {
			console.log("1")
			const [existingTransaction] = await Promise.all([
				fetch(`/api/v1/calls/transaction/getTransaction?callId=${chatId}`).then(
					(res) => res.json()
				),
			]);

			if (existingTransaction) {
				console.log('2')
				await fetch("/api/v1/calls/transaction/update", {
					method: "PUT",
					body: JSON.stringify({
						callId: chatId,
						amountPaid: amountToBePaid,
						isDone: true,
						callDuration: parseInt(duration, 10),
					}),
				});
			} else {
				console.log("3")
				// Create a new document if no existing document is found
				await fetch("/api/v1/calls/transaction/create", {
					method: "POST",
					body: JSON.stringify({
						callId: chatId,
						amountPaid: amountToBePaid,
						isDone: true,
						callDuration: parseInt(duration, 10),
					}),
					headers: { "Content-Type": "application/json" },
				});
			}

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
						amount: amountToBePaid,
					}),
					headers: { "Content-Type": "application/json" },
				}),
			]);
		}
	} catch (error) {
		console.error("Error handling wallet changes:", error);
		toast({
			title: "Error",
			description: "An error occurred while processing the Transactions",
		});
		router.push("/");
	} finally {
		updateWalletBalance();
	}
};
