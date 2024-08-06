import React, { useState } from "react";
import { Button } from "../ui/button";

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

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setPrices({
			...prices,
			[name]: String(value),
		});
	};

	const handleSave = () => {
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
								min={0}
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
								min={0}
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
								min={0}
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
							onClick={handleSave}
							className="bg-green-600 text-white rounded-xl px-8 hover:bg-green-700"
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
