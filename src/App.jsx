// src/App.jsx

import { useState, useRef, useEffect } from "react";
import "./App.css";

// --- New Story Data ---
// We're using real image and audio URLs for a more immersive demo.
const storyData = [
  {
    chapter: 1,
    title: "The Long Night",
    text: `The sun dipped below the horizon, painting the sky in shades of bruised purple. A lone figure stood on the hill, overlooking the sleeping town. It was the beginning of a long journey, one that would test his courage and resolve. The air was still, holding its breath.`,
    // Image from Unsplash
    imageUrl:
      "https://images.unsplash.com/photo-1475778822368-407b6f6a7931?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzEyOXwwfDF8c2VhcmNofDEyfHxtb29uJTIwY2l0eXxlbnwwfHx8fDE3MjkxNzQwODV8MA&ixlib=rb-4.0.3&q=80&w=1080",
    // Audio from Pixabay
    audioUrl: "https://cdn.pixabay.com/audio/2022/11/22/audio_2cfa0e90e7.mp3",
  },
  {
    chapter: 2,
    title: "The Cold Wind",
    text: `He checked his supplies: a half-empty canteen, a compass that spun wildly, and a stale loaf of bread. This was not the start he had hoped for. The night air grew sharp, and a distant, mournful howl echoed through the valley. He pulled his cloak tighter, his eyes scanning the darkness.`,
    // Image from Unsplash
    imageUrl:
      "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzEyOXwwfDF8c2VhcmNofDd8fGZvZ2d5JTIwZm9yZXN0fGVufDB8fHx8MTcyOTE3NDA1NHww&ixlib=rb-4.0.3&q=80&w=1080",
    // Audio from Pixabay
    audioUrl: "https://cdn.pixabay.com/audio/2023/10/25/audio_8824b17b08.mp3",
  },
];

function App() {
  const [chapterIndex, setChapterIndex] = useState(0);

  // New state to manage the fade transition
  const [isFading, setIsFading] = useState(false);

  // New ref to control the <audio> element directly
  const audioRef = useRef(null);

  const currentChapter = storyData[chapterIndex];

  // A single function to handle navigation
  const handleNavigation = (direction) => {
    if (isFading) return; // Don't change chapters while fading

    const newIndex =
      direction === "next"
        ? Math.min(chapterIndex + 1, storyData.length - 1)
        : Math.max(chapterIndex - 1, 0);

    if (newIndex === chapterIndex) return;

    // 1. Pause current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // 2. Start fading out
    setIsFading(true);

    // 3. After 300ms (matching the CSS transition)
    setTimeout(() => {
      // 4. Change the chapter
      setChapterIndex(newIndex);

      // 5. Start fading back in
      setIsFading(false);
    }, 300);
  };

  // This effect loads the new audio when the chapter changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentChapter.audioUrl;
      audioRef.current.load();
      // We don't autoplay, as browsers block it.
      // The user must press play.
    }
  }, [currentChapter.audioUrl]);

  // This applies the 'fading' class to elements
  const fadeClass = isFading ? "fading" : "";

  return (
    <>
      {/* 1. BACKGROUND IMAGE */}
      <div className="background-container">
        <div
          className={`background-image ${fadeClass}`}
          style={{ backgroundImage: `url(${currentChapter.imageUrl})` }}
        />
        <div className="vignette-overlay" />
      </div>

      {/* 2. HEADER */}
      <header className={`app-header ${fadeClass}`}>
        <h1>Storify AI</h1>
      </header>

      {/* 3. STORY CONTENT */}
      <div className={`story-content ${fadeClass}`}>
        <h2>{currentChapter.title}</h2>
        <p>{currentChapter.text}</p>
      </div>

      {/* 4. CONTROLS */}
      <div className="controls-container">
        <audio ref={audioRef} controls className="audio-player">
          Your browser does not support the audio element.
        </audio>

        <div className="navigation">
          <button
            onClick={() => handleNavigation("prev")}
            disabled={chapterIndex === 0 || isFading}
            className="nav-button"
          >
            Previous
          </button>
          <button
            onClick={() => handleNavigation("next")}
            disabled={chapterIndex === storyData.length - 1 || isFading}
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
