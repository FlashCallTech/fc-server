import React from "react";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  CallParticipantsList,
  CallingState,
  DeviceSettings,
  PaginatedGridLayout,
  SpeakerLayout,
  SpeakingWhileMutedNotification,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Users } from "lucide-react";
import EndCallButton from "../official/EndCallButton";
import CallTimer from "../official/CallTimer";
import { useToast } from "../ui/use-toast";
import { VideoToggleButton } from "../calls/VideoToggleButton";
import { AudioToggleButton } from "../calls/AudioToggleButton";
import SinglePostLoader from "../shared/SinglePostLoader";
import SwitchCameraType from "../calls/SwitchCameraType";
import AudioDeviceList from "../calls/AudioDeviceList";
import CustomParticipantViewUI from "../calls/CustomParticipantViewUI";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import { Cursor, Typewriter } from "react-simple-typewriter";

import { backendBaseUrl } from "@/lib/utils";
import useWarnOnUnload from "@/hooks/useWarnOnUnload";

type CallLayoutType = "grid" | "speaker-bottom";

const NoParticipantsView = () => (
  <section className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center whitespace-nowrap flex flex-col items-center justify-center">
    <div className="size-full flex items-center justify-center">
      <h1
        className="text-xl md:text-2xl font-semibold"
        style={{ color: "#ffffff" }}
      >
        <Typewriter
          words={[
            "It’s just you in the call for now",
            "Waiting for others.",
            "Hang tight",
          ]}
          loop={true}
          cursor
          cursorStyle="_"
          typeSpeed={50}
          deleteSpeed={50}
          delaySpeed={2000}
        />
        <Cursor cursorColor="#ffffff" />
      </h1>
    </div>
  </section>
);

// Custom hook to track screen size
const useScreenSize = () => {
  const [isMobile, setIsMobile] = useState(false);

  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

export const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor;
  if (/android/i.test(userAgent)) {
    return true; // Android device
  }
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return true; // iOS device
  }
  return false; // Not Android or iOS
};

