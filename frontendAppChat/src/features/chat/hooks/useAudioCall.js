import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { sendCallSignalSocket } from "../socket/socket";

const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const MISSED_CALL_TIMEOUT = 30000;

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "0 phút 0 giây";

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;

  if (minutes <= 0) {
    return `${remainSeconds} giây`;
  }

  return `${minutes} phút ${remainSeconds} giây`;
};

function useAudioCall({
  roomId,
  currentUserId,
  user,
  selectedUser,
  selectedGroup,
  onCallMessage,
}) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState("IDLE");
  // IDLE, CALLING, RINGING, IN_CALL

  const [activeCall, setActiveCall] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const callTimeoutRef = useRef(null);
  const callStartedAtRef = useRef(null);

  // ================= CALL TIMER =================
  useEffect(() => {
    if (callStatus !== "IN_CALL") {
      return;
    }

    const timer = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callStatus]);

  const callTimeText = (() => {
    const minutes = Math.floor(callSeconds / 60);
    const seconds = callSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  })();

  const sendCallMessage = useCallback(
    (status, durationSeconds = 0) => {
      if (!onCallMessage) return;

      onCallMessage({
        status,
        durationSeconds,
        durationText: formatDuration(durationSeconds),
      });
    },
    [onCallMessage]
  );

  const clearMissedCallTimeout = useCallback(() => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  }, []);

  const getCurrentCallDuration = useCallback(() => {
    if (!callStartedAtRef.current) return 0;

    return Math.max(
      0,
      Math.floor((Date.now() - callStartedAtRef.current) / 1000)
    );
  }, []);

  const getLocalAudioStream = async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    localStreamRef.current = stream;
    return stream;
  };

  const addIceCandidateSafely = async (candidate) => {
    if (!candidate) return;

    const peer = peerRef.current;

    if (!peer || !peer.remoteDescription) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Add ICE candidate lỗi:", error);
    }
  };

  const flushPendingCandidates = async () => {
    const candidates = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];

    for (const candidate of candidates) {
      await addIceCandidateSafely(candidate);
    }
  };

  const cleanupCall = useCallback(() => {
    clearMissedCallTimeout();

    try {
      peerRef.current?.close();
    } catch {
      // ignore
    }

    peerRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    pendingCandidatesRef.current = [];
    callStartedAtRef.current = null;

    setIncomingCall(null);
    setActiveCall(null);
    setCallStatus("IDLE");
    setIsMicMuted(false);
    setCallSeconds(0);
  }, [clearMissedCallTimeout]);

  const createPeerConnection = useCallback(
    (targetUserId) => {
      if (!roomId || !currentUserId) return null;

      const peer = new RTCPeerConnection(ICE_SERVERS);

      peer.onicecandidate = (event) => {
        if (!event.candidate) return;

        sendCallSignalSocket({
          type: "ICE_CANDIDATE",
          roomId,
          callerId: Number(currentUserId),
          receiverId: Number(targetUserId),
          payload: {
            candidate: event.candidate,
          },
        });
      };

      peer.ontrack = (event) => {
        const [remoteStream] = event.streams;

        if (remoteAudioRef.current && remoteStream) {
          remoteAudioRef.current.srcObject = remoteStream;

          remoteAudioRef.current
            .play()
            .catch((error) => console.log("Auto play audio lỗi:", error));
        }
      };

      peer.onconnectionstatechange = () => {
        console.log("WEBRTC STATE:", peer.connectionState);

        if (
          peer.connectionState === "disconnected" ||
          peer.connectionState === "failed"
        ) {
          cleanupCall();
        }
      };

      peerRef.current = peer;
      return peer;
    },
    [roomId, currentUserId, cleanupCall]
  );

  const startAudioCall = useCallback(async () => {
    if (!roomId || !currentUserId) return;

    if (selectedGroup) {
      toast.info("Tạm thời chỉ hỗ trợ gọi cá nhân trước");
      return;
    }

    if (!selectedUser?.id) {
      toast.error("Chưa chọn người để gọi");
      return;
    }

    if (callStatus !== "IDLE") {
      toast.info("Bạn đang có cuộc gọi khác");
      return;
    }

    try {
      const peer = createPeerConnection(selectedUser.id);
      if (!peer) return;

      const localStream = await getLocalAudioStream();

      localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream);
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      const signal = {
        type: "CALL_OFFER",
        roomId,
        callerId: Number(currentUserId),
        receiverId: Number(selectedUser.id),
        callerName: user?.username || "Người dùng",
        callerAvatar: user?.avatar || null,
        payload: {
          mediaType: "AUDIO",
          sdp: offer,
        },
      };

      sendCallSignalSocket(signal);

      setActiveCall(signal);
      setCallSeconds(0);
      setCallStatus("CALLING");

      clearMissedCallTimeout();

      callTimeoutRef.current = setTimeout(() => {
        sendCallSignalSocket({
          type: "CALL_MISSED",
          roomId,
          callerId: Number(currentUserId),
          receiverId: Number(selectedUser.id),
          callerName: user?.username || "Người dùng",
          callerAvatar: user?.avatar || null,
        });

        sendCallMessage("MISSED", 0);
        toast.info("Cuộc gọi không được trả lời");
        cleanupCall();
      }, MISSED_CALL_TIMEOUT);
    } catch (error) {
      console.error("Start audio call lỗi:", error);
      toast.error("Không thể bắt đầu cuộc gọi. Hãy kiểm tra quyền micro.");
      cleanupCall();
    }
  }, [
    roomId,
    currentUserId,
    selectedGroup,
    selectedUser,
    user,
    callStatus,
    createPeerConnection,
    clearMissedCallTimeout,
    sendCallMessage,
    cleanupCall,
  ]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !roomId || !currentUserId) return;

    try {
      const offer = incomingCall.payload?.sdp;

      if (!offer) {
        toast.error("Cuộc gọi không hợp lệ");
        cleanupCall();
        return;
      }

      const peer = createPeerConnection(incomingCall.callerId);
      if (!peer) return;

      const localStream = await getLocalAudioStream();

      localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream);
      });

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingCandidates();

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      sendCallSignalSocket({
        type: "CALL_ACCEPT",
        roomId: incomingCall.roomId,
        callerId: Number(currentUserId),
        receiverId: Number(incomingCall.callerId),
        callerName: user?.username || "Người dùng",
        callerAvatar: user?.avatar || null,
        payload: {
          mediaType: "AUDIO",
          sdp: answer,
        },
      });

      clearMissedCallTimeout();
      callStartedAtRef.current = Date.now();

      setActiveCall(incomingCall);
      setIncomingCall(null);
      setCallSeconds(0);
      setCallStatus("IN_CALL");
    } catch (error) {
      console.error("Accept call lỗi:", error);
      toast.error("Không thể nghe máy. Hãy kiểm tra quyền micro.");
      cleanupCall();
    }
  }, [
    incomingCall,
    roomId,
    currentUserId,
    user,
    createPeerConnection,
    clearMissedCallTimeout,
    cleanupCall,
  ]);

  const rejectCall = useCallback(() => {
    if (!incomingCall || !currentUserId) return;

    sendCallSignalSocket({
      type: "CALL_REJECT",
      roomId: incomingCall.roomId,
      callerId: Number(currentUserId),
      receiverId: Number(incomingCall.callerId),
    });

    sendCallMessage("REJECTED", 0);
    cleanupCall();
  }, [incomingCall, currentUserId, sendCallMessage, cleanupCall]);

  const endCall = useCallback(() => {
    if (!roomId || !currentUserId) {
      cleanupCall();
      return;
    }

    const targetId =
      activeCall?.callerId &&
      Number(activeCall.callerId) !== Number(currentUserId)
        ? activeCall.callerId
        : selectedUser?.id || activeCall?.receiverId;

    sendCallSignalSocket({
      type: "CALL_END",
      roomId,
      callerId: Number(currentUserId),
      receiverId: targetId ? Number(targetId) : null,
    });

    const durationSeconds =
      callStatus === "IN_CALL" ? getCurrentCallDuration() : 0;

    sendCallMessage("ENDED", durationSeconds);
    cleanupCall();
  }, [
    roomId,
    currentUserId,
    activeCall,
    selectedUser,
    callStatus,
    getCurrentCallDuration,
    sendCallMessage,
    cleanupCall,
  ]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;

    if (!stream) return;

    const audioTracks = stream.getAudioTracks();

    if (audioTracks.length === 0) return;

    const nextMuted = !isMicMuted;

    audioTracks.forEach((track) => {
      track.enabled = !nextMuted;
    });

    setIsMicMuted(nextMuted);
  }, [isMicMuted]);

  const toggleCameraPlaceholder = useCallback(() => {
    toast.info("Chức năng mở camera sẽ làm ở bước video call");
  }, []);

  const handleCallSignal = useCallback(
    async (signal) => {
      if (!signal?.type) return;

      if (Number(signal.callerId) === Number(currentUserId)) {
        return;
      }

      if (signal.type === "CALL_OFFER") {
        if (callStatus !== "IDLE") {
          sendCallSignalSocket({
            type: "CALL_REJECT",
            roomId: signal.roomId,
            callerId: Number(currentUserId),
            receiverId: Number(signal.callerId),
          });
          return;
        }

        setIncomingCall(signal);
        setCallStatus("RINGING");
        return;
      }

      if (signal.type === "CALL_ACCEPT") {
        try {
          const answer = signal.payload?.sdp;

          if (!answer || !peerRef.current) return;

          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );

          await flushPendingCandidates();

          clearMissedCallTimeout();
          callStartedAtRef.current = Date.now();

          setActiveCall(signal);
          setCallSeconds(0);
          setCallStatus("IN_CALL");

          toast.success("Cuộc gọi đã được chấp nhận");
        } catch (error) {
          console.error("Handle CALL_ACCEPT lỗi:", error);
          toast.error("Không thể kết nối cuộc gọi");
          cleanupCall();
        }

        return;
      }

      if (signal.type === "ICE_CANDIDATE") {
        const candidate = signal.payload?.candidate;
        await addIceCandidateSafely(candidate);
        return;
      }

      if (signal.type === "CALL_MISSED") {
        toast.info("Bạn có một cuộc gọi nhỡ");
        cleanupCall();
        return;
      }

      if (signal.type === "CALL_REJECT") {
        toast.info("Cuộc gọi bị từ chối");
        cleanupCall();
        return;
      }

      if (signal.type === "CALL_END") {
        toast.info("Cuộc gọi đã kết thúc");
        cleanupCall();
      }
    },
    [currentUserId, callStatus, clearMissedCallTimeout, cleanupCall]
  );

  return {
    incomingCall,
    callStatus,
    activeCall,
    remoteAudioRef,

    isMicMuted,
    callSeconds,
    callTimeText,

    startAudioCall,
    acceptCall,
    rejectCall,
    endCall,

    toggleMic,
    toggleCameraPlaceholder,

    handleCallSignal,
  };
}

export default useAudioCall;
