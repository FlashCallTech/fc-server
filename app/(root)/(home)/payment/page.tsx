"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import Loader from "@/components/shared/Loader";
import ContentLoading from "@/components/shared/ContentLoading";

interface Transaction {
	_id: string;
	amount: number;
	createdAt: string;
	type: "credit" | "debit";
}

const Home: React.FC = () => {
	const [btn, setBtn] = useState<"All" | "Credit" | "Debit">("All");
	const { walletBalance } = useWalletBalanceContext();
	const [rechargeAmount, setRechargeAmount] = useState("");
	const { user, isLoaded } = useUser();
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [transactions, setTransactions] = useState<Transaction[]>([]);

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRechargeAmount(event.target.value);
	};

	useEffect(() => {
		const fetchTransactions = async () => {
			try {
				setLoading(true);
				const response = await axios.get(
					`/api/v1/transaction/getUserTransactions?userId=${
						user?.publicMetadata?.userId
					}&filter=${btn.toLowerCase()}`
				);
				setTransactions(response.data);
			} catch (error) {
				console.error("Error fetching transactions:", error);
				setErrorMessage("Unable to fetch transactions");
			} finally {
				setLoading(false);
			}
		};

		if (user) {
			fetchTransactions();
		}
	}, [btn, user]);

	if (!isLoaded) return <Loader />;

	return (
		<div className="overflow-y-scroll no-scrollbar p-4 bg-white text-gray-800 w-full h-full">
			{/* Balance Section */}
			<section className="flex flex-col pb-5">
				<span className="w-fit text-2xl leading-7 font-bold">
					Rs. {walletBalance.toFixed(2)}
				</span>
				<h2 className="w-fit text-gray-500 font-normal leading-5">
					Total Balance
				</h2>
			</section>

			{/* Recharge Section */}
			<section className="flex flex-col gap-5 items-center justify-center md:items-start pb-7">
				<div className="w-[100%] flex justify-center items-center font-normal leading-5 border-[1px] rounded-lg p-4">
					<input
						type="text"
						placeholder="Enter amount in INR"
						value={rechargeAmount}
						onChange={handleInputChange}
						className="w-full flex-grow mr-2 outline-none"
					/>
					<Link href={`/recharge?amount=${rechargeAmount}`}>
						<button className="w-[88px] h-[32px] top-[241px] left-[236px] bg-gray-800 text-white font-bold leading-4 text-sm rounded-[6px]">
							Recharge
						</button>
					</Link>
				</div>
				<div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8 text-sm font-semibold leading-4 w-full">
					{["99", "199", "299", "499", "999", "2999"].map((amount) => (
						<button
							key={amount}
							className="px-4 py-3 border-2 border-black rounded shadow hover:bg-gray-200 dark:hover:bg-gray-800"
							style={{ boxShadow: "3px 3px black" }}
							onClick={() => setRechargeAmount(amount)}
						>
							₹{amount}
						</button>
					))}
				</div>
			</section>

			{/* Transaction History Section */}
			<section className="flex flex-col items-start justify-start gap-4 w-full h-fit">
				<h2 className=" text-gray-500 font-normal leading-7">
					Transaction History
				</h2>
				<div className="flex space-x-2  text-xs font-bold leading-4 w-fit">
					{["All", "Credit", "Debit"].map((filter) => (
						<button
							key={filter}
							onClick={() => setBtn(filter as "All" | "Credit" | "Debit")}
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
				<ul className="space-y-4 w-full">
					{!loading ? (
						transactions.length === 0 ? (
							<div className="flex flex-col items-center justify-center size-full text-xl flex-1 min-h-44 text-red-500 font-semibold">
								<span>No {btn} transactions Listed</span>
							</div>
						) : (
							transactions.map((transaction) => (
								<li
									key={transaction?._id}
									className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b-2"
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
										className={`font-bold text-sm leading-4 ${
											transaction?.type === "credit"
												? "text-green-500"
												: "text-red-500"
										}`}
									>
										₹{transaction?.amount.toFixed(2)}
									</p>
								</li>
							))
						)
					) : (
						<ContentLoading />
					)}
				</ul>
			</section>
		</div>
	);
};

export default Home;
