import { toast, useToast } from "@/components/ui/use-toast";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { backendBaseUrl } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
		setLoading(true);
		const response = await fetch(`api/v1/transfer/initiate`, {
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
		if (!response.ok) {
			toast({
				variant: "destructive",
				title: "Withdraw Failed",
				description: "Any amount deducted will be returned",
				toastStatus: "negative",
			});
		}

		if (result.success) {
			toast({
				variant: "destructive",
				title: "Withdraw Initiated Successfully",
				description: result.message,
				toastStatus: "positive",
			});
			refreshCurrentUser();
		} else {
			if (result.message === "Minimum wallet balance required is 500")
				toast({
					variant: "destructive",
					title: "Withdraw Failed",
					description: "Minimum wallet balance required is 500",
					toastStatus: "negative",
				});
			else if (result.message === "Payment Setting Not Found") {
				toast({
					variant: "destructive",
					title: "Withdraw Failed",
					description: "Payment Setting Not Found",
					toastStatus: "negative",
				});
				router.push("/payment-settings");
			} else if (result.message === "KYC Verification Not Completed") {
				toast({
					variant: "destructive",
					title: "Withdraw Failed",
					description: "KYC Verification Not Completed",
					toastStatus: "negative",
				});
				router.push("/kyc");
			} else
				toast({
					variant: "destructive",
					title: "Withdraw Failed",
					description: result.message,
					toastStatus: "negative",
				});
		}
		setLoading(false);
	};

	return { initiateWithdraw, loadingTransfer };
};

export default usePayout;
