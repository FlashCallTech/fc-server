"use server";

import { connectToDatabase } from "@/lib/database";
import { handleError } from "@/lib/utils";
import Favorites from "../database/models/favorites.model";
import mongoose from "mongoose";
import Creator from "../database/models/creator.model";

export async function toggleFavorite({
	clientId,
	creatorId,
}: {
	clientId: string;
	creatorId: string;
}) {
	try {
		await connectToDatabase();

		const existingFavorites = await Favorites.findOne({ clientId }).exec();

		if (existingFavorites) {
			// Check if the creator is already in favorites
			const index = existingFavorites.favorites.findIndex(
				(favorite: any) => favorite.creatorId.toString() === creatorId
			);

			if (index !== -1) {
				// If the creator exists, remove it from favorites
				existingFavorites.favorites.splice(index, 1);
			} else {
				// If the creator does not exist, add it to favorites
				existingFavorites.favorites.push({ creatorId });
			}

			await existingFavorites.save();
		} else {
			// If no favorites entry exists for the client, create a new one
			const newFavorites = new Favorites({
				clientId,
				favorites: [{ creatorId }],
			});
			await newFavorites.save();
		}

		return { success: "Favorites updated successfully" };
	} catch (error: any) {
		handleError(error);
		console.log("Error updating favorites ... ", error);
		return { success: false, error: error.message };
	}
}

export async function getFavorites(clientId: string) {
	try {
		await connectToDatabase();

		// Manually register the Creator model if necessary
		if (!mongoose.models.Creator) {
			mongoose.model("Creator", Creator.schema);
		}

		const favorites = await Favorites.findOne({ clientId })
			.populate("favorites.creatorId")
			.lean();

		// Return the favorites as JSON
		return JSON.parse(JSON.stringify(favorites));
	} catch (error: any) {
		handleError(error);
		console.log("Error Fetching Favorites ... ", error);
		return { success: false, error: error.message };
	}
}
