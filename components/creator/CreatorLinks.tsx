import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { LinkType, UpdateCreatorParams } from "@/types";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import LinkActions from "./LinkActions";
import EditLink from "./EditLink";
import AddLink from "./AddLink";
import DeleteLink from "./DeleteLink";
import * as Sentry from "@sentry/nextjs";

const CreatorLinks = () => {
	const { creatorUser, refreshCurrentUser } = useCurrentUsersContext();
	const [links, setLinks] = useState(creatorUser?.links);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedLinkIndex, setSelectedLinkIndex] = useState<number | null>(
		null
	);
	const [isLinkActionsOpen, setIsLinkActionsOpen] = useState(false);
	const [editLinkOpen, setEditLinkOpen] = useState(false);
	const [linkToEdit, setLinkToEdit] = useState<{
		title: string;
		url: string;
	} | null>(null);
	const [isDeleteLink, setIsDeleteLink] = useState(false);
	const [addLinkOpen, setAddLinkOpen] = useState(false);

	useEffect(() => {
		setLinks(creatorUser?.links);
	}, [creatorUser]);

	const handleMoreClick = (index: number) => {
		setSelectedLinkIndex(index);
		setIsLinkActionsOpen(true);
	};

	const handleEdit = () => {
		if (selectedLinkIndex !== null && creatorUser?.links) {
			const link = creatorUser.links[selectedLinkIndex];
			setIsLinkActionsOpen(false);
			setLinkToEdit(link);
			setEditLinkOpen(true);
		}
	};

	const handleDelete = async () => {
		setIsLinkActionsOpen(false);
		setIsDeleteLink(true);
	};

	const handleLinkToggle = async (index: number) => {
		const updatedLinks = creatorUser?.links?.map((link, i) =>
			i === index ? { ...link, isActive: !link.isActive } : link
		);

		setLinks(updatedLinks);
		// Save the updated links to the server
		saveUpdatedLinks(updatedLinks!);
	};

	const saveUpdatedLinks = async (updatedLinks: LinkType[]) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/v1/creator/updateUser", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: creatorUser?._id,
					user: { links: updatedLinks },
				}),
			});

			if (response.ok) {
				await refreshCurrentUser(); // Refresh the current user data to reflect changes
			} else {
				console.error("Failed to update the user links");
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("An error occurred while updating the user links:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSaveEditLink = async (LinkData: {
		title: string;
		url: string;
	}) => {
		if (selectedLinkIndex !== null && creatorUser) {
			try {
				if (creatorUser.links) {
					const updatedLinks = creatorUser.links.map((link, index) =>
						index === selectedLinkIndex ? { ...link, ...LinkData } : link
					);

					// Save the updated links to the server
					await saveUpdatedLinks(updatedLinks);
				}
				// Refresh the user data to reflect the changes
				refreshCurrentUser();
				setEditLinkOpen(false);
				setSelectedLinkIndex(null);
			} catch (error) {
				Sentry.captureException(error);
				console.error("Failed to update the link:", error);
			}
		}
	};

	const handleDeleteLink = async () => {
		if (selectedLinkIndex !== null && creatorUser) {
			try {
				// Get the link to be deleted
				if (creatorUser.links) {
					const linkToDelete = creatorUser.links[selectedLinkIndex];

					// Send a request to delete the link from the database
					const response = await fetch("/api/v1/creator/deleteLink", {
						method: "DELETE",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							userId: creatorUser._id,
							link: linkToDelete, // Send the entire link object to identify the link
						}),
					});

					if (response.ok) {
						// Update the local state by removing the deleted link
					}
					const updatedLinks = creatorUser.links.filter(
						(_, index) => index !== selectedLinkIndex
					);
					refreshCurrentUser(); // Refresh the current user data to reflect changes
				} else {
					console.error("Failed to delete the link");
				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("An error occurred while deleting the link:", error);
			} finally {
				setIsLinkActionsOpen(false);
				setSelectedLinkIndex(null);
			}
		}
	};

	const handleAddLink = async (linkData: { title: string; link: string }) => {
		try {
			// Assuming you have the userId available
			const userId = creatorUser?._id; // Replace this with the actual userId

			// Create a new Link object
			const newLink: LinkType = {
				title: linkData.title,
				url: linkData.link,
				isActive: true,
			};

			// Update the user's data with the new link
			const updateParams: UpdateCreatorParams = {
				link: newLink,
			};

			if (!newLink.title || !newLink.url) {
				return;
			}

			// Make the API request to update the user
			const response = await fetch("/api/v1/creator/updateUser", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userId, user: updateParams }),
			});

			if (response.ok) {
				const updatedUser = await response.json();
				console.log("User updated successfully:", updatedUser);
				refreshCurrentUser();
				// Handle the updated user data (e.g., update the state, notify the user)
			} else {
				console.error("Failed to update the user");
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("An error occurred while updating the user:", error);
		}
	};

	return (
		<>
			{creatorUser?.links && creatorUser.links.length > 0 && (
				<section className="flex flex-col gap-4">
					{links &&
						links.map((link, index) => (
							<div
								key={index}
								className="flex flex-row justify-between items-center border p-4 rounded-lg bg-white shadow-sm"
							>
								<a
									href={link.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-black font-bold hover:underline"
								>
									{link.title}
								</a>
								<div className="flex flex-row gap-2">
									<label className="relative inline-block w-14 h-6">
										<input
											type="checkbox"
											className="toggle-checkbox absolute w-0 h-0"
											checked={!!link.isActive} // Convert `undefined` to `false`
											onChange={() => handleLinkToggle(index)}
											disabled={isLoading}
										/>
										<p
											className={`toggle-label block overflow-hidden h-6 rounded-full ${
												link.isActive ? "bg-green-600" : "bg-gray-500"
											} servicesCheckbox ${
												isLoading ? "cursor-not-allowed" : "cursor-pointer"
											}`}
										>
											<span
												className="servicesCheckboxContent"
												style={{
													transform: link.isActive
														? "translateX(2.1rem)"
														: "translateX(0)",
												}}
											/>
										</p>
									</label>
									<Image
										src={"/more.svg"}
										width={0}
										height={0}
										alt="more"
										className="w-auto h-auto hover:cursor-pointer"
										onClick={() => handleMoreClick(index)}
									/>

									{isLinkActionsOpen && selectedLinkIndex === index && (
										<LinkActions
											onEdit={handleEdit}
											onDelete={handleDelete}
											onClose={() => setIsLinkActionsOpen(false)}
										/>
									)}
								</div>
							</div>
						))}
				</section>
			)}
			{editLinkOpen && linkToEdit && (
				<EditLink
					link={linkToEdit}
					onSave={handleSaveEditLink}
					onClose={() => setEditLinkOpen(false)}
				/>
			)}

			{addLinkOpen && (
				<AddLink onClose={() => setAddLinkOpen(false)} onSave={handleAddLink} />
			)}
			<section
				className="flex justify-center border-2 border-spacing-4 border-dotted border-gray-300 rounded-lg bg-white p-2 py-4 hover:cursor-pointer"
				onClick={() => setAddLinkOpen(true)}
			>
				<div>Add your links</div>
			</section>

			{isDeleteLink && (
				<DeleteLink
					onClose={() => setIsDeleteLink(false)}
					onSave={handleDeleteLink}
				/>
			)}
		</>
	);
};

export default CreatorLinks;
