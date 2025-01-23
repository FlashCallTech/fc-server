import usePlatform from "@/hooks/usePlatform";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { trackEvent } from "@/lib/mixpanel";
import Image from "next/image";
import React from "react";

const ServicesCheckbox = ({
	setIsPriceEditOpen,
	services,
	isRestricted,
	handleToggle,
	prices,
	globalPrices,
}: any) => {
	const { creatorUser } = useCurrentUsersContext();
	const { getDevicePlatform } = usePlatform();

	if (services.videoCall) {
		trackEvent("Creator_Video_Online", {
			Creator_ID: creatorUser?._id,
			creator_First_Seen: creatorUser?.createdAt?.toString().split("T")[0],
			Platform: getDevicePlatform(),
			Status: "Online",
		});
	}

	// Mapping of services to their respective image paths
	const serviceImages: Record<string, string> = {
		audioCall: "/creator/audio.svg",
		chat: "/creator/chat.svg",
		videoCall: "/creator/video.svg",
	};

	const name = (service: string) => {
		if (service === "audioCall") return "Audio Call";
		if (service === "videoCall") return "Video Call";
		if (service === "chat") return "Chat";
	}


	return (
		<div>
			<div className="flex flex-col gap-2 mt-2 lg:hidden">
				{Object.keys(services).map((service) => (
					<div
						key={service}
						className="flex flex-row justify-between items-center p-2 font-bold"
					>
						<div className="flex flex-col gap-1 capitalize">
							<span>{service}</span>
							<div className="flex flex-row gap-2">
								<p className="font-normal text-xs text-gray-400">{`Rs ${prices[service]}/min`}</p>
								<p className="font-normal text-xs text-gray-400">{`$ ${globalPrices[service]}/min`}</p>
								<button onClick={() => setIsPriceEditOpen(true)}>
									<Image
										src={"/edit.svg"}
										width={0}
										height={0}
										alt="edit"
										className="w-auto h-auto p-0"
									/>
								</button>
							</div>
						</div>
						<label className="relative inline-block w-14 h-6">
							<input
								disabled={isRestricted}
								type="checkbox"
								className={` toggle-checkbox absolute w-0 h-0 opacity-0`}
								checked={services[service]}
								onChange={() => handleToggle(service)}
							/>
							<p
								className={`toggle-label block overflow-hidden h-6 rounded-full ${services[service] ? "bg-green-600" : "bg-gray-500"
									} ${isRestricted ? "!cursor-not-allowed" : "cursor-pointer"}`}
								style={{
									justifyContent: services[service] ? "flex-end" : "flex-start",
								}}
							>
								<span
									className="servicesCheckboxContent"
									style={{
										transition: "transform 0.3s",
										transform: services[service]
											? "translateX(2.1rem)"
											: "translateX(0)",
									}}
								/>
							</p>
						</label>
					</div>
				))}
			</div>

			{/* New Design */}

			<div className="hidden lg:flex flex-col gap-4 mt-2">
				{Object.keys(services).map((service) => (
					<div
						key={service}
						className="flex flex-row border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] rounded-xl justify-between items-center p-4 font-bold"
					>
						<div className="flex gap-6 items-center">
							<Image
								src={`${serviceImages[service]}`}
								width={100}
								height={100}
								alt="img"
								className="size-4"
							/>
							<div className="flex flex-col gap-1 capitalize">
								<span className="font-semibold">{name(service)}</span>
								<div className="flex flex-row gap-2">
									<p className="font-normal text-xs text-[#6B7280]">{`Rs ${prices[service]}/min | $ ${globalPrices[service]}/min`}</p>
									<button onClick={() => setIsPriceEditOpen(true)}>
										<Image
											src={"/edit.svg"}
											width={0}
											height={0}
											alt="edit"
											className="w-auto h-auto p-0"
										/>
									</button>
								</div>
							</div>
						</div>
						<label className="relative inline-block w-10 h-6">
							<input
								disabled={isRestricted}
								type="checkbox"
								className={` toggle-checkbox absolute w-0 h-0 opacity-0`}
								checked={services[service]}
								onChange={() => handleToggle(service)}
							/>
							<p
								className={`toggle-label block overflow-hidden h-6 rounded-full ${services[service] ? "bg-green-600" : "bg-gray-500"
									} ${isRestricted ? "!cursor-not-allowed" : "cursor-pointer"}`}
								style={{
									justifyContent: services[service] ? "flex-end" : "flex-start",
								}}
							>
								<span
									className="servicesCheckboxContent"
									style={{
										transition: "transform 0.3s",
										transform: services[service]
											? "translateX(1.1rem)"
											: "translateX(0)",
									}}
								/>
							</p>
						</label>
					</div>
				))}
			</div>
		</div>
	);
};

export default ServicesCheckbox;
