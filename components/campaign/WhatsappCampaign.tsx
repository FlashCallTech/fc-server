import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { creatorUser, GroupMembers, MessageTemplate } from "@/types";
import Link from "next/link";

import {
	useGetCreatorClients,
	useGetCreatorGroups,
	useGetCreatorTemplates,
} from "@/lib/react-query/queries";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import { useToast } from "../ui/use-toast";
import MessageTemplateSection from "./MessageTemplateSection";
import ClientSelectionSection from "./ClientSelectionSection";

const WhatsappCampaign = ({ creator }: { creator: creatorUser }) => {
	const [campaignName, setCampaignName] = useState("");
	const [selectedTab, setSelectedTab] = useState("pre-approved");
	const [customTemplateData, setCustomTemplateData] = useState({
		title: "Custom Message",
		description: "User defined template",
		body: "",
	});
	const [selectedClients, setSelectedClients] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedGroup, setSelectedGroup] = useState("");
	const [sortBy, setSortBy] = useState("");
	const [searchResults, setSearchResults] = useState<GroupMembers[] | null>(
		null
	);

	const [selectedTemplate, setSelectedTemplate] =
		useState<MessageTemplate | null>(null);

	const [savingTemplate, setSavingTemplate] = useState(false);
	const [savingCampaign, setSavingCampaign] = useState(false);

	const [errors, setErrors] = useState<{ campaignName?: string }>({});

	const creatorURL = localStorage.getItem("creatorURL");
	const { toast } = useToast();

	// Fetch members across all groups
	const { data, fetchNextPage, hasNextPage } = useGetCreatorClients(
		creator?._id
	);

	// Fetch groups for filter dropdown
	const { data: groupData } = useGetCreatorGroups(creator?._id);

	// Fetch creator templates
	const {
		data: creatorTemplatesPreApproved,
		fetchNextPage: fetchNextPreApprovedTemplates,
		hasNextPage: hasMorePreApprovedTemplates,
	} = useGetCreatorTemplates(creator?._id, "pre-approved");

	const {
		data: creatorTemplatesCustom,
		fetchNextPage: fetchNextCustomTemplates,
		hasNextPage: hasMoreCustomTemplates,
		refetch: refetchCustomTemplates,
	} = useGetCreatorTemplates(creator?._id, "custom");

	const groups = groupData?.pages.flatMap((page) => page.groups) || [];
	const members = data?.pages.flatMap((page) => page.members) || [];
	const preApprovedTemplates =
		creatorTemplatesPreApproved?.pages.flatMap((page) => page.templates) || [];

	const customTemplates =
		creatorTemplatesCustom?.pages.flatMap((page) => page.templates) || [];

	const toggleClientSelection = (clientId: string) => {
		setSelectedClients((prev) =>
			prev.includes(clientId)
				? prev.filter((id) => id !== clientId)
				: [...prev, clientId]
		);
	};

	useEffect(() => {
		const fetchSearchResults = async () => {
			if (!searchQuery) {
				setSearchResults(null);
				return;
			}

			if (!creator._id) {
				console.warn("Creator details are missing");
				return;
			}
			const response = await axios.get(
				`${backendBaseUrl}/creator/clients/search`,
				{
					params: {
						query: searchQuery,
						page: 1,
						limit: 20,
						creatorId: creator._id,
					},
				}
			);
			const results = response.data.clients.map((client: any) => ({
				client,
				groupId: client.groupId,
				groupName: client.groupName,
			}));
			setSearchResults(results);
		};

		const debounce = setTimeout(fetchSearchResults, 300);
		return () => clearTimeout(debounce);
	}, [searchQuery]);

	// Filtered & sorted clients (combines search, filter, and sort)
	const filteredClients = useMemo(() => {
		let source = searchResults || members;

		// Filter by selected group if any
		if (selectedGroup && selectedGroup !== "all") {
			source = source.filter((m) => m.groupId === selectedGroup);
		}
		// Sort logic
		if (sortBy === "name") {
			source = [...source].sort((a, b) =>
				a.client.campaignName.localeCompare(b.client.campaignName)
			);
		} else if (sortBy === "group") {
			source = [...source].sort((a, b) =>
				a.groupName.localeCompare(b.groupName)
			);
		}

		return source;
	}, [searchResults, members, selectedGroup, sortBy]);

	const handleCampaignSubmission = async () => {
		try {
			setSavingCampaign(true);
			await axios.post(`${backendBaseUrl}/campaigns/whatsapp`, {
				owner: creator?._id,
				name: campaignName,
				type: "default",
				description: "User Defined Campaign",
				clients: selectedClients,
				messageTemplate: selectedTemplate?._id,
			});

			toast({
				variant: "destructive",
				title: "Campaign Saved",
				description: "The Campaign has been saved successfully.",
				toastStatus: "positive",
			});
			setCustomTemplateData((prev) => ({ ...prev, body: "" }));
			setSelectedClients([]);
			setSelectedTemplate(null);
		} catch (error) {
			console.log(error);
			toast({
				variant: "destructive",
				title: "Something went wrong",
				description: "Unable to save campaign",
				toastStatus: "negative",
			});
		} finally {
			setSavingCampaign(false);
		}
	};

	const handleCustomTemplateSubmission = async () => {
		try {
			setSavingTemplate(true);
			await axios.post(
				`${backendBaseUrl}/campaigns/template`,
				{
					title: customTemplateData.title,
					description: customTemplateData.description,
					body: customTemplateData.body,
					type: "custom",
				},
				{
					params: {
						owner: creator?._id,
					},
				}
			);
			refetchCustomTemplates();
			toast({
				variant: "destructive",
				title: "Template Added",
				description: "The template has been created successfully.",
				toastStatus: "positive",
			});
			setCustomTemplateData((prev) => ({ ...prev, body: "" }));
		} catch (error) {
			console.log(error);
			toast({
				variant: "destructive",
				title: "Something went wrong",
				description: "Unable to add template",
				toastStatus: "negative",
			});
		} finally {
			setSavingTemplate(false);
		}
	};

	const insertPlaceholder = (placeholder: string) => {
		setCustomTemplateData((prev) => ({
			...prev,
			body: prev.body + ` ${placeholder} `,
		}));
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		setCampaignName(value);

		let newErrors = { ...errors };

		if (name === "campaignName") {
			if (!value.trim()) {
				newErrors.campaignName = "Campaign Name is required.";
			} else if (value.length < 3) {
				newErrors.campaignName = "Campaign Name must be at least 3 characters.";
			} else {
				delete newErrors.campaignName;
			}
		}

		setErrors(newErrors);
	};

	return (
		<>
			<section
				className={`sticky flex lg:hidden w-full items-center justify-between top-0 lg:top-[76px] bg-white z-30 -mt-4 pt-4 pb-2 transition-all duration-300`}
			>
				<section className="flex items-center gap-4">
					<Link
						href={`${creatorURL ? creatorURL : "/home"}`}
						className="text-xl font-bold hoverScaleDownEffect"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="size-6"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M15.75 19.5 8.25 12l7.5-7.5"
							/>
						</svg>
					</Link>
					<h1 className="text-xl md:text-2xl font-bold">
						WhatsApp Campaign Creator
					</h1>
				</section>
			</section>

			<div className="md:p-4 mt-5 md:mt-0 size-full">
				<div className="w-full flex justify-between items-end gap-4">
					{/* Campaign Name */}
					<div className="w-full flex flex-col items-start justify-start gap-2">
						<label className="text-sm font-semibold text-gray-600">
							Campaign Name
						</label>
						<Input
							name="campaignName"
							value={campaignName}
							onChange={handleInputChange}
							placeholder="Enter full name"
							className="h-[44px] focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-md px-4 py-3 border border-gray-300"
						/>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							className="border border-gray-300 px-4 py-2 hover:bg-gray-100 rounded-full"
						>
							Cancel
						</Button>
						<Button
							disabled={Object.keys(errors).length > 0 || !campaignName}
							className="bg-black text-white px-4 py-2 hoverScaleDownEffect rounded-full"
							onClick={handleCampaignSubmission}
						>
							Save Campaign
						</Button>
					</div>
				</div>

				{errors.campaignName && (
					<div className="text-red-500 text-sm mt-4">{errors.campaignName}</div>
				)}

				{/* Main Grid Layout */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
					{/* Left Column */}
					<div className="md:col-span-2">
						{/* Client Selection */}
						<ClientSelectionSection
							filteredClients={filteredClients}
							selectedClients={selectedClients}
							setSelectedClients={setSelectedClients}
							searchQuery={searchQuery}
							setSearchQuery={setSearchQuery}
							selectedGroup={selectedGroup}
							setSelectedGroup={setSelectedGroup}
							sortBy={sortBy}
							setSortBy={setSortBy}
							groups={groups}
							toggleClientSelection={toggleClientSelection}
							fetchNextPage={fetchNextPage}
							hasNextPage={hasNextPage}
							searchResults={searchResults}
							setSearchResults={setSearchResults}
						/>
						{/* Message Template */}

						<MessageTemplateSection
							selectedTab={selectedTab}
							setSelectedTab={setSelectedTab}
							customTemplateData={customTemplateData}
							setCustomTemplateData={setCustomTemplateData}
							selectedTemplate={selectedTemplate}
							setSelectedTemplate={setSelectedTemplate}
							savingTemplate={savingTemplate}
							setSavingTemplate={setSavingTemplate}
							handleCustomTemplateSubmission={handleCustomTemplateSubmission}
							insertPlaceholder={insertPlaceholder}
							preApprovedTemplates={preApprovedTemplates}
							customTemplates={customTemplates}
							hasMorePreApprovedTemplates={hasMorePreApprovedTemplates}
							hasMoreCustomTemplates={hasMoreCustomTemplates}
							fetchNextPreApprovedTemplates={fetchNextPreApprovedTemplates}
							fetchNextCustomTemplates={fetchNextCustomTemplates}
						/>
					</div>

					{/* Right Column: Campaign Preview */}
					<Card>
						<CardContent className="p-4">
							<h3 className="text-lg font-semibold">Campaign Preview</h3>
							<div className="mt-2">
								<p className="text-sm font-semibold">Recipients</p>
								<p className="font-semibold text-xl">
									{selectedClients.length}
								</p>
							</div>
							<div className="mt-2">
								<p className="text-sm font-semibold">Selected Template</p>
								<p className="text-sm text-gray-500">Welcome Message</p>
							</div>
							<div className="mt-2">
								<p className="text-sm font-semibold">Estimated Delivery</p>
								<p className="text-sm text-gray-500">~2 minutes</p>
							</div>
							<div className="mt-2">
								<p className="text-sm font-semibold">Campaign Cost</p>
								<p className="font-semibold text-xl">
									₹{selectedClients.length}
								</p>
							</div>

							{/* Agreement Checkbox */}
							<div className="flex items-center mt-4">
								<Checkbox id="terms" />
								<label htmlFor="terms" className="text-sm ml-2">
									I agree to the terms and compliance guidelines
								</label>
							</div>
							<div className="flex flex-col items-start justify-center gap-1 mt-4">
								{/* Buttons */}
								<Button
									disabled={!selectedTemplate || !selectedClients}
									className="w-full mt-4 bg-black text-white hover:bg-gray-800 hoverScaleDownEffect rounded-full"
								>
									Share Campaign Now
								</Button>
								<Button
									variant="outline"
									className="w-full mt-2 border-black text-black hoverScaleDownEffect rounded-full"
								>
									Schedule for Later
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
};

export default WhatsappCampaign;
