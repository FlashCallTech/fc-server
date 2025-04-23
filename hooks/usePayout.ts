import { useToast } from "@/components/ui/use-toast";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { backendBaseUrl } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

const usePayout = () => {
	const [loadingTransfer, setLoading] = useState<boolean>(false);
	const router = useRouter();
	const { refreshCurrentUser } = useCurrentUsersContext();
	const { toast } = useToast();

	const initiateWithdraw = async (
		creatorId: string,
		phone: string,
		amount: number
	) => {
		try {
			setLoading(true);
			const response = await fetch(`${backendBaseUrl}/withdraw/initiate`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: creatorId,
					phone,
					amount,
				}),
			});

			const result = await response.json();

			if (result.success) {
				toast({
					variant: "destructive",
					title: "Withdraw Initiated Successfully",
					description: result.message,
					toastStatus: "positive",
				});
				refreshCurrentUser();
			} else {
				toast({
					variant: "destructive",
					title: "Withdraw Failed",
					description: result.message || "Unkown Error",
					toastStatus: "negative",
				});
			}

			result.message === "Payment Setting Not Found" && router.push("/payment-settings");
			result.message === "KYC Verification Not Completed" && router.push("/kyc");

		} catch (error) {
			toast({
				variant: "destructive",
				title: "Withdraw Failed",
				description: "Any amount deducted will be returned",
				toastStatus: "negative",
			});
		} finally {
			setLoading(false);
		}
	};

	return { initiateWithdraw, loadingTransfer };
};

export default usePayout;
