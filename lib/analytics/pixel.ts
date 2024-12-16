import ReactPixel from "react-facebook-pixel";
import { backendBaseUrl } from "../utils";
import axios from "axios";

// Flag to track whether Meta Pixel has been initialized
let isPixelInitialized = false;

/**
 * Initialize the Facebook Pixel.
 * @param {string} pixelId - Your Pixel ID
 */
export const initializeMetaPixel = (pixelId: string) => {
	ReactPixel.init(pixelId); // Initialize Pixel
	isPixelInitialized = true; // Set the flag to true
};

/**
 * Track custom events.
 * @param {string} eventName - The name of the event
 * @param {object} data - Additional data to send with the event
 */
export const trackPixelEvent = (eventName: string, data: object = {}) => {
	if (!isPixelInitialized) {
		return;
	}

	ReactPixel.trackCustom(eventName, data);
};

/**
 * Track standard events (e.g., "Purchase", "Lead").
 * @param {string} eventName - The standard event name
 * @param {object} data - Additional data to send with the event
 */
export const trackStandardEvent = (eventName: string, data: object = {}) => {
	if (!isPixelInitialized) {
		return;
	}

	ReactPixel.trackCustom(eventName, data);
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

		if (pixelId) {
			initializeMetaPixel(pixelId);
		}
	} catch (error) {
		console.warn("Error initializing Meta Pixel for creator:");
	}
};

export default {
	initializeMetaPixel,
	trackPixelEvent,
	trackStandardEvent,
	fetchCreatorDataAndInitializePixel,
};
