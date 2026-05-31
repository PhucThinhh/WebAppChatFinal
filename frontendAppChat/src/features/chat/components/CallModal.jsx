import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { getImageUrl } from "../../../utils/imageUrl";
import { sendCallSignal, subscribeCallSignals } from "../socket/socket";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function CallModal({
  mode = "audio",
  title = "Cuộc gọi",
  avatar,
  currentUserId,
  targetUserId,
  targetName,
  targetAvatar,
  callerName,
  callerAvatar,
  incomingOffer = null,
  isIncoming = false,
  callId: providedCallId,
  roomId,
  onClose,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerRef = useRef(null);
  const startedRef = useRef(false);
  const endedRef = useRef(false);

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(mode === "video");
  const [error, setError] = useState("");
  const [status, setStatus] = useState(isIncoming ? "Cuộc gọi đến" : "Đang gọi...");
  const [accepted, setAccepted] = useState(!isIncoming);

  const callId = useMemo(
    () => providedCallId || `${Date.now()}-${currentUserId}-${targetUserId}`,
    [providedCallId, currentUserId, targetUserId]
  );

  const avatarSrc = getImageUrl(avatar || targetAvatar);
  const peerName = targetName || title;

  const sendSignal = (type, signal = null) => {
    if (!currentUserId || !targetUserId) return;

    sendCallSignal({
      type,
      callId,
      roomId,
      mode,
      fromUserId: Number(currentUserId),
      toUserId: Number(targetUserId),
      callerName: callerName || title,
      callerAvatar: callerAvatar || avatar,
      signal,
    });
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks()?.forEach((track) => track.stop());
    localStreamRef.current = null;

    peerRef.current?.close();
    peerRef.current = null;

    startedRef.current = false;
  };

  const closeCall = (notify = true, signalType = "end") => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (notify) sendSignal(signalType);
    cleanup();
    onClose?.();
  };

  const createPeer = () => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("candidate", event.candidate);
      }
    };

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      remoteStreamRef.current = stream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setStatus("Đang kết nối");
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") {
        setStatus("Đang trong cuộc gọi");
      }
      if (["failed", "disconnected", "closed"].includes(peer.connectionState)) {
        setStatus("Cuộc gọi đã ngắt");
      }
    };

    peerRef.current = peer;
    return peer;
  };

  const openLocalMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === "video",
    });

    localStreamRef.current = stream;

    if (localVideoRef.current && mode === "video") {
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  };

  const startOutgoingCall = async () => {
    if (startedRef.current || isIncoming) return;
    startedRef.current = true;

    try {
      const stream = await openLocalMedia();
      const peer = createPeer();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      sendSignal("offer", offer);
      setStatus("Đang đổ chuông...");
    } catch (err) {
      console.error("Start call error:", err);
      setError("Không mở được camera/micro. Hãy cấp quyền trong trình duyệt.");
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingOffer || startedRef.current) return;
    startedRef.current = true;

    try {
      setAccepted(true);
      const stream = await openLocalMedia();
      const peer = createPeer();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      await peer.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      sendSignal("answer", answer);
      setStatus("Đang kết nối...");
    } catch (err) {
      console.error("Accept call error:", err);
      setError("Không mở được camera/micro. Hãy cấp quyền trong trình duyệt.");
    }
  };

  useEffect(() => {
    const sub = subscribeCallSignals(currentUserId, async (payload) => {
      if (!payload || payload.callId !== callId) return;
      if (Number(payload.fromUserId) === Number(currentUserId)) return;

      try {
        if (payload.type === "answer" && peerRef.current) {
          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(payload.signal)
          );
          setStatus("Đang kết nối...");
        }

        if (payload.type === "candidate" && peerRef.current && payload.signal) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.signal));
        }

        if (payload.type === "reject") {
          setStatus("Người kia đã từ chối");
          setTimeout(() => closeCall(false), 700);
        }

        if (payload.type === "end") {
          setStatus("Cuộc gọi đã kết thúc");
          setTimeout(() => closeCall(false), 400);
        }
      } catch (err) {
        console.error("Handle call signal error:", err);
      }
    });

    if (!isIncoming) {
      startOutgoingCall();
    }

    return () => {
      sub?.unsubscribe?.();
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!isIncoming || accepted) return;

    let audioContext;
    let timer;

    const ring = () => {
      try {
        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.frequency.value = 880;
        gain.gain.value = 0.04;
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.18);
      } catch {
        window.clearInterval(timer);
      }
    };

    ring();
    timer = window.setInterval(ring, 1400);

    return () => {
      window.clearInterval(timer);
      audioContext?.close?.();
    };
  }, [isIncoming, accepted]);

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    localStreamRef.current?.getAudioTracks()?.forEach((track) => {
      track.enabled = next;
    });
  };

  const toggleCamera = () => {
    const next = !cameraOn;
    setCameraOn(next);
    localStreamRef.current?.getVideoTracks()?.forEach((track) => {
      track.enabled = next;
    });
  };

  return (
    <div className="call-overlay">
      <div className="call-card">
        <div className="call-header">
          <div>
            <p className="call-eyebrow">{mode === "video" ? "Video call" : "Voice call"}</p>
            <h3>{peerName}</h3>
          </div>
          <span className="call-pill">{status}</span>
        </div>

        <div className={`call-stage ${mode === "video" ? "is-video" : "is-audio"}`}>
          {mode === "video" && accepted ? (
            <>
              <video ref={remoteVideoRef} autoPlay playsInline className="call-video call-remote-video" />
              <video ref={localVideoRef} autoPlay playsInline muted className="call-local-video" />
            </>
          ) : (
            <div className="call-audio-avatar">
              {avatarSrc ? <img src={avatarSrc} alt="avatar" /> : <span>{peerName?.[0] || "C"}</span>}
            </div>
          )}

          {!accepted && (
            <div className="call-remote-placeholder">
              <div className="call-pulse" />
              <p>{peerName} đang gọi {mode === "video" ? "video" : "thoại"}</p>
              <small>Bấm nghe để bắt đầu cuộc gọi thật.</small>
            </div>
          )}
        </div>

        {error && <div className="call-error">{error}</div>}

        <div className="call-actions">
          {isIncoming && !accepted ? (
            <>
              <button className="call-action end" onClick={() => closeCall(true, "reject")}>
                <PhoneOff size={24} />
              </button>
              <button className="call-action accept" onClick={acceptIncomingCall}>
                <Phone size={24} />
              </button>
            </>
          ) : (
            <>
              <button className={`call-action ${micOn ? "" : "muted"}`} onClick={toggleMic}>
                {micOn ? <Mic size={22} /> : <MicOff size={22} />}
              </button>
              {mode === "video" && (
                <button className={`call-action ${cameraOn ? "" : "muted"}`} onClick={toggleCamera}>
                  {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
                </button>
              )}
              <button className="call-action end" onClick={() => closeCall(true)}>
                <PhoneOff size={24} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CallModal;
