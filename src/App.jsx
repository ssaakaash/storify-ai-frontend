// src/App.jsx

import { useState, useRef, useEffect } from "react";
import "./App.css";

// --- API Endpoints ---
const NARRATION_API =
  "https://9t2vog0wx6.execute-api.us-east-1.amazonaws.com/v1/narration";
const ILLUSTRATION_API =
  "https://9t2vog0wx6.execute-api.us-east-1.amazonaws.com/v1/illustration";

// --- Default Story Data ---
const defaultStoryData = [];

const MAX_CHUNK_SIZE = 2800;

function App() {
  const [story, setStory] = useState(defaultStoryData);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("Processing...");
  const [uploadText, setUploadText] = useState("");

  const audioRef = useRef(null);
  const currentChapter = story[chapterIndex];

  // --- LOGIC FUNCTIONS (All unchanged) ---

  useEffect(() => {
    const fetchAudio = async () => {
      if (!currentChapter) return;
      setIsLoadingAudio(true);
      setAudioError(null);
      setAudioUrl("");
      try {
        const response = await fetch(
          `${NARRATION_API}?chapter=${currentChapter.chapter}`,
        );
        if (!response.ok) {
          throw new Error(`Narration for part ${chapterIndex + 1} not found.`);
        }
        const data = await response.json();
        setAudioUrl(data.audioUrl);
      } catch (error) {
        setAudioError(error.message);
      } finally {
        setIsLoadingAudio(false);
      }
    };
    fetchAudio();
  }, [currentChapter]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      if (userHasInteracted) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) =>
            console.warn("Autoplay was prevented:", error),
          );
        }
      }
    }
  }, [audioUrl, userHasInteracted]);

  const handleAudioEnded = () => {
    if (chapterIndex < story.length - 1) handleNavigation("next");
  };

  const handleNavigation = (direction) => {
    if (isFading) return;
    setUserHasInteracted(true);
    const newIndex =
      direction === "next"
        ? Math.min(chapterIndex + 1, story.length - 1)
        : Math.max(chapterIndex - 1, 0);
    if (newIndex === chapterIndex) return;
    if (audioRef.current) audioRef.current.pause();
    setIsFading(true);
    setTimeout(() => {
      setChapterIndex(newIndex);
      setIsFading(false);
    }, 300);
  };

  const handleFirstPlay = () => setUserHasInteracted(true);

  const handleNarrate = async () => {
    if (isProcessing || !uploadText) return;
    setShowUploadModal(false);
    setIsProcessing(true);
    const paragraphs = uploadText
      .split("\n\n")
      .filter((p) => p.trim().length > 0);
    const chunks = [];
    let currentChunk = "";
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length + 2 > MAX_CHUNK_SIZE) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph;
      }
    }
    chunks.push(currentChunk);
    const newStoryData = [];
    const chapterName = `custom-${Date.now()}`;
    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const partName = `${chapterName}-part-${i}`;
        setProcessingMessage(
          `Processing audio for part ${i + 1}/${chunks.length}...`,
        );
        await fetch(NARRATION_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: chunkText, chapter: partName }),
        });
        setProcessingMessage(
          `Generating illustration for part ${i + 1}/${chunks.length}...`,
        );
        const imageResponse = await fetch(ILLUSTRATION_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: chunkText }),
        });
        if (!imageResponse.ok)
          throw new Error(`Failed to generate image for part ${i + 1}`);
        const imageData = await imageResponse.json();
        newStoryData.push({
          chapter: partName,
          title: `Part ${i + 1}`,
          text: chunkText,
          imageUrl: imageData.imageUrl,
        });
      }
      setStory(newStoryData);
      setChapterIndex(0);
      setUserHasInteracted(true);
      setUploadText("");
    } catch (error) {
      console.error("Error during narration processing:", error);
      setAudioError("Failed to process narration. Please try again.");
      setStory(defaultStoryData);
    } finally {
      setIsProcessing(false);
    }
  };

  const fadeClass = isFading ? "fading" : "";

  // --- NEW HTML STRUCTURE ---
  return (
    <>
      <div className="app-wrapper">
        {/* --- Left Column (Illustration) --- */}
        <div className="illustration-panel">
          <div
            className={`illustration-image ${fadeClass}`}
            style={{ backgroundImage: `url(${currentChapter?.imageUrl})` }}
          />
        </div>
        {/* --- Right Column (Content) --- */}
        <div className="content-panel">
          <header className="app-header">
            <h1>Storify AI</h1>
            <button
              className="upload-button"
              onClick={() => setShowUploadModal(true)}
            >
              Load Story
            </button>
          </header>

          <div className="story-content">
            <h2 className={`story-title ${fadeClass}`}>
              {currentChapter?.title}
            </h2>
            <p className={`story-text ${fadeClass}`}>{currentChapter?.text}</p>
          </div>

          <div className="controls-container">
            <div className="status-message">
              {isLoadingAudio && <p>Loading narration...</p>}
              {audioError && <p className="error-text">Error: {audioError}</p>}
            </div>
            <audio
              ref={audioRef}
              controls
              className="audio-player"
              onEnded={handleAudioEnded}
              onPlay={handleFirstPlay}
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
                  chapterIndex === story.length - 1 ||
                  isFading ||
                  isLoadingAudio
                }
                className="nav-button"
              >
                Next
              </button>
            </div>
          </div>
        </div>{" "}
        {/* End Content Panel */}
      </div>{" "}
      {/* End App Wrapper */}
      {/* --- MODALS & OVERLAYS (Unchanged) --- */}
      {isProcessing && (
        <div className="processing-overlay">{processingMessage}</div>
      )}
      {showUploadModal && (
        <div className="upload-modal">
          <h2>Load Your Story</h2>
          <textarea
            className="upload-textarea"
            placeholder="Paste your chapter text here..."
            value={uploadText}
            onChange={(e) => setUploadText(e.target.value)}
          />
          <div className="upload-controls">
            <button
              className="nav-button"
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </button>
            <button
              className="nav-button"
              onClick={handleNarrate}
              disabled={!uploadText}
            >
              Narrate
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
