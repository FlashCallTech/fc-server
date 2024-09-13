import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const ChatInterface: React.FC = () => {
    return (
        <div className="relative flex flex-col  h-screen" style={{ backgroundBlendMode: "luminosity" }}>
            <div className="absolute inset-0 bg-[url('/back.png')] bg-cover bg-center filter brightness-[0.25] blur-sx z-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#232323] via-[#464646] to-[#383c39] opacity-90 z-0" />

            <div className="relative flex flex-col h-full z-10">
                <div className="flex justify-between items-center px-5 py-4 bg-[#2c2c2c]">
                    <div className="flex items-center gap-2">
                        <Image src="/avatar.svg" alt="profile" width={40} height={40} className="rounded-full" />
                        <div className='flex flex-col'>
                            <p className='text-sm leading-4' style={{ color: 'rgba(112, 112, 112, 1)' }}>On going chat with</p>
                            <div className="text-white font-bold leading-6 text-xl">Nitra Sahgal</div>
                        </div>
                    </div>
                    <button className="bg-[rgba(255,81,81,1)] text-white px-4 py-3 rounded-lg">End Chat</button>
                </div>

                <div className="leading-5 text-center text-white font-bold py-1 bg-[rgba(255,255,255,0.36)] mb-4">
                    Time Left : 01:25
                </div>
                <div className="w-1/4 mx-auto text-center bg-[rgba(255,255,255,0.24)] py-1 text-white text-xs leading-6 font-bold rounded-lg mt-2 mb-4">
                    07 Dec 2024
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="mb-4 text-left">
                        <div className="bg-[rgba(255,255,255,1)] p-3  rounded-lg rounded-tr-none max-w-[80%] ml-auto text-black font-normal leading-5 relative"
                        >
                            Hello, <br />
                            I am Naina Talwar.
                            <p className="text-xs text-gray-600 text-right mt-1">4:31 PM</p>
                            <div className='rotate-90 absolute right-[-4px] top-[-4px] w-0 h-0 rounded-full border-[8px] border-l-white border-r-0 border-solid border-transparent'></div>
                        </div>
                    </div>
                    <div className="mb-4 text-left">
                        <div
                            className="bg-[rgba(80,166,92,1)] p-3 rounded-lg rounded-tl-none max-w-[80%] text-white font-normal leading-5 relative"
                        >
                            Hello, <br />
                            My Name is Nitish Purohit.
                            <p className="text-xs text-white text-right mt-1">4:31 PM</p>
                            <div className='rotate-90 absolute left-[-4px] top-[-4px] w-0 h-0 rounded-full border-[8px] border-l-[rgba(80,166,92,1)] border-r-0 border-solid border-transparent'
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-[rgba(255,255,255,0.24)] mb-3">
                    <div className="leading-5 font-normal text-white">Recharge to continue this <br /> Audio call.</div>
                    <Link href="/">
                        <button className="bg-black font-bold leading-5 text-white py-2 px-3 rounded-lg">Recharge</button>
                    </Link>
                </div>

                <div className="flex items-center p-4 mb-4">
                    <div className="flex flex-1 flex-row px-3 py-2 bg-[rgba(255,255,255,0.12)] rounded-full text-white mr-2">
                        <input type="text" placeholder="Message" className="px-2 text-sm leading-5 font-normal flex-auto bg-transparent" />
                        <div className='flex flex-row gap-4 px-2 ml-auto'>
                            <Image src='/file.svg' width={15} height={15} alt='file' className='w-7 h-7' />
                            <Image src='/cam.svg' width={25} height={25} alt='cam' className='w-7 h-7' />
                        </div>
                    </div>
                    <button>
                        <Image src="/mic.svg" width={30} height={30} alt="Mic" className="w-10 h-10 bg-[rgba(80,166,92,1)] rounded-full px-1 py-1" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
