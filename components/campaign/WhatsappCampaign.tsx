import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	CreatorCampaign,
	creatorUser,
	GroupMembers,
	MessageTemplate,
} from "@/types";

import {
	useGetCreatorClients,
	useGetCreatorGroups,
	useGetCreatorTemplates,
} from "@/lib/react-query/queries";
import axios from "axios";
import { backendBaseUrl, getDisplayName } from "@/lib/utils";
import { useToast } from "../ui/use-toast";
import MessageTemplateSection from "./MessageTemplateSection";
import ClientSelectionSection from "./ClientSelectionSection";
import NotifyCreatorUserAlert from "../alerts/NotifyCreatorUserAlert";

const WhatsappCampaign = ({
	creator,
	action,
	setToggleCampaignSheet,
	selectedCampaign,
	setSelectedCampaign,
	refetchCampaigns,
}: {
	creator: creatorUser;
	action?: "Create" | "Update";
	setToggleCampaignSheet: any;
	selectedCampaign?: CreatorCampaign | null;
	setSelectedCampaign?: any;
	refetchCampaigns?: any;
}) => {
	const [campaignName, setCampaignName] = useState(
		selectedCampaign?.name || ""
	);
	const [selectedTab, setSelectedTab] = useState("pre-approved");
	const [customTemplateData, setCustomTemplateData] = useState({
		templateId: selectedCampaign?.messageTemplate?.templateId || "",
		title: selectedCampaign?.messageTemplate?.title || "Custom Message",
		description:
			selectedCampaign?.messageTemplate?.description || "User defined template",
		body: selectedCampaign?.messageTemplate?.body || "",
		headerType: selectedCampaign?.messageTemplate?.headerType || "none",
		bodyFields: selectedCampaign?.messageTemplate?.bodyFields?.length
			? selectedCampaign?.messageTemplate?.bodyFields
			: [{ key: "recipientName", defaultValue: "recipientName" }],
		hasButtons: selectedCampaign?.messageTemplate?.hasButtons ?? false,
	});

	const [selectedClients, setSelectedClients] = useState<string[]>(
		selectedCampaign?.clients.map((client: any) => client?._id) || []
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedGroup, setSelectedGroup] = useState("");
	const [sortBy, setSortBy] = useState("");
	const [searchResults, setSearchResults] = useState<GroupMembers[] | null>(
		null
	);

	const [toggleAgreeCompliance, setToggleAgreeCompliance] = useState(false);
	const [toggleNotifyAlert, setToggleNotifyAlert] = useState(false);

	const [selectedTemplate, setSelectedTemplate] =
		useState<MessageTemplate | null>(selectedCampaign?.messageTemplate || null);

	const [savingTemplate, setSavingTemplate] = useState(false);
	const [notifyingUsers, setNotifyingUsers] = useState(false);
	const [savingCampaign, setSavingCampaign] = useState(false);

	const [errors, setErrors] = useState<{ campaignName?: string }>({});

	const { toast } = useToast();

	// Fetch members across all groups
	const { data, fetchNextPage, hasNextPage, isLoading } = useGetCreatorClients(
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

			if (action === "Create") {
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
			} else if (action === "Update") {
				await axios.put(
					`${backendBaseUrl}/campaigns/whatsapp/${selectedCampaign?._id}`,
					{
						owner: creator?._id,
						name: campaignName,
						type: "default",
						description: "User Defined Campaign",
						clients: selectedClients,
						messageTemplate: selectedTemplate?._id,
					}
				);
				toast({
					variant: "destructive",
					title: "Campaign Updated",
					description: "The Campaign has been updated successfully.",
					toastStatus: "positive",
				});
			}

			setCampaignName("");
			setCustomTemplateData((prev) => ({ ...prev, body: "" }));
			setSelectedClients([]);
			setSelectedTemplate(null);
		} catch (error) {
			console.log(error);
			toast({
				variant: "destructive",
				title: "Something went wrong",
				description: "Unable to perform action on campaign",
				toastStatus: "negative",
			});
		} finally {
			refetchCampaigns && refetchCampaigns();
			setSavingCampaign(false);
			setToggleCampaignSheet(false);
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

	const handleNotifyUsers = async () => {
		try {
			setNotifyingUsers(true);
			const templateId = selectedTemplate?.templateId || "campaign1";
			const currentTemplate = selectedTemplate?._id;
			const fullNameCreator = getDisplayName(creator);
			const profileLink = `https://flashcall.me/${creator?.username}`;

			const clientDetailsPromises = selectedClients.map(async (clientId) => {
				try {
					const { data } = await axios.get(
						`${backendBaseUrl}/creator/clients/${clientId}`
					);
					return data;
				} catch (error) {
					console.error(`Error fetching client ${clientId}:`, error);
					return null;
				}
			});

			const clients = await Promise.all(clientDetailsPromises);
			const validClients = clients.filter((client) => client !== null);

			const notifyPromises = validClients.map(async (client) => {
				try {
					await axios.post(`${backendBaseUrl}/campaigns/whatsapp/notifyUsers`, {
						recipientNumber: client.phone,
						recipientName:
							client.fullName || client.username || "Flashcall User",
						templateId: templateId,
						selectedTemplate: currentTemplate,
						creatorImage:
							"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7",
						creatorName: fullNameCreator,
						creatorProfile: profileLink,
					});
				} catch (error) {
					console.error(
						`Failed to notify ${
							client.fullName || client.username || "Flashcall User"
						}:`,
						error
					);
				}
			});

			await Promise.all(notifyPromises);

			await axios.post(`${backendBaseUrl}/wallet/payout`, {
				userId: creator._id,
				userType: "Creator",
				amount: validClients.length,
				category: "Notification",
			});

			toast({
				variant: "destructive",
				title: "Users were notified",
				description: "The messages have been successfully sent.",
				toastStatus: "positive",
			});
		} catch (error) {
			console.error("Notification error:", error);
			toast({
				variant: "destructive",
				title: "Something went wrong",
				description: "Unable to notify users",
				toastStatus: "negative",
			});
		} finally {
			setNotifyingUsers(false);

			setToggleCampaignSheet(false);
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

	const isCampaignChanged = useMemo(() => {
		if (!selectedCampaign) return false;

		return (
			campaignName !== selectedCampaign.name ||
			selectedTemplate?._id !== selectedCampaign.messageTemplate?._id ||
			JSON.stringify(selectedClients) !==
				JSON.stringify(
					selectedCampaign.clients.map((client: any) => client._id)
				)
		);
	}, [campaignName, selectedTemplate, selectedClients, selectedCampaign]);

	return (
		<>
			<NotifyCreatorUserAlert
				showDialog={toggleNotifyAlert}
				setShowDialog={setToggleNotifyAlert}
				handleConfirmNotify={handleNotifyUsers}
				loading={notifyingUsers}
			/>

			<section
				className={`sticky flex lg:hidden w-full items-center justify-between top-0 lg:top-[76px] bg-white z-30 -mt-4 pt-4 pb-2 transition-all duration-300`}
			>
				<section className="flex items-center gap-4">
					<button
						onClick={() => {
							setToggleCampaignSheet(false);
							setSelectedCampaign(null);
						}}
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
					</button>
					<h2 className="text-xl md:text-2xl font-bold">
						WhatsApp Campaign Creator
					</h2>
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
							onClick={() => {
								setToggleCampaignSheet(false);
								setSelectedCampaign(null);
							}}
						>
							Cancel
						</Button>
						<Button
							disabled={
								Object.keys(errors).length > 0 ||
								!campaignName ||
								savingCampaign ||
								(action === "Update" && !isCampaignChanged)
							}
							className="bg-black text-white px-4 py-2 hoverScaleDownEffect rounded-full"
							onClick={handleCampaignSubmission}
						>
							{savingCampaign
								? "Saving..."
								: action === "Update"
								? "Update Campaign"
								: "Save Campaign"}
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
							isLoading={isLoading}
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
								<Checkbox
									checked={toggleAgreeCompliance}
									onCheckedChange={() =>
										setToggleAgreeCompliance((prev) => !prev)
									}
									id="terms"
								/>
								<label htmlFor="terms" className="text-sm ml-2">
									I agree to the terms and compliance guidelines
								</label>
							</div>
							<div className="flex flex-col items-start justify-center gap-1 mt-4">
								{/* Buttons */}
								<Button
									disabled={
										!selectedTemplate ||
										selectedClients.length === 0 ||
										!toggleAgreeCompliance
									}
									className="w-full mt-4 bg-black text-white hover:bg-gray-800 hoverScaleDownEffect rounded-full"
									onClick={() => {
										if (selectedCampaign?.status === "paused") {
											toast({
												variant: "destructive",
												title: "Campaign Paused",
												description:
													"This campaign is currently paused and cannot be shared.",
												toastStatus: "negative",
											});
										} else {
											setToggleNotifyAlert(true);
										}
									}}
								>
									Share Campaign Now
								</Button>

								{/* <Button
									variant="outline"
									className="w-full mt-2 border-black text-black hoverScaleDownEffect rounded-full"
								>
									Schedule for Later
								</Button> */}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
};

export default WhatsappCampaign;
