import React, { useEffect, useRef, useState } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa'; // Using FontAwesome icons for play/pause

interface CustomAudioPlayer {
  audioSrc: string;
}

const CustomAudioPlayer: React.FC<CustomAudioPlayer> = ({ audioSrc }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('00:00');
  const [duration, setDuration] = useState<string>('00:00');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    console.log(audio?.duration);


    const formatTime = (time: number): string => {
      const minutes = Math.floor(time / 60)
        .toString()
        .padStart(2, '0');
      const seconds = Math.floor(time % 60)
        .toString()
        .padStart(2, '0');
      return `${minutes}:${seconds}`;
    };

    const updateProgress = () => {
      if (audio) {
        const currentTime = audio.currentTime;
        const duration = audio.duration || 0;
        setProgress((currentTime / duration) * 100);
        setCurrentTime(formatTime(currentTime));
        setDuration(formatTime(duration));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime('00:00');
    };

    if (audio) {
      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('ended', handleEnded);
    }

    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('ended', handleEnded);
      }
    };
  }, [isPlaying]);

  const togglePlayPause = async() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex items-center space-x-4 p-3 bg-green-600 rounded-lg">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="w-10 h-10 flex justify-center items-center bg-white text-green-600 rounded-full focus:outline-none"
      >
        {isPlaying ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4" />}
      </button>

      {/* Progress Bar */}
      <div className="w-full">
        <input
          type="range"
          value={progress}
          onChange={(e) => {
            const newProgress = Number(e.target.value);
            if (audioRef.current) {
              setProgress(newProgress);
              audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
            }
          }}
          className="w-full h-1 rounded-lg appearance-none bg-gray-300"
        />
        <div className="flex justify-between text-xs text-white mt-1">
          <span>{currentTime}</span>
          <span>{duration}</span>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={audioSrc} preload="none"></audio>
    </div>
  );
};

export default CustomAudioPlayer;
