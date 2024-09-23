"use client";

import Payment from "@/components/client/payment";
import Withdraw from "@/components/creator/Withdraw";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const PaymentsPage = () => {
	const router = useRouter();
	const { toast } = useToast();
	const { userType, currentUser } = useCurrentUsersContext();

	useEffect(() => {
		if (!currentUser) {
			router.push("/home");
			toast({
				variant: "destructive",
				title: "Authentication Required",
				description: "Redirecting Back...",
			});
		}
	}, [currentUser?._id]);
	const searchParams = useSearchParams();

	// Retrieve the `callType` query parameter
	const callType = searchParams.get("callType") || undefined;
	return (
		<section className="size-full">
			{userType !== "creator" ? (
				<Payment callType={callType} /> // Pass the `callType` prop to Payment
			) : (
				<Withdraw />
			)}
		</section>
	);
};
export default PaymentsPage;
