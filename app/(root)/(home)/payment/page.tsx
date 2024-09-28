"use client";

import Payment from "@/components/client/payment";
import Withdraw from "@/components/creator/Withdraw";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useSearchParams } from "next/navigation";

const PaymentsPage = () => {
	const { userType } = useCurrentUsersContext();

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
