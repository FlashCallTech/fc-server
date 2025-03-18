import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import Image from "next/image";
import axios from "axios";
import { useToast } from "../ui/use-toast";
import { backendBaseUrl } from "@/lib/utils";
import { Group } from "@/types";

const sampleCSVData =
	"Name,Phone Number\nJohn Doe,+918765410032\nJane Smith,+918765432100";

const ImportContacts = ({
	isOpen,
	onOpenChange,
	groups,
	setShowGroupModal,
	refetchGroups,
}: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	groups: Group[];
	setShowGroupModal: any;
	refetchGroups: any;
}) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [selectedGroup, setSelectedGroup] = useState("");
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const onDrop = useCallback((acceptedFiles: File[]) => {
		if (groups.length === 0) {
			toast({
				variant: "destructive",
				title: "No Groups Found",
				description: "Create a new group now to start adding members.",
				toastStatus: "negative",
			});
			return;
		}

		if (acceptedFiles.length > 0) {
			setSelectedFile(acceptedFiles[0]);
		}
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"text/csv": [".csv"],
			"application/vnd.ms-excel": [".xls"],
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
				".xlsx",
			],
		},
	});

	const handleDownloadTemplate = () => {
		const blob = new Blob([sampleCSVData], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "sample_contacts_template.csv";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			toast({
				variant: "destructive",
				title: "Please select a file to upload.",
				description: "Unable to upload contacts without a file.",
				toastStatus: "negative",
			});
			return;
		}

		const formData = new FormData();
		formData.append("file", selectedFile);
		selectedGroup.length > 0 && formData.append("groupId", selectedGroup);

		try {
			setLoading(true);
			await axios.post(`${backendBaseUrl}/creator/clients/import`, formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			toast({
				variant: "destructive",
				title: "Contacts imported successfully",
				toastStatus: "positive",
			});
			onOpenChange(false);
		} catch (error) {
			console.error("Import error", error);
			toast({
				variant: "destructive",
				title: "Failed to import contacts",
				description: "There was an issue importing contacts.",
				toastStatus: "negative",
			});
		} finally {
			setLoading(false);
			refetchGroups();
		}
	};

	return isOpen ? (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onOpenChange(false);
				}
			}}
		>
			<div className="flex flex-col items-start justify-start border-none md:rounded-xl bg-white mx-auto w-full h-dvh md:max-h-[90vh] md:max-w-[80%]  overflow-scroll no-scrollbar ">
				{/* Header */}
				<div className="w-full bg-white z-40 p-4 pb-2 md:px-6 sticky top-0 left-0 flex items-center gap-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={2}
						stroke="currentColor"
						className="size-5 cursor-pointer"
						onClick={() => onOpenChange(false)}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
						/>
					</svg>
					<span className="text-lg font-semibold">Import Contacts</span>
				</div>

				<div className="p-4 pt-0 md:px-6 w-full flex flex-col items-start justify-start gap-4">
					<span className="text-lg font-semibold mt-2.5">
						Upload File <span className="text-red-500">*</span>
					</span>

					{/* File Upload Section */}
					<div
						{...getRootProps()}
						className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6  flex flex-col items-center text-center cursor-pointer gap-4"
					>
						<input {...getInputProps()} />
						<Image
							src="/icons/upload.png"
							alt="Upload"
							width={100}
							height={100}
							className="w-[37px] h-[26px]"
						/>

						<p className={`text-gray-600 mt-2 text-sm`}>
							{isDragActive ? (
								"Drop the file here..."
							) : (
								<span className="flex items-center gap-1">
									<strong className="text-[#6B7280]">
										Click to {selectedFile ? "Replace" : "Upload"}
									</strong>
									or drag and drop
								</span>
							)}
						</p>
						<p className="text-xs text-gray-400">CSV, XLS, or XLSX files</p>
					</div>

					{/* Show Selected File */}
					{selectedFile && (
						<div className="w-full flex items-center justify-between bg-gray-100 p-2 rounded-md">
							<span className="pl-2 text-sm text-gray-600">
								{selectedFile.name}
							</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setSelectedFile(null)}
								className="hoverScaleDownEffect"
							>
								Remove
							</Button>
						</div>
					)}

					{/* File Format Requirements */}
					<div className="mt-4 text-sm text-gray-600">
						<p className="font-semibold">File Format Requirements</p>
						<ul className="list-disc list-inside mt-2.5 space-y-1">
							<li className="marker:text-xl">
								File must be in CSV, XLS, or XLSX format
							</li>
							<li className="marker:text-xl">
								First row should contain column headers
							</li>
							<li className="marker:text-xl">
								Required columns: Name, Phone Number
							</li>
							<li className="marker:text-xl">
								Phone numbers should include country code
							</li>
						</ul>
					</div>

					{/* Download Template */}
					<Button
						variant="outline"
						className="mt-2 w-fit flex items-center gap-2 rounded-full hover:bg-gray-100"
						onClick={handleDownloadTemplate}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="size-4"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
							/>
						</svg>
						Download Sample CSV Template
					</Button>

					{/* Select Group */}
					<div className="w-full mt-2">
						<p className="text-sm font-semibold mb-1">
							Select Group <span className="text-red-500">*</span>
						</p>
						<p className="text-sm text-red-500 mb-2.5">
							{groups.length === 0 &&
								"No groups available at the moment. Groups help you organize and manage clients effectively. Create a new group now to start adding members."}
						</p>

						<p className="text-sm text-red-500 mb-2.5">
							{!selectedGroup && "Select a group now to start adding members."}
						</p>
						<Select
							value={selectedGroup}
							onValueChange={setSelectedGroup}
							disabled={!groups.length}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={
										groups.length ? "Select Group" : "No groups available"
									}
								/>
							</SelectTrigger>
							<SelectContent className="bg-white">
								{groups.length > 0 ? (
									groups.map((group) => (
										<SelectItem
											key={group._id ?? ""}
											className="cursor-pointer hover:bg-gray-100"
											value={group._id ?? ""}
										>
											{group.name}
										</SelectItem>
									))
								) : (
									<p className="p-2 text-gray-500 text-center">
										No groups available
									</p>
								)}
							</SelectContent>
						</Select>

						{groups.length > 0 && (
							<Button
								className="bg-black text-white rounded-full hoverScaleDownEffect flex items-center gap-2 mt-4"
								onClick={() => {
									// onOpenChange(false);
									setShowGroupModal(true);
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="size-5"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M12 4.5v15m7.5-7.5h-15"
									/>
								</svg>
								Create New Group
							</Button>
						)}
					</div>
				</div>

				{/* Buttons */}
				<div className="mt-auto bg-white sticky bottom-0 right-4 py-2.5 pr-4 w-full flex justify-end gap-2.5">
					<Button
						variant="ghost"
						onClick={() => onOpenChange(false)}
						className="border border-gray-300 rounded-full hover:bg-gray-100"
					>
						Cancel
					</Button>
					{groups.length === 0 ? (
						<Button
							className="bg-black text-white rounded-full hoverScaleDownEffect flex items-center gap-2"
							onClick={() => {
								// onOpenChange(false);
								setShowGroupModal(true);
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="size-5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 4.5v15m7.5-7.5h-15"
								/>
							</svg>
							Create New Group
						</Button>
					) : (
						<Button
							onClick={handleUpload}
							disabled={loading || !selectedGroup || !selectedFile}
							className="bg-black text-white rounded-full hoverScaleDownEffect"
						>
							{loading ? (
								<Image
									src="/icons/loading-circle.svg"
									alt="Loading..."
									width={24}
									height={24}
									className=""
									priority
								/>
							) : (
								"Import Contacts"
							)}
						</Button>
					)}
				</div>
			</div>
		</div>
	) : null;
};

export default ImportContacts;
