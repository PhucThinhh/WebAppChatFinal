import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Sparkles } from "lucide-react";
import { getImageUrl } from "../../../utils/imageUrl";

function CallModal({ mode = "audio", title = "Cuộc gọi", avatar, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(mode === "video");
  const [error, setError] = useState("");
  const avatarSrc = getImageUrl(avatar);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === "video",
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current && mode === "video") {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Không mở được camera/micro. Hãy cấp quyền trong trình duyệt.");
      }
    };

    start();

    return () => {
      mounted = false;
      streamRef.current?.getTracks()?.forEach((track) => track.stop());
    };
  }, [mode]);

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    streamRef.current?.getAudioTracks()?.forEach((track) => {
      track.enabled = next;
    });
  };

  const toggleCamera = () => {
    const next = !cameraOn;
    setCameraOn(next);
    streamRef.current?.getVideoTracks()?.forEach((track) => {
      track.enabled = next;
    });
  };

  return (
    <div className="call-overlay">
      <div className="call-card">
        <div className="call-header">
          <div>
            <p className="call-eyebrow">{mode === "video" ? "Video call" : "Voice call"}</p>
            <h3>{title}</h3>
          </div>
          <span className="call-pill"><Sparkles size={14} /> Demo realtime UI</span>
        </div>

        <div className={`call-stage ${mode === "video" ? "is-video" : "is-audio"}`}>
          {mode === "video" ? (
            <video ref={videoRef} autoPlay playsInline muted className="call-video" />
          ) : (
            <div className="call-audio-avatar">
              {avatarSrc ? <img src={avatarSrc} alt="avatar" /> : <span>{title?.[0] || "C"}</span>}
            </div>
          )}

          <div className="call-remote-placeholder">
            <div className="call-pulse" />
            <p>Đang chờ người nhận tham gia...</p>
            <small>Cần signaling/WebRTC server để gọi thật giữa 2 máy.</small>
          </div>
        </div>

        {error && <div className="call-error">{error}</div>}

        <div className="call-actions">
          <button className={`call-action ${micOn ? "" : "muted"}`} onClick={toggleMic}>
            {micOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          {mode === "video" && (
            <button className={`call-action ${cameraOn ? "" : "muted"}`} onClick={toggleCamera}>
              {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
            </button>
          )}
          <button className="call-action end" onClick={onClose}>
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CallModal;
