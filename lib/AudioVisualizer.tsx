import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    audioContext: AudioContext;  // Pass AudioContext as a prop
    audioStream: MediaStream;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioContext, audioStream }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Float32Array | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(audioStream);

        analyser.fftSize = 2048;
        const bufferLength = analyser.fftSize;
        const dataArray = new Float32Array(bufferLength);

        source.connect(analyser);

        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        const canvas = canvasRef.current;
        const canvasCtx = canvas?.getContext('2d');

        const draw = () => {
            if (!canvas || !canvasCtx || !analyserRef.current || !dataArrayRef.current) return;

            animationFrameRef.current = requestAnimationFrame(draw);

            analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);

            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            canvasCtx.fillStyle = 'rgb(200, 200, 200)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

            canvasCtx.beginPath();

            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArrayRef.current[i] * 200.0;
                const y = canvas.height / 2 + v;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameRef.current!);
            // Don't close the audioContext here to prevent it from being closed multiple times
        };
    }, [audioContext, audioStream]);

    return <canvas ref={canvasRef} width="300" height="50" className='rounded-full w-full h-8'/>;
};

export default AudioVisualizer;
