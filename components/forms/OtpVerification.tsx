"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

const OtpVerification: React.FC = () => {
	const [phone, setPhone] = useState("");
	const [otp, setOtp] = useState("");
	const [message, setMessage] = useState("");
	const [token, setToken] = useState("");
	const [minimumVersion, setMinimumVersion] = useState("");

	const requestOTP = async () => {
		try {
			const response = await axios.post("/api/v1/send-otp", { phone });
			setMessage("OTP sent successfully");
			setToken(response.data.token); // Access token from response.data
		} catch (err: any) {
			setMessage("Failed to send OTP");
			console.log(err);
		}
	};

	const verifyOTP = async () => {
		try {
			await axios.post("/api/v1/verify-otp", {
				phone,
				otp,
				token,
			});
			setMessage("OTP verified successfully");
		} catch (err: any) {
			setMessage("Failed to verify OTP");
			console.log(err.response ? err.response.data : err.message);
		}
	};

	const resendOTP = async () => {
		try {
			const response = await axios.post("/api/v1/resend-otp", { phone });
			setMessage("OTP resent successfully");
			setToken(response.data.token); // Access token from response.data
		} catch (err: any) {
			setMessage("Failed to resend OTP");
			console.log(err.response ? err.response.data : err.message);
		}
	};

	useEffect(() => {
		async function fetchData() {
			try {
				const response = await fetch("/api/v1/metadata");
				const data = await response.json();
				setMinimumVersion(data.minimum_version);
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		}

		fetchData();
	}, []);

	return (
		<div className="flex flex-col items-center justify-center gap-4 w-full">
			<div className="flex gap-4 items-center">
				<input
					type="text"
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
					placeholder="Enter phone number"
					className="bg-gray-200 px-4 py-[0.75rem] rounded-lg outline-none text-blue-1"
				/>
				<Button
					className="text-white hover:opacity-80 bg-blue-1"
					size="lg"
					onClick={requestOTP}
				>
					Request OTP
				</Button>
			</div>
			<div className="flex flex-wrap gap-4 items-center justify-center">
				<input
					type="text"
					value={otp}
					onChange={(e) => setOtp(e.target.value)}
					placeholder="Enter OTP"
					className="bg-gray-200 px-4 py-[0.75rem] rounded-lg outline-none text-blue-1"
				/>

				<div className="flex gap-4 items-center">
					<Button
						className="text-white hover:opacity-80 bg-blue-1"
						size="lg"
						onClick={verifyOTP}
					>
						Verify OTP
					</Button>
					<Button
						className="text-white hover:opacity-80 bg-blue-1"
						size="lg"
						onClick={resendOTP}
					>
						Resend OTP
					</Button>
				</div>
			</div>
			<span className="text-xl mt-4 text-black">
				{message ? (
					<div>{message}</div>
				) : (
					"Request and Verify OTP to see the Results"
				)}
			</span>
			<span className="text-black">
				Minimum Application Version Required ...{" "}
				{minimumVersion && minimumVersion}
			</span>
		</div>
	);
};

export default OtpVerification;
