// components/DraggableWindow.tsx
'use client';

import { creatorUser } from '@/types';
import Image from 'next/image';
import React from 'react';
import ReactDOM from 'react-dom';
import Draggable from 'react-draggable';

interface DraggableWindowProps {
  onClose: () => void;
  children: React.ReactNode;
  creator: creatorUser;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({ onClose, children, creator }) => {
  return ReactDOM.createPortal(
    <Draggable handle=".handle">
      <div className="fixed bottom-[51px] left-5 z-50 bg-white rounded-lg shadow-lg border w-[400px] h-[500px]">
        {/* Drag Handle */}
        <div className="handle cursor-move border p-2 rounded-t-lg flex justify-between items-center">
          <div className='flex items-center gap-2'>
          <Image
            src={`${creator.photo}`}
            width={36}
            height={36}
            alt='photo'
            className='size-9 object-cover rounded-full'
          />
          <span className="font-bold">{creator?.fullName}</span>
          </div>
          <button
            onClick={onClose}
            className="px-2 rounded-lg hoverScaleDownEffect border"
          >
            &times;
          </button>
        </div>
        {/* Content */}
        <div className="h-full">
          {children}
        </div>
      </div>
    </Draggable>,
    document.body
  );
};

export default DraggableWindow;
