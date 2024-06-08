import jwt from "jsonwebtoken";

export const generateToken = (phone: string, otp: string): string => {
	try {
		const secret = process.env.JWT_KEY || "DEFAULT"; // Fallback value

		const token = jwt.sign({ phone, otp }, secret, {
			expiresIn: "10m",
		});
		return token;
	} catch (error) {
		console.error("Error generating token:", error);
		throw error; // Rethrow the error for further investigation
	}
};

export const verifyToken = (
	token: string
): { phone: string; otp: string } | null => {
	try {
		const decoded = jwt.verify(token, process.env.JWT_KEY || "DEFAULT") as {
			phone: string;
			otp: string;
		};
		return decoded;
	} catch (error) {
		console.error("Error verifying token:", error);
		return null;
	}
};
