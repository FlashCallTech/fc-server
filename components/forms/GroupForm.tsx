import { useForm, Controller, useFieldArray, Form } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Group } from "@/types";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

const groupSchema = z.object({
	name: z.string().min(3, "Group name must be at least 3 characters"),
	description: z.string().min(5, "Description must be at least 5 characters"),
	behaviorRules: z
		.array(
			z.object({
				metric: z.string(),
				operator: z.string(),
				value: z.number().min(0, "Value must be at least 0"),
				timeframe: z.string(),
			})
		)
		.optional(),
	autoUpdate: z.boolean(),
	notifications: z.boolean(),
});

type GroupFormValues = z.infer<typeof groupSchema>;

const GroupForm = ({
	initialData,
	onSubmit,
	onOpenChange,
	creatorId,
	loading,
}: {
	initialData?: Group;
	onSubmit: (data: Group) => void;
	onOpenChange: (isOpen: boolean) => void;
	creatorId: string | undefined;
	loading?: boolean;
}) => {
	const {
		register,
		handleSubmit,
		control,
		watch,
		reset,
		formState: { errors, isValid, isSubmitting },
	} = useForm<GroupFormValues>({
		mode: "onChange",
		resolver: zodResolver(groupSchema),
		defaultValues: initialData || {
			name: "",
			description: "",
			behaviorRules: [
				{
					metric: "Purchase frequency",
					operator: "Greater than",
					value: 0,
					timeframe: "Last 7 days",
				},
			],
			autoUpdate: true,
			notifications: false,
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "behaviorRules",
	});

	const handleFormSubmit = (data: GroupFormValues) => {
		const sanitizedBehaviorRules = data?.behaviorRules?.map((rule) => {
			if (rule.metric === "Login activity") {
				return {
					...rule,
					operator: "Greater than",
					value: 1,
				};
			}
			return rule;
		});

		// Filter out incomplete rules
		const filteredBehaviorRules = sanitizedBehaviorRules?.filter(
			(rule) =>
				rule.metric?.trim() &&
				rule.operator?.trim() &&
				rule.value !== undefined &&
				rule.value !== null
		);

		const formattedData: Group = {
			...data,
			owner: initialData?.owner || creatorId,
			members: initialData?.members || [],
			membersCount: initialData?.membersCount || 0,
			behaviorRules: filteredBehaviorRules,
		};

		reset();
		onSubmit(formattedData);
	};

	return (
		<form
			onSubmit={handleSubmit(handleFormSubmit)}
			className="relative flex flex-col items-start justify-start gap-4 size-full"
		>
			<div className="flex flex-col items-start justify-start gap-4 w-full p-4 pt-0 md:px-6 ">
				{/* Group Name */}
				<div className="w-full flex flex-col items-start justify-start gap-2">
					<label className="block text-sm font-medium">
						Group Name <span className="text-red-500">*</span>
					</label>
					<Input {...register("name")} placeholder="Enter group name" />
					{errors.name && (
						<p className="text-red-500 text-sm">{errors.name.message}</p>
					)}
				</div>

				{/* Description */}
				<div className="w-full flex flex-col items-start justify-start gap-2">
					<label className="block text-sm font-medium">
						Description <span className="text-red-500">*</span>
					</label>
					<Textarea
						{...register("description")}
						placeholder="Describe the purpose of this group"
						className="max-h-28"
					/>
					{errors.description && (
						<p className="text-red-500 text-sm">{errors.description.message}</p>
					)}
				</div>

				{/* Behavior Rules */}
				<div className="mt-5 w-full flex flex-col items-start justify-start gap-4">
					<div className="w-full flex justify-between items-center">
						<label className="block text-lg font-semibold">
							Behavior Rules
						</label>
						<Button
							type="button"
							onClick={() =>
								append({ metric: "", operator: "", value: 0, timeframe: "" })
							}
							className="flex items-center gap-2 border border-gray-300 hover:bg-gray-100"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="size-5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 4.5v15m7.5-7.5h-15"
								/>
							</svg>
							<span className="mt-1">Add Rule</span>
						</Button>
					</div>
					{fields.map((field, index) => (
						<div className="w-full flex flex-wrap gap-4" key={field.id}>
							<div
								className="w-full grid gap-2 items-center"
								style={{
									gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
								}}
							>
								{/* Metric */}
								<Controller
									control={control}
									name={`behaviorRules.${index}.metric`}
									render={({ field }) => (
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select Metric" />
											</SelectTrigger>
											<SelectContent className="bg-white">
												<SelectItem
													className="cursor-pointer hover:bg-gray-100"
													value="Purchase frequency"
												>
													Purchase Frequency
												</SelectItem>
												<SelectItem
													className="cursor-pointer hover:bg-gray-100"
													value="Login activity"
												>
													Login Activity
												</SelectItem>
												<SelectItem
													className="cursor-pointer hover:bg-gray-100"
													value="Spending amount"
												>
													Spending Amount
												</SelectItem>
											</SelectContent>
										</Select>
									)}
								/>
								{/* Operator */}
								<Controller
									control={control}
									name={`behaviorRules.${index}.operator`}
									render={({ field }) => (
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
											disabled={
												watch(`behaviorRules.${index}.metric`) ===
												"Login activity"
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select Operator" />
											</SelectTrigger>
											<SelectContent className="bg-white">
												<SelectItem
													className="cursor-pointer hover:bg-gray-100"
													value="Greater than"
												>
													Greater Than
												</SelectItem>
												<SelectItem
													className="cursor-pointer hover:bg-gray-100"
													value="Less than"
												>
													Less Than
												</SelectItem>
												<SelectItem
													className="cursor-pointer hover:bg-gray-100"
													value="Equal to"
												>
													Equal To
												</SelectItem>
											</SelectContent>
										</Select>
									)}
								/>

								{/* Value */}
								<Input
									type="number"
									{...register(`behaviorRules.${index}.value` as const, {
										valueAsNumber: true,
										setValueAs: (v) =>
											watch(`behaviorRules.${index}.metric`) ===
											"Login activity"
												? 1
												: v,
									})}
									disabled={
										watch(`behaviorRules.${index}.metric`) === "Login activity"
									}
									placeholder={
										watch(`behaviorRules.${index}.metric`) ===
										"Purchase frequency"
											? "Enter number of purchases"
											: "Enter Value"
									}
									min={0}
								/>
								{/* Timeframe */}
								<Controller
									control={control}
									name={`behaviorRules.${index}.timeframe`}
									render={({ field }) => (
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select Timeframe" />
											</SelectTrigger>
											<SelectContent className="bg-white">
												<SelectItem
													className="cursor-pointer hover:bg-gray-100"
													value="Last 7 days"
												>
													Last 7 Days
												</SelectItem>
												<SelectItem
													className="cursor-pointer hover:bg-gray-100"
													value="Last 30 days"
												>
													Last 30 Days
												</SelectItem>
												<SelectItem
													className="cursor-pointer hover:bg-gray-100"
													value="Last year"
												>
													Last Year
												</SelectItem>
											</SelectContent>
										</Select>
									)}
								/>
							</div>

							{/* Remove Button */}
							<Button
								type="button"
								onClick={() => remove(index)}
								className="bg-red-500 text-white px-4 py-2 min-w-20 hoverScaleDownEffect ml-auto"
							>
								Remove
							</Button>
						</div>
					))}

					{errors.behaviorRules && (
						<p className="text-red-500 text-sm">
							{errors.behaviorRules.message}
						</p>
					)}
				</div>

				<p className="block text-lg font-semibold">Advanced Settings</p>

				{/* Auto-update & Notifications */}
				<div className="w-full flex justify-between">
					<div className="flex flex-col gap-1 items-start justify-start">
						<label className="text-sm font-semibold">
							Auto-update group members
						</label>
						<span className="text-sm text-[#6B7280]">
							Automatically add or remove members based on rules
						</span>
					</div>
					<Controller
						name="autoUpdate"
						control={control}
						render={({ field }) => (
							<Switch checked={field.value} onCheckedChange={field.onChange} />
						)}
					/>
				</div>
				<div className="w-full flex justify-between">
					<div className="flex flex-col gap-1 items-start justify-start">
						<label className="text-sm font-semibold">Notifications</label>
						<span className="text-sm text-[#6B7280]">
							Send notifications when members join or leave
						</span>
					</div>
					<Controller
						name="notifications"
						control={control}
						render={({ field }) => (
							<Switch checked={field.value} onCheckedChange={field.onChange} />
						)}
					/>
				</div>
			</div>

			{/* Submit */}
			<div className="mt-auto sticky bottom-0 right-0 py-2.5 pr-4 w-full flex justify-end gap-2.5 bg-white">
				<Button
					variant="ghost"
					onClick={() => onOpenChange(false)}
					className="border border-gray-300 rounded-full hover:bg-gray-100"
				>
					Cancel
				</Button>
				<Button
					disabled={!isValid || isSubmitting || loading}
					type="submit"
					className="bg-black text-white rounded-full hoverScaleDownEffect"
				>
					{isSubmitting || loading ? "Saving..." : "Save Group"}
				</Button>
			</div>
		</form>
	);
};

export default GroupForm;
