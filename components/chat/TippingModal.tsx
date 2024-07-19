import React, { useState, useEffect } from "react";
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
import { useChatTimerContext } from "@/lib/context/ChatTimerContext";
import useEndChat from "@/hooks/useEndChat";

const TippingModal = ({
    setWalletBalance,
    walletBalance,
    updateWalletBalance
}: {
    setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
    walletBalance: number;
    updateWalletBalance: () => Promise<void>

}) => {
    const [tipAmount, setTipAmount] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [onGoingPayment, setOnGoingPayment] = useState(false);
    const { toast } = useToast();
    const { pauseTimer, resumeTimer } = useChatTimerContext();
    const { user2 } = useEndChat();
    const { totalTimeUtilized, chatRatePerMinute} = useChatTimerContext();


    useEffect(() => {
        if (isSheetOpen || onGoingPayment) {
            pauseTimer();
        } else {
            resumeTimer();
        }
    }, [isSheetOpen, onGoingPayment, pauseTimer, resumeTimer]);

    const TipHandler = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ): Promise<void> => {
        e.preventDefault();

        setIsSheetOpen(false);

        try {
            setOnGoingPayment(true);
            if ((walletBalance - parseInt(tipAmount, 10) - parseInt(((totalTimeUtilized / 60) * chatRatePerMinute).toFixed(2))) <= 0) {
                toast({
                    title: "Error",
                    description: "Not sufficient balance",
                });
            } else {
                await Promise.all([
                    fetch("/api/v1/wallet/payout", {
                        method: "POST",
                        body: JSON.stringify({
                            userId: user2?.clientId,
                            userType: "Client",
                            amount: tipAmount,
                        }),
                        headers: { "Content-Type": "application/json" },
                    }),
                    fetch("/api/v1/wallet/addMoney", {
                        method: "POST",
                        body: JSON.stringify({
                            userId: "664c90ae43f0af8f1b3d5803",
                            userType: "Creator",
                            amount: tipAmount,
                        }),
                        headers: { "Content-Type": "application/json" },
                    }),
                ]);
                setWalletBalance((prev) => prev - parseInt(tipAmount));
            }
        } catch (error) {
            console.error("Tip request failed:", error);
        } finally {
            updateWalletBalance();
            setOnGoingPayment(false);
            resumeTimer();
        }
    };

    const handlePredefinedAmountClick = (amount: string) => {
        setTipAmount(amount);
    };

    return (
        <section>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button
                        className="bg-[rgba(35,35,5,1)] text-white mt-2 w-full hoverScaleEffect"
                        onClick={() => setIsSheetOpen(true)}
                    >
                        Tip
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
                            value={tipAmount}
                            onChange={(e) => setTipAmount(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        {["99", "199", "299", "499", "999", "2999"].map((amount) => (
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
                            <Button
                                onClick={TipHandler}
                                className="bg-green-1 text-white"
                            >
                                Tip
                            </Button>
                        </SheetClose>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </section>
    );
};

export default TippingModal;
