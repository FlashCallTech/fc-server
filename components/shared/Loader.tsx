import Image from "next/image";

const Loader = () => {
	return (
		<div className="absolute top-0 left-0 flex justify-center items-center h-screen w-full z-40">
			<Image
				src="/icons/loading-circle.svg"
				alt="Loading..."
				width={50}
				height={50}
				className="invert"
				priority
			/>
		</div>
	);
};

export default Loader;
