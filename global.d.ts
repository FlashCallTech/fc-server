import { RazorpayOptions } from "./types";
declare global {
	interface Window {
		Razorpay: new (options: RazorpayOptions) => {
			on: (event: string, callback: (response: any) => void) => void;
			open: () => void;
		};
	}
}
