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
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [callMediaType, setCallMediaType] = useState("AUDIO");
  // AUDIO | VIDEO

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

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

  // ================= RE-ATTACH MEDIA AFTER MODAL RENDER =================
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }

    if (remoteAudioRef.current && remoteStreamRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamRef.current;

      remoteAudioRef.current
        .play()
        .catch((error) => console.log("Auto play audio lỗi:", error));
    }
  }, [callStatus, callMediaType]);

  const sendCallMessage = useCallback(
    (status, durationSeconds = 0, mediaType = callMediaType) => {
      if (!onCallMessage) return;

      onCallMessage({
        status,
        mediaType,
        durationSeconds,
        durationText: formatDuration(durationSeconds),
      });
    },
    [onCallMessage, callMediaType]
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

  // ================= LOCAL MEDIA =================
  const getLocalMediaStream = async (mediaType = "AUDIO") => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const needVideo = mediaType === "VIDEO";

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: needVideo,
    });

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    setIsCameraOn(needVideo);

    return stream;
  };

  // ================= ICE =================
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

  // ================= CLEANUP =================
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

    remoteStreamRef.current = null;

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    pendingCandidatesRef.current = [];
    callStartedAtRef.current = null;

    setIncomingCall(null);
    setActiveCall(null);
    setCallStatus("IDLE");
    setIsMicMuted(false);
    setIsCameraOn(false);
    setCallSeconds(0);
    setCallMediaType("AUDIO");
  }, [clearMissedCallTimeout]);

  // ================= PEER CONNECTION =================
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

        if (!remoteStream) return;

        remoteStreamRef.current = remoteStream;

        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;

          remoteAudioRef.current
            .play()
            .catch((error) => console.log("Auto play audio lỗi:", error));
        }

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
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

  // ================= START AUDIO CALL =================
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
      setCallMediaType("AUDIO");

      const peer = createPeerConnection(selectedUser.id);
      if (!peer) return;

      const localStream = await getLocalMediaStream("AUDIO");

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
          payload: {
            mediaType: "AUDIO",
          },
        });

        sendCallMessage("MISSED", 0, "AUDIO");
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

  // ================= START VIDEO CALL =================
  const startVideoCall = useCallback(async () => {
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
      setCallMediaType("VIDEO");

      const peer = createPeerConnection(selectedUser.id);
      if (!peer) return;

      const localStream = await getLocalMediaStream("VIDEO");

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
          mediaType: "VIDEO",
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
          payload: {
            mediaType: "VIDEO",
          },
        });

        sendCallMessage("MISSED", 0, "VIDEO");
        toast.info("Cuộc gọi không được trả lời");
        cleanupCall();
      }, MISSED_CALL_TIMEOUT);
    } catch (error) {
      console.error("Start video call lỗi:", error);
      toast.error(
        "Không thể bắt đầu video call. Hãy kiểm tra quyền camera/micro."
      );
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

  // ================= ACCEPT CALL =================
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !roomId || !currentUserId) return;

    try {
      const offer = incomingCall.payload?.sdp;
      const mediaType = incomingCall.payload?.mediaType || "AUDIO";

      if (!offer) {
        toast.error("Cuộc gọi không hợp lệ");
        cleanupCall();
        return;
      }

      setCallMediaType(mediaType);

      const peer = createPeerConnection(incomingCall.callerId);
      if (!peer) return;

      const localStream = await getLocalMediaStream(mediaType);

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
          mediaType,
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
      toast.error("Không thể nghe máy. Hãy kiểm tra quyền camera/micro.");
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

  // ================= REJECT CALL =================
  const rejectCall = useCallback(() => {
    if (!incomingCall || !currentUserId) return;

    const mediaType = incomingCall.payload?.mediaType || "AUDIO";

    sendCallSignalSocket({
      type: "CALL_REJECT",
      roomId: incomingCall.roomId,
      callerId: Number(currentUserId),
      receiverId: Number(incomingCall.callerId),
      payload: {
        mediaType,
      },
    });

    sendCallMessage("REJECTED", 0, mediaType);
    cleanupCall();
  }, [incomingCall, currentUserId, sendCallMessage, cleanupCall]);

  // ================= END CALL =================
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

    const mediaType =
      activeCall?.payload?.mediaType || callMediaType || "AUDIO";

    sendCallSignalSocket({
      type: "CALL_END",
      roomId,
      callerId: Number(currentUserId),
      receiverId: targetId ? Number(targetId) : null,
      payload: {
        mediaType,
      },
    });

    const durationSeconds =
      callStatus === "IN_CALL" ? getCurrentCallDuration() : 0;

    sendCallMessage("ENDED", durationSeconds, mediaType);
    cleanupCall();
  }, [
    roomId,
    currentUserId,
    activeCall,
    selectedUser,
    callStatus,
    callMediaType,
    getCurrentCallDuration,
    sendCallMessage,
    cleanupCall,
  ]);

  // ================= UPGRADE AUDIO CALL TO VIDEO =================
  const upgradeAudioCallToVideo = useCallback(async () => {
    const peer = peerRef.current;

    if (callStatus !== "IN_CALL") {
      toast.info("Chỉ mở camera sau khi người kia nghe máy");
      return;
    }

    if (!peer || !localStreamRef.current) {
      toast.error("Chưa có kết nối cuộc gọi");
      return;
    }

    if (peer.signalingState !== "stable") {
      toast.info("Cuộc gọi đang kết nối, thử lại sau vài giây");
      return;
    }

    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      const videoTrack = cameraStream.getVideoTracks()[0];

      if (!videoTrack) {
        toast.error("Không tìm thấy camera");
        return;
      }

      localStreamRef.current.addTrack(videoTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      peer.addTrack(videoTrack, localStreamRef.current);

      setIsCameraOn(true);
      setCallMediaType("VIDEO");

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      const targetId =
        activeCall?.callerId &&
        Number(activeCall.callerId) !== Number(currentUserId)
          ? activeCall.callerId
          : selectedUser?.id || activeCall?.receiverId;

      sendCallSignalSocket({
        type: "CALL_UPGRADE_VIDEO_OFFER",
        roomId,
        callerId: Number(currentUserId),
        receiverId: targetId ? Number(targetId) : null,
        payload: {
          mediaType: "VIDEO",
          sdp: offer,
        },
      });
    } catch (error) {
      console.error("Upgrade video lỗi:", error);
      toast.error("Không thể mở camera. Hãy kiểm tra quyền camera.");
    }
  }, [roomId, currentUserId, selectedUser, activeCall, callStatus]);

  // ================= MIC ON/OFF =================
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

  // ================= CAMERA ON/OFF =================
  const toggleCamera = useCallback(async () => {
    const stream = localStreamRef.current;

    if (!stream) return;

    const videoTracks = stream.getVideoTracks();

    // Đang gọi thoại, chưa có video track
    // Chỉ cho bật camera khi đã vào cuộc gọi
    if (videoTracks.length === 0) {
      await upgradeAudioCallToVideo();
      return;
    }

    const nextCameraOn = !isCameraOn;

    videoTracks.forEach((track) => {
      track.enabled = nextCameraOn;
    });

    setIsCameraOn(nextCameraOn);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, [isCameraOn, upgradeAudioCallToVideo]);

  // ================= SIGNAL HANDLER =================
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
            payload: {
              mediaType: signal.payload?.mediaType || "AUDIO",
            },
          });
          return;
        }

        setIncomingCall(signal);
        setCallMediaType(signal.payload?.mediaType || "AUDIO");
        setCallStatus("RINGING");
        return;
      }

      if (signal.type === "CALL_ACCEPT") {
        try {
          const answer = signal.payload?.sdp;
          const mediaType = signal.payload?.mediaType || "AUDIO";

          if (!answer || !peerRef.current) return;

          setCallMediaType(mediaType);

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

      if (signal.type === "CALL_UPGRADE_VIDEO_OFFER") {
        try {
          const offer = signal.payload?.sdp;

          if (!offer || !peerRef.current) return;

          setCallMediaType("VIDEO");

          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(offer)
          );

          await flushPendingCandidates();

          const answer = await peerRef.current.createAnswer();
          await peerRef.current.setLocalDescription(answer);

          sendCallSignalSocket({
            type: "CALL_UPGRADE_VIDEO_ANSWER",
            roomId: signal.roomId,
            callerId: Number(currentUserId),
            receiverId: Number(signal.callerId),
            payload: {
              mediaType: "VIDEO",
              sdp: answer,
            },
          });
        } catch (error) {
          console.error("Handle CALL_UPGRADE_VIDEO_OFFER lỗi:", error);
          toast.error("Không thể chuyển sang video call");
        }

        return;
      }

      if (signal.type === "CALL_UPGRADE_VIDEO_ANSWER") {
        try {
          const answer = signal.payload?.sdp;

          if (!answer || !peerRef.current) return;

          setCallMediaType("VIDEO");

          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );

          await flushPendingCandidates();
        } catch (error) {
          console.error("Handle CALL_UPGRADE_VIDEO_ANSWER lỗi:", error);
          toast.error("Không thể hoàn tất chuyển sang video call");
        }

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
    localVideoRef,
    remoteVideoRef,

    isMicMuted,
    isCameraOn,
    callSeconds,
    callTimeText,
    callMediaType,

    startAudioCall,
    startVideoCall,
    acceptCall,
    rejectCall,
    endCall,

    toggleMic,
    toggleCamera,

    handleCallSignal,
  };
}

export default useAudioCall;
