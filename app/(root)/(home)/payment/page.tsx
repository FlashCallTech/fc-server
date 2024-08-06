"use client";

import Payment from "@/components/client/payment";
import Withdraw from "@/components/creator/Withdraw";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

const page = () => {
	const { userType } = useCurrentUsersContext();
	return (
		<section className="size-full">
			{userType !== "creator" ? <Payment /> : <Withdraw />}
		</section>
	);
};

export default page;
