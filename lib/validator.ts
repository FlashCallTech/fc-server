import * as z from "zod";

export const UpdateProfileFormSchema = z.object({
	firstName: z.string().min(3, "Title must be at least 3 characters"),
	lastName: z.string().min(3, "Last name must be at least 3 characters"),
	username: z.string().min(4, "Last name must be at least 4 characters"),
	profession: z.string().min(5, "Profession must be at least 5 characters"),
	themeSelected: z.string().min(3, "Profile Theme must be a valid hexcode"),
	photo: z
		.string()
		.optional()
		.refine((value) => !value || /^https?:\/\/.+\..+/i.test(value), {
			message: "Photo must be a valid URL",
		}),
	bio: z
		.string()
		.min(3, "Description must be at least 3 characters")
		.max(400, "Description must be less than 400 characters")
		.optional(),
	gender: z.string().min(3, "This field is Required"),
	dob: z.string().min(6, "This field is Required"),
	creatorId: z.string(),
});

export const enterAmountSchema = z.object({
	rechargeAmount: z
		.string()
		.regex(/^\d+$/, "Amount must be a numeric value")
		.min(1, "Amount must be at least 1 rupees")
		.max(6, "Amount must be at most 1,00,000 rupees"),
});
