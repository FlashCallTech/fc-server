"use client";

import React, { useState, useEffect } from "react";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import Loader from "@/components/shared/Loader";
import ContentLoading from "@/components/shared/ContentLoading";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { enterAmountSchema } from "@/lib/validator";
import { arrowLeft, arrowRight } from "@/constants/icons";
import SinglePostLoader from "@/components/shared/SinglePostLoader";

interface Transaction {
	_id: string;
	amount: number;
	createdAt: string;
	type: "credit" | "debit";
}

const Payment: React.FC = () => {
	const [btn, setBtn] = useState<"All" | "Credit" | "Debit">("All");
	const { walletBalance } = useWalletBalanceContext();
	const { user, isLoaded } = useUser();
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const router = useRouter();

	// 1. Define your form.
	const form = useForm<z.infer<typeof enterAmountSchema>>({
		resolver: zodResolver(enterAmountSchema),
		defaultValues: {
			rechargeAmount: "",
		},
	});

	// 2. Watch the form values.
	const rechargeAmount = form.watch("rechargeAmount");

	// 3. Define a submit handler.
	function onSubmit(values: z.infer<typeof enterAmountSchema>) {
		const rechargeAmount = values.rechargeAmount;
		router.push(`/recharge?amount=${rechargeAmount}`);
	}

	const fetchTransactions = async (page = 1) => {
		try {
			setLoading(true);
			const response = await axios.get(
				`/api/v1/transaction/getUserTransactions?userId=${
					user?.publicMetadata?.userId
				}&filter=${btn.toLowerCase()}&page=${page}&limit=10`
			);
			setTransactions(response.data.transactions);
			setTotalPages(response.data.totalPages);
		} catch (error) {
			console.error("Error fetching transactions:", error);
			setErrorMessage("Unable to fetch transactions");
		} finally {
			setTimeout(() => {
				setLoading(false);
			}, 1000);
		}
	};

	useEffect(() => {
		if (user) {
			fetchTransactions(page);
		}
	}, [btn, user, page]);

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

	const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

	if (!isLoaded) return <Loader />;

	return (
		<div className="flex flex-col pt-4 bg-white text-gray-800 w-full h-full">
			{/* Balance Section */}
			<section className="w-full flex flex-col pb-5 px-4 ">
				<span className="w-fit text-2xl leading-7 font-bold">
					Rs. {walletBalance.toFixed(2)}
				</span>
				<h2 className="w-fit text-gray-500 font-normal leading-5">
					Total Balance
				</h2>
			</section>

			{/* Recharge Section */}
			<section className="flex flex-col gap-5 items-center justify-center md:items-start pb-7 px-4 ">
				<div className="w-[100%] flex justify-center items-center font-normal leading-5 border-[1px] rounded-lg p-3">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="w-full flex items-center"
						>
							<FormField
								control={form.control}
								name="rechargeAmount"
								render={({ field }) => (
									<FormItem className="flex-grow mr-2">
										<FormControl>
											<Input
												placeholder="Enter amount in INR"
												{...field}
												className="w-full outline-none border-none focus-visible:ring-offset-0 focus-visible:!ring-transparent placeholder:text-grey-500"
												pattern="\d*"
												title="Amount must be a numeric value"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button
								type="submit"
								className="w-fit px-4 py-3 bg-gray-800 text-white font-bold leading-4 text-sm rounded-[6px] hover:bg-black/60"
							>
								Recharge
							</Button>
						</form>
					</Form>
				</div>
				<div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8 text-sm font-semibold leading-4 w-full px-5">
					{["99", "199", "299", "499", "999", "2999"].map((amount) => (
						<button
							key={amount}
							className="px-4 py-3 border-2 border-black rounded shadow hover:bg-gray-200 dark:hover:bg-gray-800"
							style={{ boxShadow: "3px 3px black" }}
							onClick={() => form.setValue("rechargeAmount", amount)}
						>
							₹{amount}
						</button>
					))}
				</div>
			</section>

			{/* Transaction History Section */}
			<section className="sticky top-16 bg-white z-30 w-full h-fit py-5 px-4 ">
				<div className="flex flex-col items-start justify-start gap-4 w-full h-fit">
					<h2 className=" text-gray-500 text-xl pt-4 font-normal leading-7">
						Transaction History
					</h2>
					<div className="flex space-x-2  text-xs font-bold leading-4 w-fit">
						{["All", "Credit", "Debit"].map((filter) => (
							<button
								key={filter}
								onClick={() => {
									setBtn(filter as "All" | "Credit" | "Debit");
									setPage(1); // Reset page to 1 when filter changes
								}}
								className={`px-5 py-1 border-2 border-black rounded-full ${
									filter === btn
										? "bg-gray-800 text-white"
										: "bg-white text-black dark:bg-gray-700 dark:text-white"
								}`}
							>
								{filter}
							</button>
						))}
					</div>
				</div>
			</section>

			{/* Transaction History List */}
			<ul className="space-y-4 w-full h-full px-4">
				{!loading ? (
					transactions.length === 0 ? (
						<p className="flex flex-col items-center justify-center size-full text-xl text-center flex-1 min-h-44 text-red-500 font-semibold">
							{errorMessage
								? errorMessage
								: `No transactions under ${btn} filter`}
						</p>
					) : (
						transactions.map((transaction) => (
							<li
								key={transaction?._id}
								className="animate-enterFromBottom flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b-2"
							>
								<div className="flex flex-col items-start justify-center gap-2">
									<p className="font-normal text-sm leading-4">
										Transaction ID <strong>{transaction?._id}</strong>
									</p>
									<p className="text-gray-500 font-normal text-xs leading-4">
										{new Date(transaction?.createdAt).toLocaleString()}
									</p>
								</div>
								<p
									className={`font-bold text-sm leading-4 w-fit whitespace-nowrap ${
										transaction?.type === "credit"
											? "text-green-500"
											: "text-red-500"
									} `}
								>
									{transaction?.type === "credit"
										? `+ ₹${transaction?.amount.toFixed(2)}`
										: `- ₹${transaction?.amount.toFixed(2)}`}
								</p>
							</li>
						))
					)
				) : (
					<SinglePostLoader />
				)}
			</ul>

			{/* Pagination Controls */}
			{transactions.length > 0 && (
				<div className="animate-enterFromBottom grid grid-cols-[0fr_3fr_0fr] gap-4 items-center sticky bottom-0 z-30 w-full px-4 py-2 bg-white">
					<button
						onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
						disabled={page === 1}
						className={`bg-green-1 text-white w-10 h-10 rounded-full p-2 hoverScaleEffect hover:bg-green-1  ${
							page === 1 ? "opacity-50 cursor-not-allowed" : ""
						}`}
					>
						{arrowLeft}
					</button>
					<div
						className={`flex gap-2 w-full md:w-fit mx-auto items-center  ${
							totalPages <= 6 ? "justify-center" : "justify-start"
						} px-4 py-2 overflow-x-scroll no-scrollbar`}
					>
						{pageNumbers.map((_, index) => (
							<button
								key={index}
								className={`${
									index + 1 === page && "!bg-green-1 text-white"
								} bg-black/10 w-5 h-5 rounded-full p-5 flex items-center justify-center hoverScaleEffect hover:bg-green-1 hover:text-white`}
								onClick={() => setPage(index + 1)}
							>
								{index + 1}
							</button>
						))}
					</div>
					<button
						onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
						disabled={page === totalPages}
						className={`bg-green-1 text-white w-10 h-10 rounded-full p-2 hoverScaleEffect hover:bg-green-1 ${
							page === totalPages ? "opacity-50 cursor-not-allowed" : ""
						}`}
					>
						{arrowRight}
					</button>
				</div>
			)}
		</div>
	);
};

export default Payment;
