import * as z from "zod";

export const editProfileFormSchema = z.object({
	firstName: z.string().min(3, "Title must be at least 3 characters"),
	lastName: z.string().min(3, "Last name must be at least 3 characters"),
	username: z.string().min(4, "Last name must be at least 4 characters"),
	bio: z
		.string()
		.min(3, "Description must be at least 3 characters")
		.max(400, "Description must be less than 400 characters"),
});

export const enterAmountSchema = z.object({
	rechargeAmount: z
		.string()
		.regex(/^\d+$/, "Amount must be a numeric value")
		.min(1, "Amount must be at least 1 rupees")
		.max(6, "Amount must be at most 1,00,000 rupees"),
});
