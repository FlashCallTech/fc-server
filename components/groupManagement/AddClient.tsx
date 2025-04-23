import React, { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";

const AddClient = ({
	isOpen,
	onClose,
	refetch,
	groupId,
	refetchGroups,
}: {
	isOpen: boolean;
	onClose: () => void;
	refetch: any;
	groupId: string | undefined;
	refetchGroups: any;
}) => {
	const [formData, setFormData] = useState({ fullName: "", phone: "" });
	const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>(
		{}
	);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		setFormData((prev) => ({ ...prev, [name]: value }));

		let newErrors = { ...errors };

		if (name === "fullName") {
			if (!value.trim()) {
				newErrors.fullName = "Full Name is required.";
			} else if (value.length < 3) {
				newErrors.fullName = "Full Name must be at least 3 characters.";
			} else {
				delete newErrors.fullName;
			}
		}

		if (name === "phone") {
			const phoneRegex = /^(\+\d{1,3})?[0-9]{10}$/;
			const cleanedValue = value.replace(/\s+/g, "");

			if (!cleanedValue) {
				newErrors.phone = "Phone number is required.";
			} else if (!phoneRegex.test(cleanedValue)) {
				newErrors.phone =
					"Enter a valid phone number (with or without country code).";
			} else {
				delete newErrors.phone;
			}
		}

		setErrors(newErrors);
	};

	const handleSubmit = async () => {
		if (!formData.fullName || !formData.phone) {
			toast({
				title: "Error",
				description: "All fields are required",
				variant: "destructive",
			});
			return;
		}

		setLoading(true);
		try {
			await axios.post(`${backendBaseUrl}/creator/clients/`, {
				...formData,
				photo:
					"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7",
				...(groupId ? { groupId } : {}),
			});
			toast({
				variant: "destructive",
				title: "Success",
				description: "Client added successfully",
				toastStatus: "positive",
			});
			setFormData({ fullName: "", phone: "" });
			setErrors({});
			refetch();
			refetchGroups();
			onClose();
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.error || "Failed to add client";

			const isAlreadyInGroupError =
				errorMessage === "Client is already in another group";
			const isAlreadyInUseByCreatorError =
				errorMessage === "Provided number is already in use by a creator";

			toast({
				variant: "destructive",
				title: "Something went wrong",
				description: isAlreadyInGroupError
					? "This client is already in another group. Remove them first to add to a new group."
					: isAlreadyInUseByCreatorError
					? "Provided number is already in use by a creator."
					: "Failed to add client",
				toastStatus: "negative",
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!isOpen) {
			setErrors({});
			setFormData({ fullName: "", phone: "" });
		}
	}, [isOpen]);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-white max-w-[92%] md:max-w-sm rounded-[8px]">
				<DialogHeader>
					<DialogTitle className="!text-start">Add Members</DialogTitle>
					<DialogDescription className=" text-sm !text-start">
						Add a new member to the list of members
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="w-full flex flex-col items-start justify-start gap-2">
						<label className="block text-sm text-gray-400 font-medium">
							Client Name <span className="text-red-500">*</span>
						</label>
						<Input
							name="fullName"
							value={formData.fullName}
							onChange={handleInputChange}
							placeholder="Enter full name"
							className="h-[44px] focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-xl px-4 py-3 border border-gray-300"
						/>
						{errors.fullName && (
							<div className="text-red-500 text-xs">{errors.fullName}</div>
						)}
					</div>
					<div className="w-full flex flex-col items-start justify-start gap-2">
						<label className="block text-sm text-gray-400 font-medium">
							Client Phone <span className="text-red-500">*</span>
						</label>
						<Input
							name="phone"
							value={formData.phone}
							onChange={handleInputChange}
							placeholder="Enter phone number"
							className="h-[44px] focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-xl px-4 py-3 border border-gray-300"
						/>
						{errors.phone && (
							<div className="text-red-500 text-xs">{errors.phone}</div>
						)}
					</div>
				</div>
				<DialogFooter>
					<div className="w-full flex items-center justify-end gap-2.5 mt-4">
						<Button
							variant="ghost"
							onClick={onClose}
							className="border border-gray-300 rounded-full hover:bg-gray-100"
						>
							Cancel
						</Button>
						<Button
							className="bg-black text-white rounded-full hoverScaleDownEffect"
							onClick={handleSubmit}
							disabled={
								Object.keys(errors).length > 0 ||
								loading ||
								!formData.fullName ||
								!formData.phone
							}
						>
							{loading ? "Adding..." : "Add Client"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default AddClient;
