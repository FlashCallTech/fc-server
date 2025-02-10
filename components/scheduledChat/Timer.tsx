import React, { useEffect, useState } from "react";

interface CountdownProps {
    timerDetails: {
        startTime: {
            seconds: number;
            nanoseconds: number;
        };
        maxDuration: number; // Time in seconds
    };
    setChatEnded: any;
}

const Countdown: React.FC<CountdownProps> = ({ timerDetails, setChatEnded }) => {
    const [timeLeft, setTimeLeft] = useState<string>("00:00");
    const [isTimeRunningOut, setIsTimeRunningOut] = useState<boolean>(false);

    useEffect(() => {
        if (timerDetails) {
            const { startTime, maxDuration } = timerDetails;
            const startTimeInSeconds = startTime.seconds; // Use the seconds part of Timestamp
            const endTime = startTimeInSeconds + maxDuration * 60;
            const tenPercentTime = maxDuration * 0.1;

            const calculateTimeLeft = () => {
                const now = Math.floor(Date.now() / 1000); // Current time in seconds
                const remainingTime = endTime - now;

                if (remainingTime <= 0) {
                    clearInterval(interval);
                    setChatEnded(true);
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
                            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
                    );
                } else {
                    setTimeLeft(
                        `${minutes.toString().padStart(2, "0")}:${seconds
                            .toString()
                            .padStart(2, "0")}`
                    );
                }
            };

            const interval = setInterval(calculateTimeLeft, 1000);
            calculateTimeLeft(); // Initial call to set timeLeft correctly at start

            return () => clearInterval(interval); // Cleanup interval on unmount
        }
    }, [timerDetails]);

    if (!timerDetails) {
        return <div className="text-[10px] text-white font-medium">Loading...</div>;
    }

    return (
        <div
            className={`text-[10px] font-medium ${isTimeRunningOut ? "text-red-500" : "text-white"}`}
        >
            {timeLeft}
        </div>
    );
};

export default Countdown;
