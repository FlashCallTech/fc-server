"use client";

import Payment from "@/components/client/payment";
import Withdraw from "@/components/creator/Withdraw";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const PaymentsPage = () => {
	const router = useRouter();
	const { toast } = useToast();
	const { userType, currentUser } = useCurrentUsersContext();
	useEffect(() => {
		if (!currentUser) router.push("/");
		toast({
			variant: "destructive",
			title: "Authentication Required",
			description: "Redirecting Back...",
		});
	}, [currentUser?._id]);
	return (
		<section className="size-full">
			{userType !== "creator" ? <Payment /> : <Withdraw />}
		</section>
	);
};

export default PaymentsPage;
