"use client";

import React, { useState, useEffect } from "react";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import ContentLoading from "@/components/shared/ContentLoading";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { enterAmountSchema } from "@/lib/validator";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { creatorUser } from "@/types";
import { trackEvent } from "@/lib/mixpanel";
import Link from "next/link";
import { Button } from "../ui/button";

interface PaymentProps {
	callType?: string;
}

const Payment: React.FC<PaymentProps> = ({ callType }) => {
	const [creator, setCreator] = useState<creatorUser>();
	const { walletBalance } = useWalletBalanceContext();
	const { currentUser } = useCurrentUsersContext();
	const router = useRouter();
	const { clientUser } = useCurrentUsersContext();

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator) {
				setCreator(parsedCreator);
			}
		}
	}, []);

	useEffect(() => {
		trackEvent("Recharge_Page_Impression", {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
			Creator_ID: creator?._id,
			Walletbalace_Available: clientUser?.walletBalance,
		});
	}, []);

	const getRateForCallType = () => {
		let rate: number | undefined;
		switch (callType) {
			case "video":
				rate = creator?.videoRate ? parseFloat(creator.videoRate) : undefined;
				break;
			case "audio":
				rate = creator?.audioRate ? parseFloat(creator.audioRate) : undefined;
				break;
			case "chat":
				rate = creator?.chatRate ? parseFloat(creator.chatRate) : undefined;
				break;
			default:
				rate = 0;
				break;
		}
		return rate;
	};

	const amountToBeDisplayed = () => {
		const ratePerMinute = getRateForCallType();
		const costForFiveMinutes = ratePerMinute ? ratePerMinute * 5 : undefined;
		const amountDue = costForFiveMinutes
			? Math.max(0, costForFiveMinutes - walletBalance)
			: undefined;
		return amountDue;
	};
	const generateAmounts = () => {
		const rate = getRateForCallType();
		return rate
			? [5, 10, 15, 30, 40, 60].map((multiplier) =>
					(rate * multiplier).toFixed(2)
			  )
			: ["50", "99", "199", "499", "999", "1999", "2999", "3999", "49999"];
	};

	const tileClicked = (index: any) => {
		trackEvent("Recharge_Page_TileClicked", {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
			Creator_ID: creator?._id,
			Tile_Number: index,
			Walletbalace_Available: clientUser?.walletBalance,
		});
	};

	// 1. Define your form.
	const form = useForm<z.infer<typeof enterAmountSchema>>({
		mode: "onChange",
		resolver: zodResolver(enterAmountSchema),
		defaultValues: {
			rechargeAmount: "",
		},
	});

	// 2. Watch the form values.
	const rechargeAmount = form.watch("rechargeAmount");

	// 3. Define a submit handler.
	async function onSubmit(
		event: React.FormEvent<HTMLFormElement>,
		values: z.infer<typeof enterAmountSchema>
	) {
		event.preventDefault();
		const rechargeAmount = Number(values.rechargeAmount);

		router.push(`/recharge?amount=${rechargeAmount}`);

		return;
	}

	useEffect(() => {
		const amountPattern = /^\d*$/;
		if (!amountPattern.test(rechargeAmount)) {
			form.setError("rechargeAmount", {
				type: "manual",
				message: "Amount must be a numeric value",
			});
		} else {
			form.clearErrors("rechargeAmount");
		}
	}, [rechargeAmount, form]);

	const creatorURL = localStorage.getItem("creatorURL");

	return (
		<div className="sticky top-0 md:top-[76px] bg-white z-30 flex flex-col  text-gray-800 w-full h-full p-4 gap-5">
			<section className="flex items-center gap-4 -ml-1">
				<Link
					href={`${creatorURL ? creatorURL : "/home"}`}
					className="text-xl font-bold"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-6"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15.75 19.5 8.25 12l7.5-7.5"
						/>
					</svg>
				</Link>
				<h1 className="text-xl md:text-3xl font-bold">User Wallet</h1>
			</section>

			{/* Balance Section */}
			<div className="flex flex-col p-5 bg-white rounded-lg shadow border border-gray-100 w-full gap-2">
				{currentUser ? (
					<>
						<h2 className="w-fit text-gray-500 font-normal leading-5">
							Total Balance
						</h2>
						<span className="w-fit text-3xl text-green-1 leading-7 font-bold">
							Rs. {walletBalance.toFixed(2)}
						</span>
					</>
				) : (
					<>
						<span className="w-fit text-2xl leading-7 font-bold">
							Hey There
						</span>
						<h2 className="w-fit text-gray-500 font-normal leading-5">
							Authenticate To Continue
						</h2>
					</>
				)}
			</div>

			{/* Recharge Section */}
			<section className="flex flex-col gap-5 items-start justify-center shadow border border-gray-100 p-5">
				<h2 className="w-fit text-gray-500 font-normal leading-5">Add Money</h2>
				<Form {...form}>
					<form className="w-full flex items-center justify-center text-center text-3xl leading-7 font-bold text-green-1">
						<span className="text-3xl">₹</span>

						<FormField
							control={form.control}
							name="rechargeAmount"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Input
											type="number"
											placeholder="0.00"
											min={0}
											{...field}
											className="max-w-28 placeholder:text-gray-300 text-3xl border-none outline-none ring-transparent hover:bg-transparent "
											pattern="\d*"
											title="Amount must be a numeric value"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>

					<section className="mx-auto">
						{/* Display the amount due message if there's an amount due */}
						{amountToBeDisplayed() !== undefined && (
							<p className="text-red-500">
								₹{amountToBeDisplayed()?.toFixed(2)} more required for 5 minutes
								of {callType}
							</p>
						)}
					</section>
					<div className="grid grid-cols-3 gap-6 md:gap-8 text-sm font-semibold leading-4 w-full">
						{generateAmounts().map((amount, index) => (
							<button
								key={amount}
								className={`capitalize text-sm font-medium p-2.5 rounded-md border border-gray-300 hoverScaleDownEffect hover:text-white hover:bg-green-1 ${
									amount === form.getValues("rechargeAmount") &&
									"bg-green-1 text-white"
								}`}
								onClick={() => {
									form.setValue("rechargeAmount", amount);
									tileClicked(index);
								}}
							>
								₹ {amount}
							</button>
						))}
					</div>

					<Button
						disabled={!currentUser || !rechargeAmount || rechargeAmount === "0"}
						onClick={(event: any) =>
							form.handleSubmit((values) => onSubmit(event, values))(event)
						}
						className={`${
							(!rechargeAmount || rechargeAmount === "0") &&
							"!cursor-not-allowed opacity-80"
						} w-full max-w-md mt-2 bg-green-1 text-white mx-auto hoverScaleDownEffect`}
					>
						Recharge
					</Button>
				</Form>
			</section>
		</div>
	);
};

export default Payment;
