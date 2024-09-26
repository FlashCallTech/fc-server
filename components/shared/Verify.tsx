import Image from "next/image";
interface Props{
	message: string;
}

const Verify: React.FC<Props> = (props) => {
	const { message } = props; 

	return (
		<div className="absolute top-0 left-0 flex flex-col gap-2 justify-center items-center h-screen w-full z-40">
      <div className="text-black font-bold">
        {`${message}...`}
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
