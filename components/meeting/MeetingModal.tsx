"use client";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "../ui/button";

import { Dialog, DialogContent } from "../ui/dialog";

interface MeetingModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	className?: string;
	children?: ReactNode;
	handleClick?: () => void;
	buttonText?: string;
	instantMeeting?: boolean;
	image?: string;
	buttonClassName?: string;
	buttonIcon?: string;
	theme?: string;
}

const MeetingModal = ({
	isOpen,
	onClose,
	title,
	className,
	children,
	handleClick,
	buttonText,
	instantMeeting,
	image,
	buttonClassName,
	buttonIcon,
	theme,
}: MeetingModalProps) => {
	const boxShadowTheme = `5px 5px 5px 0px ${theme}`;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="rounded-xl flex w-full max-w-[92%] md:max-w-[520px] flex-col gap-6 border-none px-6 py-9  text-white"
				style={{
					background: theme,
				}}
			>
				<div className="flex flex-col gap-6">
					{image && (
						<div className="flex justify-center">
							<Image
								src={image}
								alt="checked"
								width={1000}
								height={1000}
								className="rounded-full w-32 h-32 object-cover"
								onError={(e) => {
									e.currentTarget.src = "/images/defaultProfileImage.png";
								}}
							/>
						</div>
					)}
					<h1
						className={cn(
							"text-xl sm:text-2xl  font-bold leading-[42px]",
							className
						)}
					>
						{title}
					</h1>
					{children}
					<Button
						className={
							"bg-white  focus-visible:ring-0 focus-visible:ring-offset-0 font-semibold w-full max-w-[75%] md:max-w-[13rem] mx-auto hoverScaleEffect"
						}
						style={{
							boxShadow: boxShadowTheme,
							color: theme,
						}}
						onClick={handleClick}
					>
						{buttonIcon && (
							<Image
								src={buttonIcon}
								alt="button icon"
								width={13}
								height={13}
							/>
						)}{" "}
						&nbsp;
						{buttonText || "Schedule Meeting"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default MeetingModal;
