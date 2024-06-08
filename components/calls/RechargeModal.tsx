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
import { useToast } from "../ui/use-toast";

const RechargeModal = ({
	setWalletBalance,
}: {
	setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
}) => {
	const [rechargeAmount, setRechargeAmount] = useState("");
	const { toast } = useToast();

	const handleRecharge = () => {
		const amount = parseFloat(rechargeAmount);
		if (!isNaN(amount) && amount > 0) {
			setWalletBalance((prevBalance: number) => prevBalance + amount);
			toast({
				title: "Recharge Successful",
				description: `Credited Rs. ${amount} to your balance`,
			});
			setRechargeAmount("");
		} else {
			toast({
				title: "Something Went Wrong",
				description: `Please enter a valid amount`,
			});
		}
	};

	const handlePredefinedAmountClick = (amount: number) => {
		setRechargeAmount(amount.toString());
	};

	return (
		<div>
			<Sheet>
				<SheetTrigger asChild>
					<Button className="bg-red-500 mt-2 w-full hoverScaleEffect">
						Recharge
					</Button>
				</SheetTrigger>
				<SheetContent
					side="bottom"
					className="flex flex-col items-center justify-center border-none rounded-t-xl px-10 py-7 bg-white min-h-[350px] max-h-fit w-full sm:max-w-[444px] mx-auto"
				>
					<SheetHeader className="flex flex-col items-center justify-center">
						<SheetTitle>Your balance is low.</SheetTitle>
						<SheetDescription>
							Recharge to continue this video call
						</SheetDescription>
					</SheetHeader>
					<div className="grid gap-4 py-4 w-full">
						<Label htmlFor="rechargeAmount">Enter amount in INR</Label>
						<Input
							id="rechargeAmount"
							type="number"
							placeholder="Enter recharge amount"
							value={rechargeAmount}
							onChange={(e) => setRechargeAmount(e.target.value)}
						/>
					</div>
					<div className="grid grid-cols-3 gap-4 mt-4">
						{[99, 199, 299, 499, 999, 2999].map((amount) => (
							<Button
								key={amount}
								onClick={() => handlePredefinedAmountClick(amount)}
								className="w-full bg-gray-200 hover:bg-gray-300 hoverScaleEffect"
							>
								₹{amount}
							</Button>
						))}
					</div>
					<SheetFooter className="mt-4">
						<SheetClose asChild>
							<Button onClick={handleRecharge} className="bg-blue-1 text-white">
								Recharge
							</Button>
						</SheetClose>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</div>
	);
};

export default RechargeModal;
