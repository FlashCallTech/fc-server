import { connectToDatabase } from "../database";
import Client from "../database/models/client.model";
import Creator from "../database/models/creator.model";
import { handleError } from "../utils";

export async function getUserByPhone(phone: string) {
	try {
		await connectToDatabase();
		// console.log(phone);
		// Search in Client model
		let user = await Client.findOne({ phone });
		if (user) {
			// If user is found in Client model
			return {
				...JSON.parse(JSON.stringify(user)),
				userType: "client",
			};
		}

		// Search in Creator model if not found in Client model
		user = await Creator.findOne({ phone });
		if (user) {
			// If user is found in Creator model
			return {
				...JSON.parse(JSON.stringify(user)),
				userType: "creator",
			};
		}

		// If no user is found in both models
		return JSON.stringify("No User Found");
	} catch (error) {
		handleError(error);
	}
}
