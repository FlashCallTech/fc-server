import React from 'react';

interface ImageModalProps {
    imageUrl: string;
    onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
    const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
        // Close the modal if clicked outside the image
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-75 z-50" onClick={handleClickOutside}>
            <div className="relative max-h-full max-w-full overflow-auto">
                <button onClick={onClose} className="absolute top-0 right-0 m-4 text-white text-2xl">&times;</button>
                <img src={imageUrl} alt="Full Resolution" className="max-h-screen max-w-screen object-contain" />
            </div>
        </div>
    );
};

export default ImageModal;
