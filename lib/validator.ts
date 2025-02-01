import * as z from "zod";
const usernameRegex = /^[a-zA-Z0-9_\-+]+$/;

export const discountServiceFormSchema = z.object({
	title: z.string().min(2, "Title must be at least 2 characters."),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters."),
	photo: z.string().optional(),
	type: z
		.array(z.string(), {
			required_error: "At least one service type is required.",
		})
		.nonempty("You must select at least one type."),
	isActive: z.boolean({
		required_error: "isActive is required.",
	}),
	currency: z.enum(["INR", "USD"], {
		required_error: "Currency is required.",
	}),
	discountRules: z
		.array(
			z.object({
				conditions: z
					.array(z.string())
					.nonempty("At least one condition is required."),
				discountType: z.enum(["percentage", "flat"]),
				discountAmount: z.union([
					z.number({
						required_error: "Discount amount is required.",
					}),
					z.literal(null),
				]),
			})
		)
		.optional(),
	extraDetails: z.string().optional(),
});

export type DiscountService = z.infer<typeof discountServiceFormSchema>;

export const availabilityServiceFormSchema = z.object({
	title: z.string().min(2, "Title must be at least 2 characters."),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters."),
	photo: z.string().optional(),
	type: z.enum(["audio", "video", "chat"], {
		required_error: "Service type is required.",
	}),
	timeDuration: z
		.number()
		.int()
		.positive("Duration must be a positive number.")
		.min(15, "Duration must be at least 15 minutes.")
		.optional(),
	basePrice: z.preprocess(
		(value) => (value === null || value === undefined ? NaN : value),
		z
			.number({
				required_error: "Base price is required.",
				invalid_type_error: "Base price must be a valid number.",
			})
			.int()
			.positive("Price must be greater than 0.")
			.min(10, "Price must be greater than 10.")
	),
	isActive: z.boolean({
		required_error: "isActive is required.",
	}),
	currency: z.enum(["INR", "USD"], {
		required_error: "Currency is required.",
	}),
	discountRules: z
		.object({
			conditions: z
				.array(z.string())
				.nonempty("At least one condition is required."),
			discountType: z.enum(["percentage", "flat"]),
			discountAmount: z.union([
				z.number({
					required_error: "Discount amount is required.",
				}),
				z.literal(null),
			]),
		})
		.optional(),
	extraDetails: z.string().optional(),
});

export type AvailabilityService = z.infer<typeof availabilityServiceFormSchema>;

export const UpdateProfileFormSchema = z.object({
	firstName: z
		.string()
		.min(3, "First Name must be at least 3 characters")
		.regex(/^[^\d]+$/, "First Name cannot contain numbers"),
	lastName: z
		.string()
		.min(3, "Last Name must be at least 3 characters")
		.regex(/^[^\d]+$/, "Last Name cannot contain numbers"),
	username: z
		.string()
		.min(4, "Username must be at least 4 characters")
		.max(24, "Username must be at most 24 characters")
		.regex(
			usernameRegex,
			"Username can only contain letters, numbers, underscores, and hyphens"
		),
	profession: z
		.string()
		.min(3, "Profession must be at least 3 characters")
		.regex(/^[^\d]+$/, "Last Name cannot contain numbers"),
	themeSelected: z.string().min(6, "Profile Theme must be a valid hexcode"),
	photo: z.string().optional(),
	bio: z.string().optional(),
	gender: z.string().min(3, "This field is Required"),
	dob: z.string().min(6, "This field is Required"),
	referredBy: z.string().optional(),
});

export const UpdateProfileFormSchemaClient = z.object({
	firstName: z
		.string()
		.min(3, "First Name must be at least 3 characters")
		.regex(/^[^\d]+$/, "First Name cannot contain numbers"),
	lastName: z
		.string()
		.min(3, "Last Name must be at least 3 characters")
		.regex(/^[^\d]+$/, "Last Name cannot contain numbers"),
	username: z
		.string()
		.min(4, "Username must be at least 4 characters")
		.max(24, "Username must be at most 24 characters")
		.regex(
			usernameRegex,
			"Username can only contain letters, numbers, underscores, and hyphens"
		),
	profession: z.string().optional(),
	referredBy: z.string().optional(),
	themeSelected: z.string().optional(),
	photo: z.string().optional(),
	bio: z.string().optional(),
	gender: z.string().optional(),
	dob: z.string().optional(),
});

export const enterAmountSchema = z.object({
	rechargeAmount: z
		.string()
		.refine((val) => parseFloat(val) >= 1, "Amount must be at least 1 rupee")
		.refine(
			(val) => parseFloat(val) <= 100000,
			"Amount must be at most 1,00,000 rupees"
		),
});

export const enterGlobalAmountSchema = z.object({
	rechargeAmount: z
		.string()
		.refine(
			(val) => parseFloat(val) >= 0.1,
			"Amount must be at least 0.1 dollar"
		)
		.refine(
			(val) => parseFloat(val) <= 100000,
			"Amount must be at most 1,00,000 dollars"
		),
});

export const enterTipAmountSchema = z.object({
	amount: z
		.string()
		.regex(/^\d+$/, "Amount must be a numeric value")
		.min(1, "Amount must be at least 1 rupees")
		.max(6, "Amount must be at most 1,00,000 rupees"),
});

export const reportSchema = z.object({
	issue: z
		.string()
		.min(10, "Content must be at least 10 characters")
		.max(500, "Words Limit Exceeded"),
});
