import { backendBaseUrl } from "@/lib/utils";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

const HomepageFilter = ({
	selectedProfession,
	handleProfessionChange,
}: {
	selectedProfession: string;
	handleProfessionChange: (profession: string) => void;
}) => {
	const [professions, setProfessions] = useState([]);
	const [loadingProfessions, setLoadingProfessions] = useState(true);
	const [toggleFilter, setToggleFilter] = useState(false);
	const professionRefs = useRef<(HTMLDivElement | null)[]>([]);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const dropdownRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const fetchProfessions = async () => {
			try {
				const response = await axios.get(
					`${backendBaseUrl}/profession/selectProfession`
				);
				if (response.status === 200) {
					setProfessions(response.data.professions);
				}
			} catch (error) {
				console.error("Error fetching professions:", error);
			} finally {
				setLoadingProfessions(false);
			}
		};

		fetchProfessions();
	}, []);

	useEffect(() => {
		const activeProfessionIndex = professions.findIndex(
			(profession: any) => profession?.name === selectedProfession
		);
		if (
			activeProfessionIndex !== -1 &&
			professionRefs.current[activeProfessionIndex]
		) {
			professionRefs.current[activeProfessionIndex]?.scrollIntoView({
				behavior: "smooth",
				block: "center",
				inline: "center",
			});
		} else {
			scrollContainerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
		}
	}, [selectedProfession, professions]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setToggleFilter(false);
			}
		};

		if (toggleFilter) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [toggleFilter]);

	const handleClickAll = () => {
		scrollContainerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
		handleProfessionChange("All");
		setToggleFilter((prev) => !prev);
	};

	return (
		<div
			ref={dropdownRef}
			className="relative w-full flex items-center justify-start gap-2 py-4"
		>
			<button
				className={` text-sm font-medium px-[16px] py-[7px] rounded-[24px] border border-gray-300 hoverScaleDownEffect cursor-pointer outline-none ${
					toggleFilter && "bg-black text-white"
				}`}
				onClick={() => setToggleFilter((prev) => !prev)}
			>
				{toggleFilter ? (
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
							d="M6 18 18 6M6 6l12 12"
						/>
					</svg>
				) : (
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
							d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
						/>
					</svg>
				)}
			</button>
			{toggleFilter && (
				<section className="absolute top-16 left-0 max-w-[88vw] md:max-w-[44vw] mx-auto bg-white border border-gray-300 rounded-md shadow-md p-4 z-10">
					<span className="text-xl">Filter by Profession</span>
					<section className="mt-4 flex items-center justify-start flex-wrap gap-2.5">
						<section
							className={`text-sm font-medium px-[20px] py-[7px] rounded-[24px] border border-gray-300 hover:text-white hover:bg-black hoverScaleDownEffect cursor-pointer ${
								selectedProfession === "All" && "bg-black text-white"
							}`}
							onClick={handleClickAll}
						>
							<span className="text-xs sm:text-sm whitespace-nowrap">All</span>
						</section>
						{loadingProfessions
							? [...Array(7)].map((_, idx) => (
									<div
										key={idx}
										className="w-[80px] h-[34px] bg-gray-200 animate-pulse rounded-[24px] my-2"
									/>
							  ))
							: professions.map((profession: any) => (
									<section
										key={profession.id}
										className={`text-sm font-medium px-[20px] py-[7px] rounded-[24px] border border-gray-300 hover:text-white hover:bg-black cursor-pointer ${
											profession.name === selectedProfession &&
											"bg-black text-white"
										}`}
										onClick={() => {
											handleProfessionChange(profession?.name);
											setToggleFilter((prev) => !prev);
										}}
									>
										{profession.name}
									</section>
							  ))}
					</section>
				</section>
			)}

			{/* Other professions */}
			<section
				ref={scrollContainerRef}
				className="flex items-center justify-start gap-2 overflow-x-scroll no-scrollbar"
			>
				{loadingProfessions ? (
					// Skeleton placeholders while loading
					[...Array(6)].map((_, idx) => (
						<div
							key={idx}
							className="w-[80px] h-[34px] bg-gray-200 animate-pulse rounded-full"
						/>
					))
				) : (
					<>
						<section
							className={`text-sm font-medium px-[20px] py-[7px] rounded-full border border-gray-300 hover:text-white hover:bg-black hoverScaleDownEffect cursor-pointer ${
								selectedProfession === "All" && "bg-black text-white"
							}`}
							onClick={() => handleProfessionChange("All")}
						>
							<span className="text-xs sm:text-sm whitespace-nowrap">All</span>
						</section>
						{professions.map((profession: any, index: any) => (
							<section
								className={`text-sm font-medium px-[20px] py-[7px] rounded-full border border-gray-300 hover:text-white hover:bg-black hoverScaleDownEffect cursor-pointer ${
									profession.name === selectedProfession &&
									"bg-black text-white"
								}`}
								key={profession.id}
								ref={(el: any) => (professionRefs.current[index] = el)}
								onClick={() => handleProfessionChange(profession?.name)}
							>
								<span className="text-xs sm:text-sm whitespace-nowrap">
									{profession.name}
								</span>
							</section>
						))}
					</>
				)}
			</section>
		</div>
	);
};

export default HomepageFilter;
