import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

const RechargeModal = ({ setWalletBalance }: any) => {
	const [rechargeAmount, setRechargeAmount] = useState("");

	const handleRecharge = () => {
		const amount = parseFloat(rechargeAmount);
		if (!isNaN(amount) && amount > 0) {
			setWalletBalance((prevBalance: number) => prevBalance + amount);
			alert(`Successfully recharged Rs. ${amount}`);
			setRechargeAmount("");
		} else {
			alert("Please enter a valid amount.");
		}
	};

	return (
		<div>
			<Sheet>
				<SheetTrigger asChild>
					<Button className="bg-red-500 mt-2 w-full transition-all duration-500 hover:scale-105">
						Recharge
					</Button>
				</SheetTrigger>
				<SheetContent
					side="bottom"
					className="flex flex-col items-center justify-center border-none rounded-t-xl px-10 py-7 bg-white min-h-[350px] max-h-fit w-full sm:max-w-[444px] mx-auto"
				>
					<SheetHeader>
						<SheetTitle>Recharge Wallet</SheetTitle>
						<SheetDescription>
							Enter the amount you want to recharge.
						</SheetDescription>
					</SheetHeader>
					<div className="grid gap-4 py-4">
						<Label htmlFor="rechargeAmount">Amount</Label>
						<Input
							id="rechargeAmount"
							type="number"
							value={rechargeAmount}
							onChange={(e) => setRechargeAmount(e.target.value)}
						/>
					</div>
					<SheetFooter>
						<Button onClick={handleRecharge}>Recharge</Button>
						<SheetClose asChild>
							<Button type="submit">Close</Button>
						</SheetClose>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</div>
	);
};

export default RechargeModal;
