import * as z from "zod";
const usernameRegex = /^[a-zA-Z0-9_-]+$/;

export const UpdateProfileFormSchema = z.object({
	firstName: z.string().min(3, "Title must be at least 3 characters"),
	lastName: z.string().min(3, "Last name must be at least 3 characters"),
	username: z
		.string()
		.min(4, "Username must be at least 4 characters")
		.regex(
			usernameRegex,
			"Username can only contain letters, numbers, underscores, and hyphens"
		),
	profession: z.string().min(5, "Profession must be at least 5 characters"),
	themeSelected: z.string().min(3, "Profile Theme must be a valid hexcode"),
	photo: z.string().optional(),
	bio: z.string().optional(),
	gender: z.string().min(3, "This field is Required"),
	dob: z.string().min(6, "This field is Required"),
});

export const UpdateProfileFormSchemaClient = z.object({
	firstName: z.string().min(3, "Title must be at least 3 characters"),
	lastName: z.string().min(3, "Last name must be at least 3 characters"),
	username: z
		.string()
		.min(4, "Username must be at least 4 characters")
		.regex(
			usernameRegex,
			"Username can only contain letters, numbers, underscores, and hyphens"
		),
	profession: z.string().optional(),
	themeSelected: z.string().optional(),
	photo: z.string().optional(),
	bio: z.string().optional(),
	gender: z.string().optional(),
	dob: z.string().optional(),
});

export const enterAmountSchema = z.object({
	rechargeAmount: z
		.string()
		.regex(/^\d+$/, "Amount must be a numeric value")
		.min(1, "Amount must be at least 1 rupees")
		.max(6, "Amount must be at most 1,00,000 rupees"),
});

export const enterTipAmountSchema = z.object({
	amount: z
		.string()
		.regex(/^\d+$/, "Amount must be a numeric value")
		.min(1, "Amount must be at least 1 rupees")
		.max(6, "Amount must be at most 1,00,000 rupees"),
});
