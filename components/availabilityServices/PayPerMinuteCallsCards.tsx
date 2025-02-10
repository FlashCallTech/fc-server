"use client";

import { serviceIcon } from "@/constants/icons";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { backendBaseUrl, updateFirestoreCallServices } from "@/lib/utils";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Switch } from "../ui/switch";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import axios from "axios";

const useScreenSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	const handleResize = () => {
		setIsMobile(window.innerWidth < 400);
	};

	useEffect(() => {
		handleResize(); // Set initial value
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return isMobile;
};

const PayPerMinuteCallsCards = () => {
	const { creatorUser } = useCurrentUsersContext();
	const isMobile = useScreenSize();

	const [services, setServices] = useState([
		{
			label: "videoCall" as "videoCall" | "audioCall" | "chat",
			tag: "video" as "video" | "audio" | "chat",
			title: "PPM Video Consultation",
			description: "Pay - Per - Minute Video call",
			image: serviceIcon("video"),
			userType: creatorUser?.global ? "global" : "local",
			isActive: creatorUser?.videoAllowed,
			rate: creatorUser?.videoRate,
			globalRate: creatorUser?.globalVideoRate,
		},
		{
			label: "audioCall" as "videoCall" | "audioCall" | "chat",
			tag: "audio" as "video" | "audio" | "chat",
			title: "PPM Audio Consultation",
			description: "Pay - Per - Minute Audio call",
			image: serviceIcon("audio"),
			userType: creatorUser?.global ? "global" : "local",
			isActive: creatorUser?.audioAllowed,
			rate: creatorUser?.audioRate,
			globalRate: creatorUser?.globalAudioRate,
		},
		{
			label: "chat" as "videoCall" | "audioCall" | "chat",
			tag: "chat" as "video" | "audio" | "chat",
			title: "PPM Chat Consultation",
			description: "Pay - Per - Minute Chat",
			image: serviceIcon("chat"),
			userType: creatorUser?.global ? "global" : "local",
			isActive: creatorUser?.chatAllowed,
			rate: creatorUser?.chatRate,
			globalRate: creatorUser?.globalChatRate,
		},
	]);

	const getClampedText = (
		text: string,
		isExpanded: boolean,
		length?: number
	) => {
		if (!text) return;
		const charLen = length ?? 100;
		if (text.length > charLen && !isExpanded) {
			return text.slice(0, charLen) + "... ";
		}
		return text;
	};

	const handleToggle = async (
		service: "videoCall" | "audioCall" | "chat",
		status: boolean
	) => {
		try {
			// Fetch current services state from Firestore
			const servicesSnapshot = await getDoc(
				doc(db, "services", creatorUser?._id as string)
			);
			if (!servicesSnapshot.exists()) {
				throw new Error("Services document does not exist.");
			}

			const existingServices = servicesSnapshot.data().services || {};

			// Toggle the specified service
			const updatedServices = {
				...existingServices,
				[service]: status,
			};

			setServices((prev) =>
				prev.map((s) => (s.label === service ? { ...s, isActive: status } : s))
			);

			// Determine if any service is active
			const isAnyServiceOn =
				updatedServices.videoCall ||
				updatedServices.audioCall ||
				updatedServices.chat;

			updatedServices.myServices = isAnyServiceOn;

			await updateFirestoreCallServices(creatorUser, updatedServices);

			try {
				await axios.put(
					`${backendBaseUrl}/creator/updateUser/${creatorUser?._id}`,
					{
						videoAllowed: updatedServices.videoCall,
						audioAllowed: updatedServices.audioCall,
						chatAllowed: updatedServices.chat,
					}
				);
			} catch (error) {
				console.error("Error updating services on backend:", error);
			}
		} catch (error) {
			console.error("Error toggling service:", error);
		}
	};

	return (
		<>
			{services &&
				services.map((service) => (
					<div
						key={service.tag}
						className="w-full relative shadow-md border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 ease-in-out"
					>
						<Switch
							id={`serviceToggle-${service.tag}`}
							checked={!!service?.isActive}
							onCheckedChange={() =>
								handleToggle(service.label, !service.isActive)
							}
							className="absolute top-4 right-4 hoverScaleDownEffect"
						/>
						<div className="w-full flex flex-col items-start gap-4">
							<div className="w-full flex items-center gap-2.5">
								{/* <Image
									width={80}
									height={80}
									src={
										service.image ||
										"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7"
									}
									alt={service.title}
									className="self-start w-12 h-12 object-cover rounded-lg border border-gray-200"
								/> */}

								<div className="bg-[#f3f5f8] size-[40px] flex flex-col items-center justify-center border border-[#E5E7EB] rounded-full">
									{service.image}
								</div>
								<div className="flex flex-col items-start justify-center">
									<h3 className="-mt-1 text-lg font-semibold text-gray-800">
										{isMobile
											? getClampedText(service.title, false, 20)
											: service.title}
									</h3>
									<p className="text-sm text-[#9CA3AF]">
										{service.description}
									</p>
								</div>
							</div>
						</div>
						<div className="w-full flex justify-between items-center gap-4 mt-2.5">
							<div className="self-end flex items-center gap-1 text-sm text-[#6B7280]">
								Price{" "}
								<span className="ml-1 text-green-1 font-medium tracking-wider">
									₹{parseFloat(String(service.rate)).toFixed(2)}/Min
								</span>
								{", "}
								<span className="text-green-1 font-medium tracking-wider">
									${parseFloat(String(service.globalRate)).toFixed(2)}/Min
								</span>
							</div>

							{/* <div className="h-full mt-2 flex items-center gap-2 justify-center">
								<span
									className={`p-2 text-sm border transition-all rounded-full ${
										service.isActive
											? "bg-[#F0FDF4] text-[#16A34A]"
											: "bg-[#FFEDD5] text-[#9A3412]"
									}`}
								>
									{serviceIcon(service.tag)}
								</span>
							</div> */}
						</div>
					</div>
				))}
		</>
	);
};

export default PayPerMinuteCallsCards;
