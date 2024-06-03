"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const Home: React.FC = () => {
	const [btn, setBtn] = useState("All");

	const [rechargeAmount, setRechargeAmount] = useState("");

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRechargeAmount(event.target.value);
	};

	return (
		<div className="overflow-y-scroll no-scrollbar p-4 bg-white text-gray-800">
			{/* Balance Section */}
			<section className="flex flex-col pb-5">
				<h1 className="w-[91px] h-[28px] top-[159px] left-[16px] text-2xl leading-7 font-bold">
					Rs. 0.00
				</h1>
				<h2 className="w-[97px] h-[18px] top-[191px] left-[16px] text-gray-500 font-normal leading-5">
					Total Balance
				</h2>
			</section>

			{/* Recharge Section */}
			<section className="flex flex-col items-center justify-center pb-7">
				<div className="w-[100%] h-[56px] top-[229px] left-[16px] flex justify-center items-center font-normal leading-5 border-[1px] rounded-[8px] px-2 pb-9">
					<input
						type="text"
						placeholder="Enter amount in INR"
						value={rechargeAmount}
						onChange={handleInputChange}
						className="w-[146px] h-[18px] top-[248px] left-[32px] flex-grow mr-2"
					/>
					<Link href={`/recharge?amount=${rechargeAmount}`}>
						<button className="w-[88px] h-[32px] top-[241px] left-[236px] bg-gray-800 text-white font-bold leading-4 text-sm rounded-[6px]">
							Recharge
						</button>
					</Link>
				</div>
				<div className="grid grid-cols-3 gap-6 m:gap-8 md:grid-cols-6 md:gap-8 text-sm m:text-[18px] sm:text-[19px] md:text-[17px] lg:text-[20px] xl:text-[21px] 2xl:text-[20px] font-bold leading-4 top-[309px]">
					{["99", "199", "299", "499", "999", "2999"].map((amount) => (
						<button
							key={amount}
							className="w-[92px] h-[55px] m:w-[110px] m:h-[60px] sm:w-[150px] sm:h-[65px] md:w-[100px] md:h-[60px] lg:w-[140px] lg:h-[70px] xl:w-[180px] xl:h-[75px] 2xl:w-[220px] 2xl:h-[60px] border-2 border-black rounded shadow hover:bg-gray-200 dark:hover:bg-gray-800"
							style={{ boxShadow: "3px 3px black" }}
							onClick={() => setRechargeAmount(amount)}
						>
							₹{amount}
						</button>
					))}
				</div>
			</section>

			{/* Transaction History Section */}
			<section>
				<h2 className=" text-gray-500 font-normal leading-7">
					Transaction History
				</h2>
				<div className="flex space-x-2  text-xs font-bold leading-4">
					{["All", "Credit", "Debit"].map((filter) => (
						<button
							key={filter}
							onClick={() => setBtn(filter)}
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
				<ul className="space-y-4">
					{[
						{
							id: "546332145",
							date: "17 May 2024, 12:30 PM",
							amount: "+ ₹700.00",
							type: "credit",
						},
						{
							id: "546332146",
							date: "15 May 2024, 11:30 AM",
							amount: "- ₹700.00",
							type: "debit",
						},
						{
							id: "546332147",
							date: "15 May 2024, 11:30 AM",
							amount: "- ₹700.00",
							type: "debit",
						},
						{
							id: "546332148",
							date: "15 May 2024, 11:30 AM",
							amount: "+ ₹700.00",
							type: "credit",
						},
					].map((transaction) => (
						<li
							key={transaction.id}
							className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b-2"
						>
							<div>
								<p className="font-normal text-sm leading-4">
									Transaction ID {transaction.id}
								</p>
								<p className="text-gray-500 font-normal text-xs leading-4">
									{transaction.date}
								</p>
							</div>
							<p
								className={`font-bold text-sm leading-4 ${
									transaction.type === "credit"
										? "text-green-500"
										: "text-red-500"
								}`}
							>
								{transaction.amount}
							</p>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
};

export default Home;
