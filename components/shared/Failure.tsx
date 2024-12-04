"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";

// Define the type for the component props
export type FailureProps = {
    redirect?: string;
    event?: string;
};

// Update the Success component to use the defined props type
const Failure = ({
    redirect = "recharge",
    event = "Sorry",
}: FailureProps) => {
    const router = useRouter();
    const { order_id, amount } = useParams();
    const redirectURL = `/${redirect}?amount=${amount}`;
    useEffect(() => {
        localStorage.setItem("cashfree_order_id", order_id as string);
        setTimeout(() => {
            router.push(`${redirectURL}`);
        }, 1000);
    }, [redirect, router]);

    return (
        <div className="flex flex-col items-center justify-center min-w-full h-full gap-7">
            <div className="flex flex-col items-center justify-center gap-2 tracking-wider">
                <span className="font-semibold text-xl">{event}</span>
                <span className="font-semibold text-lg text-red-600">Something Went Wrong</span>
            </div>
        </div>
    );
};

export default Failure;
