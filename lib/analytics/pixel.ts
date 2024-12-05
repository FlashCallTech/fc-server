import ReactPixel from "react-facebook-pixel";
import { backendBaseUrl } from "../utils";
import axios from "axios";

/**
 * Initialize the Facebook Pixel.
 * @param {string} pixelId - Your Pixel ID
 */

export const initializeMetaPixel = (pixelId: string) => {
	ReactPixel.init(pixelId); // Initialize Pixel
	ReactPixel.pageView(); // Track Page View
	console.log(`Meta Pixel initialized with ID: ${pixelId}`);
};

/**
 * Track custom events.
 * @param {string} eventName - The name of the event
 * @param {object} data - Additional data to send with the event
 */

export const trackEvent = (eventName: string, data: object = {}) => {
	ReactPixel.track(eventName, data);
	console.log(`Tracked event: ${eventName}`, data);
};

/**
 * Track standard events (e.g., "Purchase", "Lead").
 * @param {string} eventName - The standard event name
 * @param {object} data - Additional data to send with the event
 */

export const trackStandardEvent = (eventName: string, data: object = {}) => {
	ReactPixel.trackCustom(eventName, data);
	console.log(`Tracked standard event: ${eventName}`, data);
};

/**
 * Fetch the creator's data (Pixel ID and other details) and initialize the Meta Pixel.
 * @param {string} creatorId - The ID of the creator.
 * @returns {Promise<void>} - Resolves when Meta Pixel is initialized successfully.
 */
export const fetchCreatorDataAndInitializePixel = async (
	creatorId: string
): Promise<void> => {
	try {
		const response = await axios.get(
			`${backendBaseUrl}/creator/analytics/${creatorId}`
		);

		const pixelId = response.data.data.pixelId || "";
		const accessToken = response.data.data.accessToken || "";

		if (pixelId) {
			initializeMetaPixel(pixelId);

			ReactPixel.pageView();

			console.log(`Meta Pixel initialized for creator with ID: ${creatorId}`);
		} else {
			console.error("No Pixel ID found for this creator.");
		}
	} catch (error) {
		console.error("Error initializing Meta Pixel for creator:", error);
	}
};
