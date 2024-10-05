import React, { useState } from "react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

interface PriceEditModalProps {
	onClose: () => void;
	onSave: (prices: {
		videoCall: string;
		audioCall: string;
		chat: string;
	}) => void;
	currentPrices: { videoCall: string; audioCall: string; chat: string };
}

const PriceEditModal: React.FC<PriceEditModalProps> = ({
	onClose,
	onSave,
	currentPrices,
}) => {
	const [prices, setPrices] = useState(currentPrices);
	const [notSaved, setNotSaved] = useState(true); // Initially disabled until valid values are entered
	const { toast } = useToast();

	// Validate if any price is empty, NaN, or below 10
	const validatePrices = (updatedPrices: {
		videoCall: string;
		audioCall: string;
		chat: string;
	}) => {
		const videoCallPrice = parseFloat(updatedPrices.videoCall);
		const audioCallPrice = parseFloat(updatedPrices.audioCall);
		const chatPrice = parseFloat(updatedPrices.chat);

		// Check for empty values or NaN
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

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		const updatedPrices = {
			...prices,
			[name]: value,
		};

		setPrices(updatedPrices);
		validatePrices(updatedPrices); // Revalidate prices on input change
	};

	const handleSave = () => {
		if (notSaved) return;
		// Save prices if valid
		onSave(prices);
		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40">
			<div className="flex flex-col gap-8 bg-white rounded-3xl p-8">
				<h2 className="text-lg font-bold text-center border-b">Price</h2>
				<div className="flex flex-col gap-4">
					<div className="flex flex-row gap-20 justify-between items-center">
						<div className="flex flex-col">
							<span className="text-sm font-bold">Video Call</span>
							<span className="text-gray-400 text-xs">per minute</span>
						</div>
						<div className="flex flex-row gap-2 items-center">
							<span className="text-xs text-gray-400">Rs.</span>
							<input
								type="number"
								name="videoCall"
								min={10}
								value={prices.videoCall}
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
							<span className="text-xs text-gray-400">Rs.</span>
							<input
								type="number"
								name="audioCall"
								min={10}
								value={prices.audioCall}
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
							<span className="text-xs text-gray-400">Rs.</span>
							<input
								type="number"
								name="chat"
								min={10}
								value={prices.chat}
								onChange={handleChange}
								className="border rounded p-1 w-16 text-right bg-gray-200"
							/>
						</div>
					</div>
				</div>
				<div className="flex items-center justify-center pt-4 p-2">
					<div className="flex flex-row gap-6 justify-between">
						<Button
							onClick={onClose}
							className=" text-black rounded-xl px-8 bg-gray-200 hover:bg-gray-400 hover:text-white"
						>
							Cancel
						</Button>
						<Button
							disabled={notSaved}
							onClick={handleSave}
							className={`${
								notSaved
									? "bg-black/20 !cursor-not-allowed"
									: "bg-green-600 text-white hoverScaleDownEffect"
							}  rounded-xl px-8 `}
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
