import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { MessageTemplate } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface MessageTemplateProps {
	selectedTab: string;
	setSelectedTab: React.Dispatch<React.SetStateAction<string>>;
	customTemplateData: {
		title: string;
		description: string;
		body: string;
	};
	setCustomTemplateData: React.Dispatch<
		React.SetStateAction<{
			title: string;
			description: string;
			body: string;
		}>
	>;
	selectedTemplate: MessageTemplate | null;
	setSelectedTemplate: React.Dispatch<
		React.SetStateAction<MessageTemplate | null>
	>;
	savingTemplate: boolean;
	setSavingTemplate: React.Dispatch<React.SetStateAction<boolean>>;
	handleCustomTemplateSubmission: () => void;
	insertPlaceholder: (placeholder: string) => void;
	preApprovedTemplates: MessageTemplate[];
	customTemplates: MessageTemplate[];
	hasMorePreApprovedTemplates: boolean;
	hasMoreCustomTemplates: boolean;
	fetchNextPreApprovedTemplates: () => void;
	fetchNextCustomTemplates: () => void;
}

const MessageTemplateSection = ({
	selectedTab,
	setSelectedTab,
	customTemplateData,
	setCustomTemplateData,
	selectedTemplate,
	setSelectedTemplate,
	savingTemplate,
	setSavingTemplate,
	handleCustomTemplateSubmission,
	insertPlaceholder,
	preApprovedTemplates,
	customTemplates,
	hasMorePreApprovedTemplates,
	hasMoreCustomTemplates,
	fetchNextPreApprovedTemplates,
	fetchNextCustomTemplates,
}: MessageTemplateProps) => {
	return (
		<Card className="mt-4">
			<CardContent className="p-4">
				<h3 className="text-lg font-semibold">Message Template</h3>

				{/* Tabs */}
				<Tabs
					value={selectedTab}
					onValueChange={setSelectedTab}
					className="mt-3"
				>
					<TabsList className="flex justify-start items-center w-full border-b">
						<TabsTrigger
							value="pre-approved"
							className={`py-2 px-4 font-semibold ${
								selectedTab === "pre-approved"
									? "border-b-2 border-black"
									: "text-gray-500"
							}`}
						>
							Pre-approved Templates
						</TabsTrigger>
						<TabsTrigger
							value="custom"
							className={`py-2 px-4 font-semibold ${
								selectedTab === "custom"
									? "border-b-2 border-black"
									: "text-gray-500"
							}`}
						>
							Custom Message
						</TabsTrigger>
					</TabsList>

					{/* Pre-approved Templates */}
					<TabsContent value="pre-approved">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
							{preApprovedTemplates && preApprovedTemplates.length > 0 ? (
								preApprovedTemplates.map((template: MessageTemplate) => (
									<Card
										key={template._id}
										className={`p-4 border rounded-lg shadow-sm cursor-pointer hover:shadow-md ${
											selectedTemplate?._id === template._id
												? "bg-gray-100"
												: ""
										}`}
										onClick={() =>
											setSelectedTemplate((prev) =>
												prev?._id === template._id ? null : template
											)
										}
									>
										<h4 className="font-semibold">{template.title}</h4>
										<p className="text-sm text-gray-500">{template.body}</p>
									</Card>
								))
							) : (
								<div className="size-full flex flex-col gap-2 items-center justify-center text-center mt-2.5 pb-4">
									<div className="bg-black/10 size-20 rounded-full flex items-center justify-center">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="size-[35px]"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
											/>
										</svg>
									</div>

									<p className="mt-2.5 font-bold text-lg text-[#111827]">
										No Templates Found
									</p>
									<span className="text-base text-[#6B7280]">
										Pre-Approved templates will appear here
									</span>
								</div>
							)}
						</div>

						{/* Load More Button */}
						{hasMorePreApprovedTemplates && (
							<Button
								onClick={fetchNextPreApprovedTemplates}
								className="mt-4 w-full"
							>
								Load More
							</Button>
						)}
					</TabsContent>

					{/* Custom Message */}
					<TabsContent value="custom">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
							{customTemplates && customTemplates.length > 0 ? (
								customTemplates.map((template: MessageTemplate) => (
									<Card
										key={template._id}
										className={`p-4 border rounded-lg shadow-sm cursor-pointer hover:shadow-md ${
											selectedTemplate?._id === template._id
												? "bg-gray-100"
												: ""
										}`}
										onClick={() =>
											setSelectedTemplate((prev) =>
												prev?._id === template._id ? null : template
											)
										}
									>
										<h4 className="font-semibold">{template.title}</h4>
										<p className="text-sm text-gray-500">{template.body}</p>
									</Card>
								))
							) : (
								<div className="size-full flex flex-col gap-2 items-center justify-center text-center mt-2.5 pb-4">
									<div className="bg-black/10 size-20 rounded-full flex items-center justify-center">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="size-[35px]"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
											/>
										</svg>
									</div>

									<p className="mt-2.5 font-bold text-lg text-[#111827]">
										No Templates Found
									</p>
									<span className="text-base text-[#6B7280]">
										Added templates will appear here
									</span>
								</div>
							)}
						</div>

						{/* Load More Button */}
						{hasMoreCustomTemplates && (
							<Button
								onClick={fetchNextCustomTemplates}
								className="mt-4 w-full"
							>
								Load More
							</Button>
						)}

						{/* Custom Message Editor */}
						<Card className="p-4 mt-4 border rounded-lg shadow-sm">
							<h4 className="font-semibold">Custom Message</h4>
							<Textarea
								placeholder="Enter your custom message..."
								className="w-full h-24 border rounded-md mt-2 max-h-40"
								value={customTemplateData.body}
								onChange={(e) =>
									setCustomTemplateData((prev) => ({
										...prev,
										body: e.target.value,
									}))
								}
							/>

							<div className="flex gap-2 mt-4">
								<Button
									variant="outline"
									className="border border-gray-300 text-sm rounded-md hover:bg-gray-100"
									onClick={() => insertPlaceholder("{name}")}
								>
									{"{name}"}
								</Button>
								<Button
									variant="outline"
									className="border border-gray-300 text-sm rounded-md hover:bg-gray-100"
									onClick={() => insertPlaceholder("{phone}")}
								>
									{"{phone}"}
								</Button>
							</div>

							<div className="w-full flex justify-end items-center">
								<Button
									className="mt-4 ml-auto bg-black text-white px-4 py-2 rounded-md"
									onClick={handleCustomTemplateSubmission}
									disabled={savingTemplate || !customTemplateData.body}
								>
									{savingTemplate ? "Saving..." : "Save Template"}
								</Button>
							</div>
						</Card>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
};

export default MessageTemplateSection;
