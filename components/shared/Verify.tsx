import Image from "next/image";

const Verify = () => {
	return (
		<div className="absolute top-0 left-0 flex flex-col gap-2 justify-center items-center h-screen w-full z-40">
      <div className="text-black font-bold">
        Verifying...
      </div>
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

export default Verify;
