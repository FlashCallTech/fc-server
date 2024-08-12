"use client";
import React, { useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import Withdraw from "./Withdraw";

const Profile = () => {
	const [activeButton, setActiveButton] = useState("Profile");

	const handleButtonClick = (button: string) => {
		setActiveButton(button);
	};

	return (
		<>
			<div className="flex flex-col min-h-screen bg-gray-50">
				<div className="pt-5">
					<Button>
						<Image
							src={"/back.svg"}
							width={0}
							height={0}
							alt="back"
							className="w-auto h-auto p-2 rounded-full hover:bg-gray-200"
						/>
					</Button>
				</div>
				<div className="flex p-4 flex-col gap-4">
					<div className="w-full flex flex-row items-center justify-start p-1 border-b-8 border-gray-200">
						<Image
							src="/avatar.svg"
							width={0}
							height={0}
							alt="avatar"
							className="w-12 h-12 bg-white rounded-full p-18"
						/>
						<div className="flex flex-row justify-between w-full">
							<div className="flex flex-col items-start justify-start p-2">
								<p className="text-black text-xl font-extrabold">
									Nitra Sehgal
								</p>
								<p className="text-gray-400 text-xs">Nutritionist</p>
							</div>
							<Button>
								<Image
									src={"/forward.svg"}
									width={0}
									height={0}
									alt=""
									className="w-auto h-auto"
								/>
							</Button>
						</div>
					</div>
					<div className="flex flex-row justify-between rounded-xl border p-4 bg-white shadow-sm">
						<div className="flex flex-row gap-2">
							<Image
								src={"/kyc.svg"}
								width={0}
								height={0}
								alt=""
								className="w-auto h-auto"
							/>
							<span>KYC</span>
						</div>
						<div>
							<Image
								src={"/forward.svg"}
								width={0}
								height={0}
								alt=""
								className="w-auto h-auto"
							/>
						</div>
					</div>
					<div className="flex flex-row justify-between rounded-xl border p-4 bg-white shadow-sm">
						<div className="flex flex-row gap-2">
							<Image
								src={"/support.svg"}
								width={0}
								height={0}
								alt=""
								className="w-auto h-auto"
							/>
							<span>Support</span>
						</div>
						<div>
							<Image
								src={"/forward.svg"}
								width={0}
								height={0}
								alt=""
								className="w-auto h-auto"
							/>
						</div>
					</div>
					<div className="flex flex-row justify-between rounded-xl border p-4 bg-white shadow-sm">
						<div className="flex flex-row gap-2">
							<Image
								src={"/payment-setting.svg"}
								width={0}
								height={0}
								alt=""
								className="w-auto h-auto"
							/>
							<span>Payment Setting</span>
						</div>
						<div>
							<Image
								src={"/forward.svg"}
								width={0}
								height={0}
								alt=""
								className="w-auto h-auto"
							/>
						</div>
					</div>
					<div className="flex flex-row justify-between rounded-xl border p-4 bg-white shadow-sm">
						<div className="flex flex-row gap-2">
							<Image
								src={"/terms-&-condition.svg"}
								width={0}
								height={0}
								alt=""
								className="w-auto h-auto"
							/>
							<span>Terms & Condition</span>
						</div>
						<div>
							<Image
								src={"/forward.svg"}
								width={0}
								height={0}
								alt=""
								className="w-auto h-auto"
							/>
						</div>
					</div>
					<div className="flex flex-row justify-between rounded-xl border p-4 bg-white shadow-sm">
						<div className="flex flex-row gap-2">
							<Image
								src={"/logout.svg"}
								width={0}
								height={0}
								alt=""
								className="w-auto h-auto"
							/>
							<span>Logout</span>
						</div>
						<div>
							<Image
								src={"/forward.svg"}
								width={0}
								height={0}
								alt=""
								className="w-auto h-auto"
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default Profile;
