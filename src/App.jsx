// src/App.jsx

import { useState, useRef, useEffect } from "react";
import "./App.css";

// --- API Endpoint ---
const API_ENDPOINT =
  "https://fzp9wkiip9.execute-api.ap-south-1.amazonaws.com/v1/narration";

// --- Story Data (with new chapter 3) ---
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
  {
    chapter: 3,
    title: "The Fading Light",
    text: `The path ahead was unclear, shrouded in mist. He wasn't sure he could go on, but a small flicker of hope remained. He took one more step into the unknown.`,
    imageUrl:
      "https://images.unsplash.com/photo-1488866022504-f2584929ca5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzEyOXwwfDF8c2VhcmNofDEwfHxtaXN0eSUyMHBhdGh8ZW58MHx8fHwxNzI5MTc0MDU0fDA&ixlib=rb-4.0.3&q=80&w=1080",
  },
];

function App() {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");

  // --- NEW UX STATE ---
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState(null);
  // Tracks if user has interacted, to allow autoplay
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  const audioRef = useRef(null);
  const currentChapter = storyData[chapterIndex];

  // --- 1. AUDIO FETCHING ---
  useEffect(() => {
    const fetchAudio = async () => {
      if (!currentChapter) return;

      setIsLoadingAudio(true);
      setAudioError(null); // Clear previous errors
      setAudioUrl("");

      try {
        const response = await fetch(
          `${API_ENDPOINT}?chapter=${currentChapter.chapter}`,
        );
        if (!response.ok) {
          throw new Error(
            `Narration for chapter ${currentChapter.chapter} not found.`,
          );
        }
        const data = await response.json();
        setAudioUrl(data.audioUrl);
      } catch (error) {
        console.error("Error fetching audio URL:", error);
        setAudioError(error.message); // Show error to user
      } finally {
        setIsLoadingAudio(false);
      }
    };

    fetchAudio();
  }, [currentChapter]); // Runs when chapter changes

  // --- 2. AUTOPLAY LOGIC ---
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();

      // Autoplay is only attempted if the user has interacted
      if (userHasInteracted) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn("Autoplay was prevented:", error);
          });
        }
      }
    }
  }, [audioUrl, userHasInteracted]); // Runs when audioUrl or interaction state changes

  // --- 3. AUTO-NEXT CHAPTER LOGIC ---
  const handleAudioEnded = () => {
    // Check if it's NOT the last chapter
    if (chapterIndex < storyData.length - 1) {
      handleNavigation("next");
    }
  };

  // --- 4. NAVIGATION LOGIC ---
  const handleNavigation = (direction) => {
    if (isFading) return;

    // Any navigation click counts as a user interaction
    setUserHasInteracted(true);

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

  // This function unlocks autoplay on the first play click
  const handleFirstPlay = () => {
    setUserHasInteracted(true);
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

      <header className={`app-header glass-panel ${fadeClass}`}>
        <h1>Storify AI</h1>
      </header>

      <div className={`story-content glass-panel ${fadeClass}`}>
        <h2>{currentChapter.title}</h2>
        <p>{currentChapter.text}</p>
      </div>

      <div className={`controls-container glass-panel ${fadeClass}`}>
        {/* --- 5. NEW LOADING/ERROR UI --- */}
        <div className="status-message">
          {isLoadingAudio && <p>Loading narration...</p>}
          {audioError && <p className="error-text">Error: {audioError}</p>}
        </div>

        <audio
          ref={audioRef}
          controls
          className="audio-player"
          onEnded={handleAudioEnded} // Auto-next
          onPlay={handleFirstPlay} // Unlocks autoplay
        >
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
