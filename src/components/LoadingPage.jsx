import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import videoFile from "../assets/backgrounds/loading.mp4";
import "./LoadingPage.css";

const BackgroundVideo = () => {
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Error trying to play video:", error);
      });
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          navigate("./login");
          return 100;
        }
        return prev + 1;
      });
    }, 90);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <main id="loading">
      <video
        ref={videoRef}
        src={videoFile}
        muted
        autoPlay
        loop
        playsInline
        className="w-screen h-screen object-cover absolute top-0 left-0 -z-10"
      />

      <div className="loading-bar">
        <div
          className="loading-progress"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </main>
  );
};

export default BackgroundVideo;
