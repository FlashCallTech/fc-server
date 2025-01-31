import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

import { useToast } from "../ui/use-toast";
import * as Sentry from "@sentry/nextjs";
import { creatorUser } from "@/types";
import { success } from "@/constants/icons";
import ContentLoading from "../shared/ContentLoading";
import { useChatTimerContext } from "@/lib/context/ChatTimerContext";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { doc, getDoc, increment, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { backendBaseUrl, fetchExchangeRate } from "@/lib/utils";
import axios from "axios";

interface Props {
    walletBalance: number;
    setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
    updateWalletBalance: () => Promise<void>;
    handleSendTip: (tipAmt: string) => Promise<void>;
    setText: React.Dispatch<React.SetStateAction<string>>;
    creatorId: string;
}

const TipModal: React.FC<Props> = ({
    walletBalance,
    setWalletBalance,
    updateWalletBalance,
    handleSendTip,
    setText,
    creatorId,
}) => {
    const [tipAmount, setTipAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [tipPaid, setTipPaid] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const { toast } = useToast();
    const { currentUser } = useCurrentUsersContext();

    const callId = localStorage.getItem("CallId");

    const clientId = currentUser?._id as string;

    const options = [10, 49, 99, 149, 199, 249, 299, 499, 999, 2999]
        .filter((amount) => amount <= walletBalance)
        .map((amount) => amount.toString());


    const handlePredefinedAmountClick = (amount: string) => {
        setTipAmount(amount);
    };

    const fetchActivePg = async (global: boolean) => {
        try {
            if (global) return "paypal";

            const pgDocRef = doc(db, "pg", "paymentGatways");
            const pgDoc = await getDoc(pgDocRef);

            if (pgDoc.exists()) {
                const { activePg } = pgDoc.data();
                return activePg;
            }

            return "razorpay";
        } catch (error) {
            return error;
        }
    };

    const fetchPgCharges = async (pg: string) => {
        try {
            const response = await axios.get(
                `https://backend.flashcall.me/api/v1/pgCharges/fetch`
            ); // Replace with your API endpoint
            const data = response.data;
            return data[pg];
        } catch (error) {
            console.error("Error fetching PG Charges", error);
        }
    };

    const handleTransaction = async () => {
        if (parseInt(tipAmount) > walletBalance) {
            toast({
                variant: "destructive",
                title: "Insufficient Wallet Balance",
                description: "Try considering Lower Value.",
                toastStatus: "negative",
            });
        } else {
            let amountINR: number;
            try {
                setLoading(true);
                const response = await axios.get(
                    `${backendBaseUrl}/creator/getUser/${creatorId}`
                );
                const exchangeRate = await fetchExchangeRate();
                const global = currentUser?.global ?? false;
                const data = response.data;
                const activePg: string = await fetchActivePg(global);
                const pgChargesRate: number = await fetchPgCharges(activePg);
                const commissionRate = Number(data?.commission ?? 20);
                const commissionAmt = Number(
                    global
                        ? (
                            ((Number(tipAmount) * commissionRate) / 100) *
                            exchangeRate
                        ).toFixed(2)
                        : ((Number(tipAmount) * commissionRate) / 100).toFixed(2)
                );
                const pgChargesAmt = Number(
                    global
                        ? (
                            ((Number(tipAmount) * pgChargesRate) / 100) *
                            exchangeRate
                        ).toFixed(2)
                        : ((Number(tipAmount) * pgChargesRate) / 100).toFixed(2)
                );
                const gstAmt = Number((commissionAmt * 0.18).toFixed(2));
                const totalDeduction = Number(
                    (commissionAmt + gstAmt + pgChargesAmt).toFixed(2)
                );
                const amountAdded = Number(
                    global
                        ? (Number(tipAmount) * exchangeRate - totalDeduction).toFixed(2)
                        : (Number(tipAmount) - totalDeduction).toFixed(2)
                );
                amountINR = currentUser?.global ? (Number(tipAmount) * exchangeRate) : (Number(tipAmount));

                const tipId = crypto.randomUUID();
                await Promise.all([
                    fetch(`${backendBaseUrl}/wallet/payout`, {
                        method: "POST",
                        body: JSON.stringify({
                            userId: clientId,
                            user2Id: creatorId,
                            fcCommission: commissionAmt,
                            PGCharge: pgChargesRate,
                            userType: "Client",
                            amount: tipAmount,
                            category: "Tip",
                            global: currentUser?.global ?? false,
                        }),
                        headers: { "Content-Type": "application/json" },
                    }),
                    fetch(`${backendBaseUrl}/wallet/addMoney`, {
                        method: "POST",
                        body: JSON.stringify({
                            userId: creatorId,
                            user2Id: clientId,
                            fcCommission: commissionAmt,
                            PGCharge: pgChargesRate,
                            userType: "Creator",
                            amount: amountAdded.toFixed(2),
                            category: "Tip",
                        }),
                        headers: { "Content-Type": "application/json" },
                    }),
                ]);

                await axios.post(`${backendBaseUrl}/tip`, {
					tipId,
					amountAdded,
					amountPaid: tipAmount,
				})

                // Firestore tip document update
                const tipRef = doc(db, "userTips", creatorId as string);
                const tipDoc = await getDoc(tipRef);

                if (tipDoc.exists()) {
                    // If callId exists, increment amount; otherwise, add it
                    await updateDoc(tipRef, {
                        [`${callId}.totalAmountINR`]: increment(amountINR ?? parseInt(tipAmount)),
                        [`${callId}.totalAmount`]: increment(parseInt(tipAmount)),
                        [`${callId}.amount`]: parseInt(tipAmount),
                        [`${callId}.amountINR`]: (amountINR ?? parseInt(tipAmount)),
                    });
                } else {
                    console.log("not exists");
                    // Create document if it doesn't exist with initial callId and amount
                    await setDoc(tipRef, {
                        [callId as string]: {
                            amount: parseInt(tipAmount),
                            amountINR: amountINR ?? parseInt(tipAmount),
                            totalAmount: parseInt(tipAmount),
                            totalAmountINR: amountINR ?? parseInt(tipAmount)
                        },
                    });
                }

                setWalletBalance((prev) => prev + parseInt(tipAmount));
                setTipPaid(true);
            } catch (error) {
                Sentry.captureException(error);
                console.error("Error handling wallet changes:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "An error occurred while processing the Transactions",
                    toastStatus: "negative",
                });
            } finally {
                // Update wallet balance after transaction
                setLoading(false);
                updateWalletBalance();
                handleSendTip(tipAmount);
            }
        }
    };

    const resetStates = () => {
        setTipAmount("");
        setLoading(false);
        setTipPaid(false);
        setErrorMessage("");
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const amount = e.target.value;
        setTipAmount(amount);

        if (parseInt(amount) > walletBalance) {
            setErrorMessage(
                "Insufficient wallet balance. Please enter a lower amount."
            );
        } else {
            setErrorMessage("");
        }
    };

    return (
        <section>
            <Sheet
                open={isSheetOpen}
                onOpenChange={(open) => {
                    setIsSheetOpen(open);
                    if (open) {
                        resetStates();
                    }
                }}
            >
                <SheetTrigger asChild>
                    <button
                        className="bg-black text-white p-2 text-[10px] md:text-sm rounded-lg hoverScaleDownEffect"
                        onClick={() => setIsSheetOpen(true)}
                    >
                        Give Tip
                    </button>
                </SheetTrigger>
                <SheetContent
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    side="bottom"
                    className={`flex flex-col items-center justify-center ${!loading ? "px-10 py-7" : "px-4"
                        } border-none rounded-t-xl bg-white min-h-[350px] max-h-fit w-full sm:max-w-[444px] mx-auto`}
                >
                    {loading ? (
                        <ContentLoading />
                    ) : !tipPaid ? (
                        <>
                            <SheetHeader className="flex flex-col items-center justify-center">
                                <SheetTitle>Provide Tip to Expert</SheetTitle>
                                <SheetDescription>
                                    <div>
                                        Balance Left
                                        <span
                                            className={`ml-2 "text-green-1"`}
                                        >
                                            {`${currentUser?.global ? "$" : "₹"}${walletBalance.toFixed(2)}`}
                                        </span>
                                    </div>
                                </SheetDescription>
                            </SheetHeader>
                            <div className="grid gap-4 py-4 w-full">
                                <span>{`Enter Desired amount in ${currentUser?.global ? "Dollars" : "INR"}`}</span>
                                <div className="flex flex-row justify-between rounded-lg border p-1">
                                    <Input
                                        id="tipAmount"
                                        type="number"
                                        placeholder="Enter tip amount"
                                        value={tipAmount}
                                        className="border-none outline-none focus-visible:ring-offset-0 focus-visible:!ring-transparent placeholder:text-grey-500"
                                        onChange={handleAmountChange}
                                    />
                                    <Button
                                        className="bg-green-1 text-white"
                                        onClick={handleTransaction}
                                        disabled={parseInt(tipAmount) > walletBalance}
                                    >
                                        Proceed
                                    </Button>
                                </div>
                                {errorMessage && (
                                    <span className="text-red-500 text-sm">{errorMessage}</span>
                                )}
                            </div>
                            <div className="flex flex-col items-start justify-center">
                                <span className="text-sm">Predefined Options</span>
                                <div className="grid grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                                    {options.map((amount) => (
                                        <Button
                                            key={amount}
                                            onClick={() => handlePredefinedAmountClick(amount)}
                                            className={`w-full bg-gray-200 hover:bg-gray-300 hoverScaleDownEffect ${tipAmount === amount &&
                                                "bg-green-1 text-white hover:bg-green-1"
                                                }`}
                                        >
                                            {`${currentUser?.global ? "$" : "₹"}${amount}`}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-w-full h-full gap-4">
                            {success}
                            <span className="font-semibold text-lg">
                                Tip Added Successfully!
                            </span>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </section>
    );
};

export default TipModal;
