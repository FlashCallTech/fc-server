"use client";

import React, { useEffect, useState } from "react";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import axios from "axios";
import Image from "next/image";
import * as Sentry from "@sentry/nextjs";

const OTPVerification = ({
	phoneNumber,
	onEditNumber,
	otpForm,
	onOTPChange,
	onSubmit,
	isVerifyingOTP,
	errors,
	changeError,
	setToken,
}: {
	phoneNumber: string;
	onEditNumber: () => void;
	otpForm: any;
	onOTPChange: (value: string) => void;
	onSubmit: () => void;
	isVerifyingOTP: boolean;
	errors: any;
	changeError: React.Dispatch<React.SetStateAction<{}>>;
	setToken: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
	const [resendTime, setResendTime] = useState(30);
	const [resending, setResending] = useState(false);
	// Resend OTP
	const handleResendCode = async () => {
		if (resendTime === 0) {
			try {
				setResending(true);
				const response = await axios.post(
					`${process.env.NEXT_PUBLIC_BASE_URL_BACKEND}/otp/resend-otp`,
					{
						phone: phoneNumber,
					}
				);
				setResendTime(30); // Reset timer after resending
				changeError({});
				setToken(response.data.token);
				console.log("OTP resent:", response.data.message);
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error resending OTP:", error);
				// Handle error (show message to user, etc.)
			} finally {
				setResending(false);
			}
		}
	};

	// Resend timer logic
	React.useEffect(() => {
		if (resendTime > 0) {
			const timer = setTimeout(() => setResendTime(resendTime - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [resendTime]);

	const pin = otpForm.watch("pin");

	useEffect(() => {
		onOTPChange(pin);
	}, [pin]);

	return (
		<>
			<div className="flex flex-col items-center justify-enter gap-2">
				<h2 className="text-lg font-semibold">Enter verification code</h2>
				<p className="text-xs text-gray-500 mb-4">
					We sent a 6-digit code to +91 {phoneNumber}.{" "}
					<span
						onClick={onEditNumber}
						className="text-green-1/90 cursor-pointer hover:text-green-1"
					>
						edit number
					</span>
				</p>
			</div>
			<Form {...otpForm}>
				<form
					onSubmit={onSubmit}
					className="space-y-6 w-full flex flex-col items-center justify-center"
				>
					<FormField
						control={otpForm.control}
						name="pin"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<InputOTP maxLength={6} {...field}>
										<InputOTPGroup className="flex justify-center gap-3">
											{Array.from({ length: 6 }).map((_, index) => (
												<InputOTPSlot
													key={index}
													index={index}
													className={`w-10 h-10 rounded-xl shadow-sm bg-[#F3F4F6] border ${
														errors.otpVerificationError
															? "border-red-500"
															: "border-gray-200"
													}`}
												/>
											))}
										</InputOTPGroup>
									</InputOTP>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{isVerifyingOTP && (
						<Image
							src="/icons/loading-circle.svg"
							alt="Loading..."
							width={24}
							height={24}
							className="invert"
							priority
						/>
					)}
				</form>
			</Form>

			{errors.otpVerificationError && (
				<span className="text-red-500 cursor-pointer text-sm text-center">
					{errors.otpVerificationError ? errors.otpVerificationError : ""}
				</span>
			)}

			<p className="flex w-full items-center justify-center text-center gap-1 text-xs text-gray-500 mt-4">
				{!resending && "Resend code"}{" "}
				{resendTime > 0 ? (
					<span className="font-semibold">({resendTime})</span>
				) : !resending ? (
					<span
						onClick={handleResendCode}
						className="text-green-1/90 cursor-pointer hover:text-green-1"
					>
						Click Here
					</span>
				) : (
					<Image
						src="/icons/loading-circle.svg"
						alt="Loading..."
						width={24}
						height={24}
						className="invert"
						priority
					/>
				)}
			</p>
		</>
	);
};

export default OTPVerification;
