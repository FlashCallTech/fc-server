// section 2

import { audio, chat, video } from "@/constants/icons";
import React from "react";

const About = () => {
	const services = [
		{
			type: "video",
			label: "Video Call",
			icon: video,
			rate: 25,

			description: "Real-time video consultation",
		},
		{
			type: "audio",
			label: "Audio Call",
			icon: audio,
			rate: 25,

			description: "Voice consultation",
		},

		{
			type: "chat",
			label: "Chat Now",
			icon: chat,
			rate: 25,
			description: "Text-based consultation",
		},
	];

	return (
		<section className="w-full h-fit pb-10 md:pb-20 bg-white grid grid-cols-1 text-center md:text-start md:grid-cols-2 gap-10 items-center md:px-14 lg:px-24 max-md:px-4">
			{/* heading and content */}{" "}
			<h2 className="text-3xl md:text-4xl font-semibold !leading-relaxed">
				Pay-per-minute chats boost your conversion by 5X, so stop scheduling
				calls and offer consultation on demand.
			</h2>
			{/* About Info */}
			<div className="bg-[#F9FAFB] rounded-[12px] p-4 md:px-14 md:py-10">
				<div className="flex flex-col w-full items-center justify-center gap-4 bg-white rounded-[12px] p-2 xm:p-5">
					{services &&
						services.map((service, index) => (
							<div
								className="w-full flex items-center justify-between border border-[#CBD5E1] rounded-[12px] px-4 py-3"
								key={service.label}
							>
								<div className="w-full flex items-center">
									<div className="w-full flex flex-col items-start justify-center gap-2">
										<div className={`flex gap-4 items-center font-bold`}>
											<div className="bg-[#f3f5f8] size-[40px] flex flex-col items-center justify-center border border-[#E5E7EB] rounded-full">
												{service.icon}
											</div>
											{service.label}
										</div>

										<p className="text-sm text-start">{service.description}</p>
									</div>
								</div>
								<div className="flex flex-col items-center self-end">
									<p
										className={`font-medium tracking-widest rounded-full px-3 py-1 w-fit min-w-[115px] min-h-[36px] bg-black text-white flex flex-col-reverse items-center justify-center "bg-black/40 cursor-not-allowed"`}
									>
										<>Rs. {service.rate}</>
									</p>
								</div>
							</div>
						))}
				</div>
			</div>
		</section>
	);
};

export default About;
