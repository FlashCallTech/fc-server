import Image from "next/image";
import React from "react";

const ServicesCheckbox = ({
	setIsPriceEditOpen,
	services,
	handleToggle,
	prices,
}: any) => {
	return (
		<div className="flex flex-col gap-2 mt-2">
			{Object.keys(services).map((service) => (
				<div
					key={service}
					className="flex flex-row justify-between items-center p-2 font-bold"
				>
					<div className="flex flex-col gap-1 capitalize">
						<span>{service}</span>
						<div className="flex flex-row gap-2">
							<p className="font-normal text-xs text-gray-400">{`Rs ${prices[service]}/min`}</p>
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
							type="checkbox"
							className="toggle-checkbox absolute w-0 h-0 opacity-0"
							checked={services[service]}
							onChange={() => handleToggle(service)}
						/>
						<span
							className={`toggle-label block overflow-hidden h-6 rounded-full ${
								services[service] ? "bg-green-600" : "bg-gray-500"
							}  servicesCheckbox cursor-pointer`}
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
						</span>
					</label>
				</div>
			))}
		</div>
	);
};

export default ServicesCheckbox;
