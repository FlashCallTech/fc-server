import React, { useState } from "react";
import { Button } from "../ui/button";

interface PriceEditModalProps {
	onClose: () => void;
	onSave: (
		global: boolean,
		prices: {
			videoCall: string;
			audioCall: string;
			chat: string;
		}
	) => void;
	currentPrices: { videoCall: string; audioCall: string; chat: string };
	currentGlobalPrices: { videoCall: string; audioCall: string; chat: string };
}

const PriceEditModal: React.FC<PriceEditModalProps> = ({
	onClose,
	onSave,
	currentPrices,
	currentGlobalPrices,
}) => {
	const [prices, setPrices] = useState(currentPrices);
	const [globalPrices, setGlobalPrices] = useState(currentGlobalPrices);
	const [activeTab, setActiveTab] = useState<"INDIAN" | "GLOBAL">("INDIAN");
	const [notSaved, setNotSaved] = useState(true);

	const validatePrices = (updatedPrices: {
		videoCall: string;
		audioCall: string;
		chat: string;
	}) => {
		const videoCallPrice = parseFloat(updatedPrices.videoCall);
		const audioCallPrice = parseFloat(updatedPrices.audioCall);
		const chatPrice = parseFloat(updatedPrices.chat);

		if (
			!updatedPrices.videoCall ||
			isNaN(videoCallPrice) ||
			!updatedPrices.audioCall ||
			isNaN(audioCallPrice) ||
			!updatedPrices.chat ||
			isNaN(chatPrice) ||
			videoCallPrice < 10 ||
			audioCallPrice < 10 ||
			chatPrice < 10
		) {
			setNotSaved(true);
		} else {
			setNotSaved(false);
		}
	};

	const validateGlobalPrices = (updatedPrices: {
		videoCall: string;
		audioCall: string;
		chat: string;
	}) => {
		const videoCallPrice = parseFloat(updatedPrices.videoCall);
		const audioCallPrice = parseFloat(updatedPrices.audioCall);
		const chatPrice = parseFloat(updatedPrices.chat);

		if (
			!updatedPrices.videoCall ||
			isNaN(videoCallPrice) ||
			!updatedPrices.audioCall ||
			isNaN(audioCallPrice) ||
			!updatedPrices.chat ||
			isNaN(chatPrice) ||
			videoCallPrice < 0.5 ||
			audioCallPrice < 0.5 ||
			chatPrice < 0.5
		) {
			setNotSaved(true);
		} else {
			setNotSaved(false);
		}
	};

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		if (activeTab === "GLOBAL") {
			const updatedGlobalPrices = {
				...globalPrices,
				[name]: value,
			};
			setGlobalPrices(updatedGlobalPrices);
			validateGlobalPrices(updatedGlobalPrices);
		} else {
			const updatedPrices = {
				...prices,
				[name]: value,
			};
			setPrices(updatedPrices);
			validatePrices(updatedPrices);
		}
	};

	const handleSave = () => {
		if (notSaved) return;
		if (activeTab === "GLOBAL") {
			onSave(true, globalPrices);
		} else {
			onSave(false, prices);
		}
		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40">
			<div className="flex flex-col gap-8 bg-white rounded-3xl py-5 px-8">
				<div className="flex justify-center pb-2">
					<button
						className={`px-4 py-2 ${activeTab === "INDIAN" ? "border-b-2  border-[#16BC88] font-semibold" : ""
							}`}
						onClick={() => setActiveTab("INDIAN")}
					>
						Indian Prices
					</button>
					<button
						className={`px-4 py-2 ${activeTab === "GLOBAL" ? "border-b-2 border-[#16BC88] font-semibold" : ""
							}`}
						onClick={() => setActiveTab("GLOBAL")}
					>
						Global Prices
					</button>
				</div>
				<div className="flex flex-col gap-4">
					<div className="flex flex-row gap-20 justify-between items-center">
						<div className="flex flex-col">
							<span className="text-sm font-bold">Video Call</span>
							<span className="text-gray-400 text-xs">per minute</span>
						</div>
						<div className="flex flex-row gap-2 items-center">
							<span className="text-xs text-gray-400">
								{`${activeTab === "GLOBAL" ? "$" : "Rs."}`}
							</span>
							<input
								type="number"
								name="videoCall"
								min={10}
								value={
									activeTab === "GLOBAL"
										? globalPrices.videoCall
										: prices.videoCall
								}
								onChange={handleChange}
								className="border rounded p-1 w-16 text-right bg-gray-200"
							/>
						</div>
					</div>
					<div className="flex flex-row gap-20 justify-between items-center">
						<div className="flex flex-col">
							<span className="text-sm font-bold">Audio Call</span>
							<span className="text-gray-400 text-xs">per minute</span>
						</div>
						<div className="flex flex-row gap-2 items-center">
							<span className="text-xs text-gray-400">
								{`${activeTab === "GLOBAL" ? "$" : "Rs."}`}
							</span>
							<input
								type="number"
								name="audioCall"
								min={10}
								value={
									activeTab === "GLOBAL"
										? globalPrices.audioCall
										: prices.audioCall
								}
								onChange={handleChange}
								className="border rounded p-1 w-16 text-right bg-gray-200"
							/>
						</div>
					</div>
					<div className="flex flex-row gap-20 justify-between items-center">
						<div className="flex flex-col">
							<span className="text-sm font-bold">Chat</span>
							<span className="text-gray-400 text-xs">per minute</span>
						</div>
						<div className="flex flex-row gap-2 items-center">
							<span className="text-xs text-gray-400">
								{`${activeTab === "GLOBAL" ? "$" : "Rs."}`}
							</span>
							<input
								type="number"
								name="chat"
								min={10}
								value={
									activeTab === "GLOBAL" ? globalPrices.chat : prices.chat
								}
								onChange={handleChange}
								className="border rounded p-1 w-16 text-right bg-gray-200"
							/>
						</div>
					</div>
				</div>
				<div className="flex items-center justify-center pt-4 p-2">
					<div className="grid grid-cols-2 gap-4 justify-between">
						<Button
							onClick={onClose}
							className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hoverScaleDownEffect"
						>
							Cancel
						</Button>
						<Button
							disabled={notSaved}
							onClick={handleSave}
							className={`${notSaved
									? "bg-black/20 !cursor-not-allowed"
									: "bg-black text-white hoverScaleDownEffect"
								}  rounded-full px-8 w-full`}
						>
							Save
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PriceEditModal;
