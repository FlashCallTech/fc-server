"use client";

import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export type SuccessProps = {
	redirect?: string;
	event?: string;
};

const Success = ({
	redirect = "payment",
	event = "Amount Added",
}: SuccessProps) => {
	const router = useRouter();
	const creatorURL = localStorage.getItem("creatorURL");
	const redirectURL = `/${redirect}`;
	const { updateWalletBalance } = useWalletBalanceContext();
	useEffect(() => {
		localStorage.removeItem("cashfree_order_id");
		updateWalletBalance();
		setTimeout(() => {
			router.push(`${creatorURL ? creatorURL : redirectURL}`);
		}, 1000);
	}, [redirect, router]);

	return (
		<div className="flex flex-col items-center justify-center min-w-full h-full gap-7">
			<Image
				src="/images/success.png"
				alt="success"
				height={150}
				width={150}
				className="size-auto"
			/>
			<div className="flex flex-col items-center justify-center gap-2 tracking-wider">
				<span className="font-semibold text-xl">{event}</span>
				<span className="font-semibold text-lg text-green-1">Successfully</span>
			</div>
		</div>
	);
};

export default Success;
