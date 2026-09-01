import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import escapeVideo from "../../assets/escape/escaperoom.mp4";

export default function EscapeIntro() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      video.onended = () => {
        navigate("/escape-room");
      };
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkip(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="escape-intro-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="escape-intro-container  w-full h-screen object-cover"
      >
        <source src={escapeVideo} type="video/mp4" />
      </video>

      {showSkip && (
        <button
          onClick={() => navigate("/escape-room")}
          className="skip-neon-btn absolute bottom-10 right-10 px-8 py-3 text-sm tracking-[0.25em] uppercase text-cyan"
          style={{
            clipPath: "polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)",
          }}
        >
          Skip Intro
        </button>
      )}
    </div>
  );
}
