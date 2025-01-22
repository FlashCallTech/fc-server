import React, { useEffect, useState } from "react";

interface CountdownProps {
    timeInSeconds: number | undefined; // Time in seconds
}

const Countdown: React.FC<CountdownProps> = ({ timeInSeconds }) => {
    const [timeLeft, setTimeLeft] = useState<string>("00:00");
    const [isTimeRunningOut, setIsTimeRunningOut] = useState<boolean>(false);

    useEffect(() => {
        if (timeInSeconds !== undefined) {
            let remainingTime = timeInSeconds;
            const tenPercentTime = timeInSeconds * 0.1;

            const calculateTimeLeft = () => {
                if (remainingTime <= 0) {
                    clearInterval(interval);
                    setTimeLeft("00:00");
                    return;
                }

                const hours = Math.floor(remainingTime / 3600);
                const minutes = Math.floor((remainingTime % 3600) / 60);
                const seconds = remainingTime % 60;

                setIsTimeRunningOut(remainingTime <= tenPercentTime);

                if (hours > 0) {
                    setTimeLeft(
                        `${hours.toString().padStart(2, "0")}:${minutes
                            .toString()
                            .padStart(2, "0")}:${seconds
                            .toString()
                            .padStart(2, "0")}`
                    );
                } else {
                    setTimeLeft(
                        `${minutes.toString().padStart(2, "0")}:${seconds
                            .toString()
                            .padStart(2, "0")}`
                    );
                }

                remainingTime -= 1;
            };

            const interval = setInterval(calculateTimeLeft, 1000);
            calculateTimeLeft(); // Initial call to set timeLeft correctly at start

            return () => clearInterval(interval); // Cleanup interval on unmount
        }
    }, [timeInSeconds]);

    if (timeInSeconds === undefined) {
        return <div className="text-[10px] text-white font-medium">Loading...</div>;
    }

    return (
        <div
            className={`text-[10px] font-medium ${isTimeRunningOut ? "text-red-500" : "text-white"}`}
        >
            {timeLeft} mins
        </div>
    );
};

export default Countdown;
