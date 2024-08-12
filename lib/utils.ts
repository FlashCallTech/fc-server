import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import Razorpay from "razorpay";

const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const key_secret = process.env.NEXT_PUBLIC_RAZORPAY_SECRET;

if (!key_id || !key_secret) {
	throw new Error(
		"Razorpay key_id and key_secret must be defined in environment variables"
	);
}

export const razorpay = new Razorpay({
	key_id: key_id,
	key_secret: key_secret,
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const handleError = (error: unknown) => {
	console.error(error);
	throw new Error(typeof error === "string" ? error : JSON.stringify(error));
};

export const formatDateTime = (dateString: Date) => {
	const dateTimeOptions: Intl.DateTimeFormatOptions = {
		weekday: "short", // abbreviated weekday name (e.g., 'Mon')
		month: "short", // abbreviated month name (e.g., 'Oct')
		day: "numeric", // numeric day of the month (e.g., '25')
		hour: "numeric", // numeric hour (e.g., '8')
		minute: "numeric", // numeric minute (e.g., '30')
		hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
	};

	const dateOptions: Intl.DateTimeFormatOptions = {
		weekday: "short", // abbreviated weekday name (e.g., 'Mon')
		month: "short", // abbreviated month name (e.g., 'Oct')
		year: "numeric", // numeric year (e.g., '2023')
		day: "numeric", // numeric day of the month (e.g., '25')
	};

	const timeOptions: Intl.DateTimeFormatOptions = {
		hour: "numeric", // numeric hour (e.g., '8')
		minute: "numeric", // numeric minute (e.g., '30')
		hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
	};

	const formattedDateTime: string = new Date(dateString).toLocaleString(
		"en-US",
		dateTimeOptions
	);

	const formattedDate: string = new Date(dateString).toLocaleString(
		"en-US",
		dateOptions
	);

	const formattedTime: string = new Date(dateString).toLocaleString(
		"en-US",
		timeOptions
	);

	return {
		dateTime: formattedDateTime,
		dateOnly: formattedDate,
		timeOnly: formattedTime,
	};
};

export const calculateTotalEarnings = (transactions: any) => {
	return transactions.reduce((total: number, transaction: any) => {
		if (transaction.type === "credit") {
			return total + transaction.amount;
		} else if (transaction.type === "debit") {
			return total - transaction.amount;
		}
		return total.toFixed(2); // Default case if type is invalid
	}, 0);
};

export const analyticEvent = ({ action, category, label, value }: any) => {
	(window as any).gtag("event", action, {
		event_category: category,
		event_label: label,
		value: value,
	});
};

export const isValidUrl = (url: string) => {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
};