const MeetingRoom = () => {
  const { useCallCallingState, useCallEndedAt, useParticipants } =
    useCallStateHooks();
  const { currentUser } = useCurrentUsersContext();

  const hasAlreadyJoined = useRef(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showAudioDeviceList, setShowAudioDeviceList] = useState(false);
  const call = useCall();
  const callEndedAt = useCallEndedAt();
  const callHasEnded = !!callEndedAt;
  const { toast } = useToast();
  const isVideoCall = useMemo(() => call?.type === "default", [call]);

  const callingState = useCallCallingState();
  const participants = useParticipants();
  const [layout, setLayout] = useState<CallLayoutType>("grid");
  const router = useRouter();
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hasVisited, setHasVisited] = useState(false);

  const countdownDuration = 60;

  const isMobile = useScreenSize();
  const mobileDevice = isMobileDevice();

  const handleCallRejected = async () => {
    await call?.endCall().catch((err) => console.warn(err));
  };

  const expert = call?.state?.members?.find(
    (member: any) => member.custom.type === "expert"
  );

  useWarnOnUnload("Are you sure you want to leave the meeting?", () => {
    let callData = {
      client_id: call?.state?.createdBy?.id || "unknown_client",
      influencer_id:
        expert?.user_id ||
        call?.state?.members?.[0]?.user_id ||
        "unknown_influencer",
      started_at: call?.state?.startedAt || new Date().toISOString(),
      ended_at: call?.state?.endedAt || new Date().toISOString(),
      meeting_id: call?.id || "unknown_meeting",
    };

    try {
      navigator.sendBeacon(
        `${backendBaseUrl}/official/call/end/${call?.id || "unknown_meeting"}`,
        JSON.stringify(callData)
      );
    } catch (error) {
      console.error("Error sending beacon:", error);
    }
  });

  useEffect(() => {
    if (isMobile) {
      setLayout("speaker-bottom");
    } else {
      setLayout("grid");
    }
  }, [isMobile]);

  useEffect(() => {
    const joinCall = async () => {
      if (
        !call ||
        !currentUser ||
        hasAlreadyJoined.current ||
        callingState === CallingState.JOINED ||
        callingState === CallingState.JOINING ||
        callHasEnded
      ) {
        return;
      }
      try {
        if (callingState === CallingState.IDLE) {
          await call?.join();
          hasAlreadyJoined.current = true;
        }
      } catch (error) {
        console.warn("Error Joining Call ", error);
      }
    };

    if (call) {
      joinCall();
    }
  }, [call, callingState, currentUser, callHasEnded]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    let countdownInterval: NodeJS.Timeout | null = null;

    if (!hasVisited) {
      setHasVisited(true);
      return;
    }

    if (participants.length < 2) {
      setShowCountdown(true);
      setCountdown(countdownDuration);

      if (isVideoCall) call?.camera?.disable();
      call?.microphone?.disable();

      countdownInterval = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown && prevCountdown > 1) {
            return prevCountdown - 1;
          } else {
            return null;
          }
        });
      }, 1000);

      timeoutId = setTimeout(async () => {
        await call?.endCall();
      }, countdownDuration * 1000);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      setShowCountdown(false);
      setCountdown(null);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [participants, call]);

  const toggleCamera = async () => {
    if (call && call.camera) {
      try {
        await call.camera.flip();
      } catch (error) {
        Sentry.captureException(error);
        console.error("Error toggling camera:", error);
      }
    }
  };

  const CallLayout = useMemo(() => {
    if (layout === "grid") {
      return isVideoCall ? (
        <PaginatedGridLayout />
      ) : (
        <PaginatedGridLayout excludeLocalParticipant={true} />
      );
    }

    return isVideoCall ? (
      <SpeakerLayout
        participantsBarPosition="bottom"
        ParticipantViewUIBar={<CustomParticipantViewUI />}
        ParticipantViewUISpotlight={<CustomParticipantViewUI />}
      />
    ) : (
      <SpeakerLayout
        participantsBarPosition="bottom"
        ParticipantViewUIBar={<CustomParticipantViewUI />}
        ParticipantViewUISpotlight={<CustomParticipantViewUI />}
        excludeLocalParticipant={true}
      />
    );
  }, [layout, isVideoCall]);

  const isMeetingOwner = currentUser?._id === call?.state?.createdBy?.id;

  if (callingState !== CallingState.JOINED) {
    return (
      <section className="w-full h-screen flex items-center justify-center ">
        <SinglePostLoader />
      </section>
    );
  }

  // Display countdown notification or modal to the user
  const CountdownDisplay = () => (
    <div className="absolute top-6 left-6 sm:top-4 sm:left-4 z-40 w-fit rounded-md px-4 py-2 h-10 bg-red-500 text-white flex items-center justify-center">
      <p>Connecting call in {countdown}s</p>
    </div>
  );

  return (
    <section className="relative w-full overflow-hidden pt-4 md:pt-0 text-white bg-dark-2 h-dvh">
      {showCountdown && countdown && <CountdownDisplay />}
      <div className="relative flex size-full items-center justify-center transition-all">
        <div
          className={`flex size-full max-w-[95%] 3xl:max-w-[1500px] items-center transition-all`}
        >
          {participants.length > 1 ? CallLayout : <NoParticipantsView />}
        </div>

        {showParticipants && (
          <div className="h-fit w-full fixed right-0 top-0 md:top-2 md:right-2 md:max-w-[400px] rounded-xl ml-2 p-4 z-40 bg-black transition-all">
            <CallParticipantsList onClose={() => setShowParticipants(false)} />
          </div>
        )}
      </div>

      {!callHasEnded && isMeetingOwner && !showCountdown && call && (
        <CallTimer
          handleCallRejected={handleCallRejected}
          callId={call.id}
          callDuration={call.state.custom.duration}
          participants={participants.length}
        />
      )}

      {/* Call Controls */}

      <section className="call-controls fixed bottom-0 flex w-full items-center justify-start transition-all">
        <div className="flex bg-[#19232d] overflow-x-scroll no-scrollbar w-full md:w-fit py-2 px-4 items-center mx-auto justify-center gap-4 rounded-t-lg md:rounded-b-none md:mb-2">
          {/* Audio Button */}
          {!showCountdown && (
            <SpeakingWhileMutedNotification>
              <AudioToggleButton />
            </SpeakingWhileMutedNotification>
          )}

          {/* Audio Device List */}
          {isMobile && mobileDevice && !showCountdown && (
            <AudioDeviceList
              micEnabled={call?.microphone?.enabled}
              showAudioDeviceList={showAudioDeviceList}
              setShowAudioDeviceList={setShowAudioDeviceList}
            />
          )}

          {/* Video Button */}
          {isVideoCall && !showCountdown && <VideoToggleButton />}

          {/* Switch Camera */}
          {isVideoCall && isMobile && mobileDevice && !showCountdown && (
            <SwitchCameraType
              toggleCamera={toggleCamera}
              cameraEnabled={call?.camera?.enabled}
            />
          )}

          {!showCountdown && (
            <Tooltip>
              <TooltipTrigger className="hidden md:block">
                <section onClick={() => setShowParticipants((prev) => !prev)}>
                  <section className="cursor-pointer rounded-full bg-[#ffffff14] p-3 hover:bg-[#4c535b] flex items-center">
                    <Users size={20} className="text-white" />
                  </section>
                </section>
              </TooltipTrigger>
              <TooltipContent className="mb-2 bg-gray-700  border-none">
                <p className="!text-white">Participants</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* End Call Button */}
          <Tooltip>
            <TooltipTrigger>
              <EndCallButton />
            </TooltipTrigger>
            <TooltipContent className="hidden md:block mb-2 bg-red-500  border-none">
              <p className="!text-white">End Call</p>
            </TooltipContent>
          </Tooltip>

          {isVideoCall && !showCountdown && (
            <div className="absolute bottom-3 right-4 z-20 w-fit hidden md:flex items-center gap-2">
              <DeviceSettings />
            </div>
          )}
        </div>
      </section>
    </section>
  );
};

export default MeetingRoom;
