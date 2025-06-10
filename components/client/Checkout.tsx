"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import usePlatform from "@/hooks/usePlatform";
import { trackEvent } from "@/lib/mixpanel";
import { backendBaseUrl } from "@/lib/utils";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

interface CheckoutSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    amountToPay: number;
}

const CheckoutSheet: React.FC<CheckoutSheetProps> = ({
    isOpen,
    onOpenChange,
    amountToPay,
}) => {
    const { getDevicePlatform } = usePlatform();
    const [isMobileView, setIsMobileView] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const paypalRef = useRef<HTMLDivElement>(null);
    const { clientUser } = useCurrentUsersContext();

    // Responsive
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 584);
        };
        handleResize(); // set initially
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Load PayPal Button when open
    useEffect(() => {
        const paypal = (window as any).paypal;

        if (isOpen && paypal && paypalRef.current && 1) {
            // 🧼 Clear container before rendering buttons
            paypalRef.current.innerHTML = "";

            paypal
                .Buttons({
                    style: {
                        layout: "vertical",
                        color: "gold",
                        shape: "rect",
                        label: "pay",
                        height: 50,
                        disableMaxWidth: true,
                    },
                    createOrder: async (_data: any, actions: any) => {
                        return actions.order.create({
                            purchase_units: [
                                {
                                    amount: {
                                        currency_code: "USD",
                                        value: amountToPay.toString(),
                                    },
                                },
                            ],
                            application_context: {
                                shipping_preference: "NO_SHIPPING",
                            },
                        });
                    },
                    onApprove: async (_data: any, actions: any) => {
                        setIsProcessing(true);
                        try {
                            const details = await actions.order.capture();
                            if (details.status === "COMPLETED") {
                                await fetch(`${backendBaseUrl}/wallet/addMoney`, {
                                    method: "POST",
                                    body: JSON.stringify({
                                        userId: clientUser?._id,
                                        PG: "Paypal",
                                        userType: "Client",
                                        amount: Number(details.purchase_units[0].amount.value),
                                        category: "Recharge",
                                        global: true,
                                    }),
                                    headers: { "Content-Type": "application/json" },
                                });

                                trackEvent("Checkout_Payment_Success", {
                                    Order_ID: details.id,
                                    Amount: amountToPay,
                                    Platform: getDevicePlatform(),
                                });

                                onOpenChange(false);
                                window.location.href = "/success";
                            }
                        } catch (err) {
                            console.error("Payment processing error:", err);
                            setIsProcessing(false); // Allow retry or show error UI if needed
                        }
                    },
                    onCancel: () => {
                        console.warn("PayPal payment cancelled");
                    },
                    onError: (err: any) => {
                        console.error("PayPal error:", err);
                    },
                })
                .render(paypalRef.current);
        }
    }, [isOpen, amountToPay, paypalRef.current]);

    const PayPalContainer = (
        <div className="w-full flex flex-col items-center bg-white rounded-xl p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Pay with PayPal</h2>
            <div className="w-full relative">
                {isProcessing && (
                    <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center rounded-xl">
                        <span className="text-sm font-medium text-gray-600">Processing payment...</span>
                    </div>
                )}
                <div
                    id="paypal-button-container"
                    ref={paypalRef}
                    className="w-full max-h-[90vh] overflow-y-auto"
                />
            </div>
        </div>
    );


    return isMobileView ? (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="flex items-center justify-center w-full outline-none !p-0 border-none"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>Checkout</SheetTitle>
                    <SheetDescription>Complete your payment with PayPal</SheetDescription>
                </SheetHeader>
                {PayPalContainer}
            </SheetContent>
        </Sheet>
    ) : (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col items-center justify-center !p-0 border-none">
                <DialogHeader className="sr-only">
                    <DialogTitle>Checkout</DialogTitle>
                    <DialogDescription>Complete your payment with PayPal</DialogDescription>
                </DialogHeader>
                {PayPalContainer}
            </DialogContent>
        </Dialog>
    );
};

export default CheckoutSheet;
