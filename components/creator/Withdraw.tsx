"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ContentLoading from "@/components/shared/ContentLoading";
import { Button } from "@/components/ui/button";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import SinglePostLoader from "../shared/SinglePostLoader";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";

interface Transaction {
	_id: string;
	amount: number;
	createdAt: string;
	type: "credit" | "debit";
}

const Withdraw: React.FC = () => {
	const [btn, setBtn] = useState<"All" | "Credit" | "Debit">("All");
	const { creatorUser } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [transactions, setTransactions] = useState<Map<string, Transaction[]>>(
		new Map()
	);
	const [isSticky, setIsSticky] = useState(false);
	const stickyRef = useRef<HTMLDivElement>(null);

	const handleScroll = () => {
		if (stickyRef.current) {
			setIsSticky(window.scrollY > stickyRef.current.offsetTop);
		}
	};

	useEffect(() => {
		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const fetchTransactions = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`/api/v1/transaction/getCreatorTransactionByIdAndType?userId=${
					creatorUser?._id
				}&filter=${btn.toLowerCase()}`
			);
			const transactionsByDate = response.data.transactions.reduce(
				(acc: Map<string, Transaction[]>, transaction: Transaction) => {
					const date = new Date(transaction.createdAt).toLocaleDateString(
						"en-GB",
						{
							day: "2-digit",
							month: "short",
							year: "numeric",
						}
					);
					if (!acc.has(date)) {
						acc.set(date, []);
					}
					acc.get(date)?.push(transaction);
					return acc;
				},
				new Map()
			);
			setTransactions(transactionsByDate);
		} catch (error) {
			console.error("Error fetching transactions:", error);
			setErrorMessage("Unable to fetch transactions");
		} finally {
			setTimeout(() => {
				setLoading(false);
			}, 500);
		}
	};

	useEffect(() => {
		if (creatorUser) {
			fetchTransactions();
		}
	}, [btn, creatorUser]);

	if (!creatorUser?._id)
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);

	return (
		<>
			<div className="flex flex-col pt-3  text-gray-800 w-full h-full rounded-xl ">
				{/* Sticky Balance and Recharge Section */}
				<section
					ref={stickyRef}
					className={`flex flex-col gap-5 items-center justify-center md:items-start px-4 ${
						isSticky ? "sticky top-16 z-30 bg-white pt-11 pb-7" : "p-0"
					}`}
				>
					{/* Balance Section */}
					<div className="w-full flex flex-col items-center justify-center">
						<p>
							Welcome,
							<br />
						</p>
						<p className="font-bold">
							{creatorUser?.firstName} {creatorUser?.lastName}
						</p>
					</div>

					{/* Recharge Section */}
					<div className="flex flex-col gap-5 w-full items-center justify-center md:items-start">
						<div
							className={`w-[100%] flex justify-between items-center font-normal leading-5 border-[1px] rounded-lg p-3 bg-white shadow ${
								isSticky ? "flex-row" : "flex-col"
							} relative`}
						>
							<div
								className={
									isSticky
										? "flex flex-col items-start pl-1"
										: "flex flex-col items-center"
								}
							>
								<span
									className={`${isSticky ? "text-[13px]" : "text-[13px]"} `}
								>
									Wallet Balance
								</span>
								<p
									className={`text-green-600 ${
										isSticky
											? "text-[20px] font-bold"
											: "text-[25px] font-extrabold"
									} ${isSticky ? "p-0" : "p-2"} `}
								>
									₹ {walletBalance.toFixed(2)}
								</p>
							</div>
							{isSticky && (
								<Button
									type="submit"
									className="right-0 w-auto px-4 py-3 shadow bg-green-600 text-white font-bold leading-4 text-sm rounded-[6px] hover:bg-green-700"
								>
									Withdraw
								</Button>
							)}
						</div>
						{!isSticky && (
							<Button
								type="submit"
								className="w-full px-4 bg-green-600 text-white font-bold leading-4 text-sm rounded-[6px] hover:bg-green-700"
							>
								Withdraw
							</Button>
						)}
					</div>
				</section>

				{/* Transaction History Section */}
				<section className="w-full px-4 pb-5">
					<div className="flex flex-col items-start justify-start gap-2 w-full h-fit">
						<h2 className="text-gray-500 text-xl pt-7 pb-2 font-normal leading-7">
							Transaction History
						</h2>
						<div className="flex space-x-2 text-xs font-bold leading-4 w-fit">
							{["All", "Credit", "Debit"].map((filter) => (
								<button
									key={filter}
									onClick={() => {
										setBtn(filter as "All" | "Credit" | "Debit");
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
				<ul className="flex flex-col items-center justify-start space-y-4 w-full h-full px-4 py-5 ">
					{!loading ? (
						transactions.size === 0 ? (
							<p className="flex flex-col items-center justify-center size-full text-xl text-center flex-1 min-h-44 text-red-500 font-semibold">
								{errorMessage
									? errorMessage
									: `No transactions under ${btn} filter`}
							</p>
						) : (
							Array.from(transactions.keys()).map((date) => (
								<li
									key={date}
									className="p-4 bg-white rounded-lg shadow w-full animate-enterFromBottom"
								>
									<h3 className="text-base items-start font-normal  text-gray-400">
										{date}
									</h3>
									{transactions.get(date)?.map((transaction, index, arr) => (
										<div
											key={transaction._id}
											className={`flex justify-between items-start lg:items-center py-4 left-0 dark:bg-gray-800 ${
												index < arr.length - 1 ? "border-b-2" : ""
											}`}
										>
											<div className="flex flex-wrap flex-col items-start justify-center gap-2">
												<p className="font-normal text-xs leading-4">
													Transaction ID{" "}
													<span className="text-sm font-semibold">
														{transaction._id}
													</span>
												</p>
												<p className=" text-gray-400 font-normal text-xs leading-4">
													{new Date(transaction.createdAt).toLocaleTimeString()}
												</p>
											</div>
											<p
												className={`font-bold text-sm leading-4 w-fit whitespace-nowrap ${
													transaction.type === "credit"
														? "text-green-500"
														: "text-red-500"
												} `}
											>
												{transaction.type === "credit"
													? `+ ₹${transaction.amount.toFixed(2)}`
													: `- ₹${transaction.amount.toFixed(2)}`}
											</p>
										</div>
									))}
								</li>
							))
						)
					) : (
						<ContentLoading />
					)}
				</ul>
			</div>
		</>
	);
};

export default Withdraw;
