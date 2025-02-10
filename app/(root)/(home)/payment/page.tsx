"use client";

import Payment from "@/components/client/Payment";
import Withdraw from "@/components/creator/Withdraw";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useSearchParams } from "next/navigation";

const PaymentsPage = () => {
	const { userType } = useCurrentUsersContext();

	const searchParams = useSearchParams();

	// Retrieve the `callType` query parameter
	const callType = searchParams.get("callType") || undefined;
	console.log(callType);
	return (
		<section className="size-full">
			{userType !== "creator" ? <Payment callType={callType} /> : <Withdraw />}
		</section>
	);
};
export default PaymentsPage;
