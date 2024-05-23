import Image from "next/image";

const Loader = () => {
	return (
		<div className="flex-center h-full w-full">
			<Image
				src="/icons/loading-circle.svg"
				alt="Loading..."
				width={50}
				height={50}
				className="invert"
			/>
		</div>
	);
};

export default Loader;
