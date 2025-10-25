// src/App.jsx

import { useState, useRef, useEffect } from "react";
import "./App.css";

// --- IMPORTANT: PASTE YOUR API URL HERE ---
// Get this from your API Gateway console's 'v1' stage
const API_ENDPOINT =
  "https://fzp9wkiip9.execute-api.ap-south-1.amazonaws.com/v1/narration";
// Example: 'https://1234abcd.execute-api.us-east-1.amazonaws.com/v1/narration'

// --- Story Data (without local audio URLs) ---
const storyData = [
  {
    chapter: 1,
    title: "The Long Night",
    text: `The sun dipped below the horizon, painting the sky in shades of bruised purple. A lone figure stood on the hill, overlooking the sleeping town. It was the beginning of a long journey, one that would test his courage and resolve. The air was still, holding its breath.`,
    imageUrl:
      "https://images.unsplash.com/photo-1475778822368-407b6f6a7931?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzEyOXwwfDF8c2VhcmNofDEyfHxtb29uJTIwY2l0eXxlbnwwfHx8fDE3MjkxNzQwODV8MA&ixlib=rb-4.0.3&q=80&w=1080",
  },
  {
    chapter: 2,
    title: "The Cold Wind",
    text: `He checked his supplies: a half-empty canteen, a compass that spun wildly, and a stale loaf of bread. This was not the start he had hoped for. The night air grew sharp, and a distant, mournful howl echoed through the valley. He pulled his cloak tighter, his eyes scanning the darkness.`,
    imageUrl:
      "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzEyOXwwfDF8c2VhcmNofDd8fGZvZ2d5JTIwZm9yZXN0fGVufDB8fHx8MTcyOTE3NDA1NHww&ixlib=rb-4.0.3&q=80&w=1080",
  },
];

function App() {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // --- NEW STATE ---
  // Holds the URL from S3
  const [audioUrl, setAudioUrl] = useState("");
  // Manages loading state
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioRef = useRef(null);
  const currentChapter = storyData[chapterIndex];

  // --- NEW EFFECT HOOK ---
  // This runs every time the chapter changes
  useEffect(() => {
    const fetchAudio = async () => {
      if (!currentChapter) return;

      setIsLoadingAudio(true);
      setAudioUrl(""); // Clear previous audio

      try {
        // Call our new GET /narration endpoint with the chapter number
        const response = await fetch(
          `${API_ENDPOINT}?chapter=${currentChapter.chapter}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch audio");
        }

        const data = await response.json();

        // Set the S3 pre-signed URL in our state
        setAudioUrl(data.audioUrl);
      } catch (error) {
        console.error("Error fetching audio URL:", error);
        // You could set an error message in state here
      } finally {
        setIsLoadingAudio(false);
      }
    };

    fetchAudio();
  }, [currentChapter]); // Dependency array: runs when 'currentChapter' changes

  // This effect loads the new audio when the audioUrl state changes
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  const handleNavigation = (direction) => {
    if (isFading) return;

    const newIndex =
      direction === "next"
        ? Math.min(chapterIndex + 1, storyData.length - 1)
        : Math.max(chapterIndex - 1, 0);

    if (newIndex === chapterIndex) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setIsFading(true);

    setTimeout(() => {
      setChapterIndex(newIndex);
      setIsFading(false);
    }, 300);
  };

  const fadeClass = isFading ? "fading" : "";

  return (
    <>
      <div className="background-container">
        <div
          className={`background-image ${fadeClass}`}
          style={{ backgroundImage: `url(${currentChapter.imageUrl})` }}
        />
        <div className="vignette-overlay" />
      </div>

      <header className={`app-header ${fadeClass}`}>
        <h1>Storify AI</h1>
      </header>

      <div className={`story-content ${fadeClass}`}>
        <h2>{currentChapter.title}</h2>
        <p>{currentChapter.text}</p>
      </div>

      <div className="controls-container">
        <audio ref={audioRef} controls className="audio-player">
          Your browser does not support the audio element.
        </audio>

        <div className="navigation">
          <button
            onClick={() => handleNavigation("prev")}
            disabled={chapterIndex === 0 || isFading || isLoadingAudio}
            className="nav-button"
          >
            Previous
          </button>
          <button
            onClick={() => handleNavigation("next")}
            disabled={
              chapterIndex === storyData.length - 1 ||
              isFading ||
              isLoadingAudio
            }
            className="nav-button"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
