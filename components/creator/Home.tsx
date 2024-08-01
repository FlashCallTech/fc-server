'use client'
import React, { useState } from 'react'
import { Button } from '../ui/button'
import Image from 'next/image'
import Link from 'next/link'
import EditProfile from './Price'
import PriceEditModal from './Price'
import Withdraw from './Withdraw'
import Profile from './Profile'

const Home = () => {
  // State for toggle switches
  const [services, setServices] = useState({
    myServices: true,
    videoCall: true,
    audioCall: true,
    chat: true,
  });

  const [activeButton, setActiveButton] = useState('Home');

  const [screen, setScreen] = useState('Home');

  const handleButtonClick = (button: string) => {
    setActiveButton(button);
    setScreen(button)
  };

  const [isPriceEditOpen, setIsPriceEditOpen] = useState(false);
  const [prices, setPrices] = useState({
    videoCall: 25,
    audioCall: 15,
    chat: 5,
  });

  const handleSavePrices = (newPrices: { videoCall: number, audioCall: number, chat: number }) => {
    setPrices(newPrices);
  };

  const handleToggle = (service: 'myServices' | 'videoCall' | 'audioCall' | 'chat') => {
    setServices(prevStates => {
      if (service === 'myServices') {
        // Toggle myServices state
        const newMyServicesState = !prevStates.myServices;
        return {
          myServices: newMyServicesState,
          videoCall: newMyServicesState,
          audioCall: newMyServicesState,
          chat: newMyServicesState,
        };
      } else {
        // Toggle individual service
        return {
          ...prevStates,
          [service]: !prevStates[service],
        };
      }
    });
  };

  return (
    <>
      {
        screen === 'Home' ? (<div className='min-h-screen flex flex-col bg-black'>
          <div className='flex justify-end p-2'>
            <Button
              className="text-black text-[10px] h-auto w-auto bg-white rounded-full hover:bg-gray-100"
            >
              Edit Profile
            </Button >
          </div >
          <div className='flex flex-col items-center justify-center p-2'>
            <Image src='/avatar.svg' width={0} height={0} alt='avatar' className='w-20 h-20 bg-white rounded-full p-2' />
            <section className='flex flex-col items-center p-2'>
              <p className='text-white text-sm'>Nitra Sehgal</p>
              <p className='text-white text-sm'>sehgal666@gmail.com</p>
            </section>
          </div>
          <div className='flex-grow flex flex-col gap-4 bg-gray-50 rounded-t-3xl p-4'>
            <div className='flex flex-row items-center gap-2 p-1'>
              <div className="flex flex-row border w-full rounded-full p-2 bg-white justify-between items-center shadow-sm">
                <div className="flex flex-row items-center">
                  <Image src={'/link.svg'} width={0} height={0} alt='link' className='w-auto h-auto' />
                  <p className='pl-2'>Creator Link</p>
                </div>
                <Image src={'/copy.svg'} width={0} height={0} alt='copy' className='w-auto h-auto p-2 rounded-full hover:bg-gray-100 cursor-pointer' />
              </div>
              <Image src='/share.svg' width={0} height={0} alt='share' className='w-10 h-10 p-2 bg-gray-800 rounded-full hover:bg-black cursor-pointer' />
            </div>
            <section className='flex flex-row justify-between border rounded-lg bg-white p-2 shadow-sm'>
              <div className='flex flex-row pl-2 gap-3'>
                <Image src={'/wallet-creator.svg'} width={0} height={0} alt='wallet' className='w-auto h-auto p-2 bg-green-200 rounded-md ' />
                <div className='flex flex-col'>
                  <p className='text-gray-400 text-[10px]'>Todays Earning</p>
                  <p className='text-[15px] font-bold'>Rs. 25,000.0</p>
                </div>
              </div>
              <Link href={'/payment'}>
                <Button className='bg-green-600 w-auto h-auto text-white rounded-lg hover:bg-green-700'>
                  View Wallet
                </Button>
              </Link>
            </section>
            <section className='flex flex-col justify-between border rounded-lg bg-white p-2 shadow-sm'>
              <div className='flex flex-row justify-between items-center p-2 border-b'>
                <span>My Services</span>
                <label className='relative inline-block w-14 h-6'>
                  <input
                    type='checkbox'
                    className='toggle-checkbox absolute w-0 h-0 opacity-0'
                    checked={services.myServices}
                    onChange={() => handleToggle('myServices')}
                  />
                  <span
                    className={`toggle-label block overflow-hidden h-6 rounded-full ${services.myServices ? 'bg-green-600' : 'bg-gray-500'}  cursor-pointer`}
                    style={{
                      position: 'relative',
                      transition: 'background-color 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: services.myServices ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        content: '""',
                        position: 'absolute',
                        top: '0.15rem',
                        left: '0.1rem',
                        width: '1.2rem',
                        height: '1.2rem',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'transform 0.3s',
                        transform: services.myServices ? 'translateX(2.1rem)' : 'translateX(0)',
                      }}
                    />
                  </span>
                </label>
              </div>

              <div className='flex flex-row justify-between items-center p-2 font-bold'>
                <div className='flex flex-col gap-1'>
                  <span>
                    Video Call
                  </span>
                  <div className='flex flex-row gap-2'>
                    <p className='font-normal text-xs text-gray-400'>{`Rs ${prices.videoCall}/min`}</p>
                    <button onClick={() => setIsPriceEditOpen(true)}>
                      <Image src={'/edit.svg'} width={0} height={0} alt='edit' className='w-auto h-auto p-0' />
                    </button>
                  </div>
                </div>
                <label className='relative inline-block w-14 h-6'>
                  <input
                    type='checkbox'
                    className='toggle-checkbox absolute w-0 h-0 opacity-0'
                    checked={services.videoCall}
                    onChange={() => handleToggle('videoCall')}
                  />
                  <span
                    className={`toggle-label block overflow-hidden h-6 rounded-full ${services.videoCall ? 'bg-green-600' : 'bg-gray-500'}  cursor-pointer`}
                    style={{
                      position: 'relative',
                      transition: 'background-color 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: services.videoCall ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        content: '""',
                        position: 'absolute',
                        top: '0.15rem',
                        left: '0.1rem',
                        width: '1.2rem',
                        height: '1.2rem',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'transform 0.3s',
                        transform: services.videoCall ? 'translateX(2.1rem)' : 'translateX(0)',
                      }}
                    />
                  </span>
                </label>
              </div>

              <div className='flex flex-row justify-between items-center p-2 font-bold'>
                <div className='flex flex-col gap-1'>
                  <span>
                    Audio Call
                  </span>
                  <div className='flex flex-row gap-2'>
                    <p className='font-normal text-xs text-gray-400'>{`Rs ${prices.audioCall}/min`}</p>
                    <button onClick={() => setIsPriceEditOpen(true)}>
                      <Image src={'/edit.svg'} width={0} height={0} alt='edit' className='w-auto h-auto p-0' />
                    </button>
                  </div>
                </div>
                <label className='relative inline-block w-14 h-6'>
                  <input
                    type='checkbox'
                    className='toggle-checkbox absolute w-0 h-0 opacity-0'
                    checked={services.audioCall}
                    onChange={() => handleToggle('audioCall')}
                  />
                  <span
                    className={`toggle-label block overflow-hidden h-6 rounded-full ${services.audioCall ? 'bg-green-600' : 'bg-gray-500'}  cursor-pointer`}
                    style={{
                      position: 'relative',
                      transition: 'background-color 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: services.audioCall ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        content: '""',
                        position: 'absolute',
                        top: '0.15rem',
                        left: '0.1rem',
                        width: '1.2rem',
                        height: '1.2rem',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'transform 0.3s',
                        transform: services.audioCall ? 'translateX(2.1rem)' : 'translateX(0)',
                      }}
                    />
                  </span>
                </label>
              </div>

              <div className='flex flex-row justify-between items-center p-2 font-bold'>
                <div className='flex flex-col gap-1'>
                  <span>
                    Chat
                  </span>
                  <div className='flex flex--row gap-2'>
                    <p className='font-normal text-xs text-gray-400'>{`Rs ${prices.chat}/min`}</p>
                    <button onClick={() => setIsPriceEditOpen(true)}>
                      <Image src={'/edit.svg'} width={0} height={0} alt='edit' className='w-auto h-auto p-0' />
                    </button>
                  </div>
                </div>
                <label className='relative inline-block w-14 h-6'>
                  <input
                    type='checkbox'
                    className='toggle-checkbox absolute w-0 h-0 opacity-0'
                    checked={services.chat}
                    onChange={() => handleToggle('chat')}
                  />
                  <span
                    className={`toggle-label block overflow-hidden h-6 rounded-full ${services.chat ? 'bg-green-600' : 'bg-gray-500'}  cursor-pointer`}
                    style={{
                      position: 'relative',
                      transition: 'background-color 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: services.chat ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        content: '""',
                        position: 'absolute',
                        top: '0.15rem',
                        left: '0.1rem',
                        width: '1.2rem',
                        height: '1.2rem',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'transform 0.3s',
                        transform: services.chat ? 'translateX(2.1rem)' : 'translateX(0)',
                      }}
                    />
                  </span>
                </label>
              </div>
            </section>
            <section className='flex flex-col gap-8 mt-auto'>
              <section className='flex items-center justify-center pt-4'>
                <div className='text-center text-[13px] text-gray-400'>
                  If you are interested in learning how to create an account on <b>Flashcall</b> and how it works. <br /> <Link href={'/'} className='text-green-1'> <b> please click here. </b>  </Link>
                </div>
              </section>
              <section className='flex flex-row bg-black items-center justify-between text-white rounded-full p-2 mt-auto'>
                {activeButton === 'Home' ? (
                  <div className='flex flex-row gap-2 bg-green-600 rounded-full px-5 py-2'>
                    <Image src={'/home-selected.svg'} width={0} height={0} alt='' className='w-auto h-auto' />
                    <div className='text-sm font-medium'>Home</div>
                  </div>
                ) : (
                  <Button onClick={() => handleButtonClick('Home')}>
                    <Image src='/home.svg' width={0} height={0} alt='Home' className='w-auto h-auto' />
                  </Button>
                )}
                {activeButton === 'Wallet' ? (
                  <div className='flex flex-row gap-2 bg-green-600 rounded-full px-5 py-2'>
                    <Image src={'/collection-selected.svg'} width={0} height={0} alt='' className='w-auto h-auto' />
                    <div className='text-sm font-medium'>Wallet</div>
                  </div>
                ) : (
                  // <Link href={'/payment'}>
                    <Button onClick={() => handleButtonClick('Wallet')}>
                      <Image src='/collection.svg' width={0} height={0} alt='Wallet' className='w-auto h-auto' />
                    </Button>
                  // </Link>
                )}
                {activeButton === 'Profile' ? (
                  <div className='flex flex-row gap-2 bg-green-600 rounded-full px-5 py-2'>
                    <Image src={'/profile-selected.svg'} width={0} height={0} alt='' className='w-auto h-auto' />
                    <div className='text-sm font-medium'>Profile</div>
                  </div>
                ) : (
                  // <Link href={'/creator-profile'}>
                    <Button onClick={() => handleButtonClick('Profile')}>
                      <Image src='/profile.svg' width={0} height={0} alt='Profile' className='w-auto h-auto' />
                    </Button>
                  // </Link>
                )}
              </section>
            </section>
          </div>
          {isPriceEditOpen && (
            <PriceEditModal
              onClose={() => setIsPriceEditOpen(false)}
              onSave={handleSavePrices}
              currentPrices={prices}
            />
          )}
        </div>
        ) : (
           screen === 'Wallet' ? (<Withdraw />) : (<Profile />))
    }
    </>
  )
}

export default Home;
