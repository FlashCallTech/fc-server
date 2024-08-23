import { getCreatorById } from "@/lib/actions/creator.actions";
import { analytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";

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
		const roundToNearestThousand = (num: number) => {
			return Math.round(num / 1000) * 1000;
		};
		const creator = await getCreatorById(creatorId);
		const rate = creator.chatRate;
		const amountToBePaid = (
			(roundToNearestThousand(parseInt(duration, 10)) / (1000 * 60)) *
			rate
		).toFixed(1);
		// console.log("amount paid", amountToBePaid);
		// console.log("clientID: ", clientId)

		if (amountToBePaid && clientId) {
			logEvent(analytics, "call_duration", {
				clientId: clientId,
				duration: duration,
			});

			const [existingTransaction] = await Promise.all([
				fetch(`/api/v1/calls/transaction/getTransaction?callId=${chatId}`).then(
					(res) => res.json()
				),
			]);

			if (existingTransaction) {
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
		localStorage.removeItem("user2");
	}
};
