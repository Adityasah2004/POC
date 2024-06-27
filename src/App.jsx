import React, { useEffect, useState, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { TalkingHead } from "./modules/talkinghead.mjs";
import { findBestMatch } from "string-similarity"; // Adjust the path as necessary
import bg from "./assets/bgVideo.mp4";

const App = () => {
  const {
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
    finalTranscript,
  } = useSpeechRecognition();

  const [responseText, setResponseText] = useState("");
  const [link, setLink] = useState("");
  const [imageContent, setImageContent] = useState("");
  const [imageClose, setImageClose] = useState(false);
  // const [videoClose, setVideoClose] = useState(false);
  const [showListeningFeedback, setShowListeningFeedback] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const avatarRef = useRef();
  const loadingRef = useRef();
  const headRef = useRef(null);

  // Define extractLink function
  const extractLink = (text) => {
    // Implement logic to extract link from text
    // Example implementation:
    const regex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(regex);
    return match ? match[0] : null;
  };

  const conversations = [
    {
      question: "Hello, I need help with my recent order.",
      answer:
        "Good day! I'm here to assist you. Could you please provide me with your order number so I can locate your details?",
      image:
        "https://gleen.ai/blog/content/images/2024/01/Screenshot-2024-01-03-at-6.19.43-PM.png",
    },
    {
      question: "Sure, it's 12345.",
      answer:
        "Thank you. I see your order for the deluxe model vacuum cleaner placed yesterday. How can I assist you with this order today?",
    },
    {
      question:
        "Actually, I received the wrong color. I ordered black, but I received blue.",
      answer:
        "I apologize for the inconvenience. Let me initiate a return and replacement process for you. Could you confirm if you prefer to receive the correct black model?",
    },
    {
      question: "Yes, please. That would be great.",
      answer:
        "I've processed the return label for the blue vacuum cleaner. You should receive an email shortly with the return instructions. The replacement in black will be shipped out within 24 hours. Is there anything else I can assist you with?",
      image:
        "https://media.licdn.com/dms/image/D4D12AQFqiy4k-hCAdQ/article-cover_image-shrink_720_1280/0/1676325587382?e=2147483647&v=beta&t=Sc0HZZXDQvVYN0Jru0Gr_HVhWg7pC5fVEr0QJwOXsAI",
    },
    {
      question: "No, that's all for now. Thank you for your help.",
      answer:
        "You're welcome. If you have any more questions in the future, feel free to reach out. Have a wonderful day!",
    },
    {
      question: "Thanks, you too!",
      answer: "Take care!",
      image:
        "https://cdn.prod.website-files.com/634e928d7acf0e5b9297c41b/639b3b8fade13f1769e46ef5_customer%20service%20chatbot.webp",
    },
  ];

  useEffect(() => {
    if (showListeningFeedback) {
      const timer = setTimeout(() => {
        setShowListeningFeedback(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showListeningFeedback]);

  const handleStart = () => {
    SpeechRecognition.startListening({ continuous: false });
    setIsListening(true);

    setShowListeningFeedback(true);
    console.log("Listening started");
  };

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      alert("Your browser does not support speech recognition.");
    }
  }, [browserSupportsSpeechRecognition]);

  useEffect(() => {
    console.log("Effect to handle final transcript changes");
    if (finalTranscript) {
      processTranscript(finalTranscript);
      resetTranscript();
    }
  }, [finalTranscript, resetTranscript]);

  const processTranscript = async (transcript) => {
    setLink('');
    setImageContent('')
    // setImageClose(true)
    const trimmedTranscript = transcript.trim().toLowerCase();

    console.log("Transcript:", trimmedTranscript);

    const matches = findBestMatch(
      trimmedTranscript,
      conversations.map((conv) => conv.question.trim().toLowerCase())
    );

    if (matches.bestMatch.rating >= 0.5) {
      const bestMatchIndex = matches.bestMatchIndex;
      const matchingConversation = conversations[bestMatchIndex];
      console.log(matchingConversation);
      console.log("Best match:", matchingConversation.question);

      setImageContent(matchingConversation.image || "");
      setResponseText(matchingConversation.answer);

      const extractedLink = extractLink(matchingConversation.answer);
      setLink(extractedLink);

      if (headRef.current) {
        headRef.current.speakText(matchingConversation.answer);
      }
    } else {
      console.log(
        "No sufficiently close conversation found for transcript:",
        trimmedTranscript
      );

      // Speak the message when no match is found
      if (headRef.current) {
        headRef.current.speakText(
          "No sufficiently close conversation found for transcript"
        );
      }

      // Clear any existing response text or image content
      setResponseText("");
    //   setImageContent("");
    }
  };

  useEffect(() => {
    const initTalkingHead = async () => {
      const nodeAvatar = avatarRef.current;
      try {
        console.log("Creating Talking Head instance");
        headRef.current = new TalkingHead(nodeAvatar, {
          cameraView: "upper",
          ttsEndpoint:
            "https://api.elevenlabs.io/v1/text-to-speech/wBtZtyqh23tPxOzF1pK4/with-timestamps",
          ttsApikey: "98d2b4bd1d379ce21ad568fb86183396",
          modelId: "eleven_multilingual_V2",
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.8,
            use_speaker_boost: true,
          },
        });

        // Wait for avatar initialization and loading
        const nodeLoading = loadingRef.current;
        nodeLoading.textContent = "Loading...";
        await headRef.current.showAvatar(
          {
            url: "https://storage.googleapis.com/glb_buckets/6610f997ec100b8c02c763b8%20(2).glb",
            body: "M",
            avatarMood: "neutral",
            ttsLang: "en-GB",
            ttsVoice: "en-GB-Standard-A",
            lipsyncLang: "en"
          },
          (ev) => {
            if (ev.lengthComputable) {
              let val = Math.min(100, Math.round((ev.loaded / ev.total) * 100));
              nodeLoading.textContent = "Loading " + val + "%";
            }
          }
        );

        // Hide loading indicator after initialization
        nodeLoading.style.display = "none";
      } catch (error) {
        console.error("Failed to initialize Talking Head:", error);
        // Display error message or handle initialization failure
        loadingRef.current.textContent =
          "Failed to initialize Talking Head: " + error.toString();
      }
    };

    initTalkingHead();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background video */}
      <video
        src={bg}
        muted
        loop
        style={{
          width: "100%",
          height: "100vh",
          objectFit: "cover",
          zIndex: "-10",
        }}
      ></video>

      {/* Avatar container */}
      <div
        id="avatar"
        ref={avatarRef}
        style={{
          position: "absolute",
          bottom: "0",
          left: 0,
          width: imageContent ? "50%" : "100%",
          height: "100vh",
          zIndex: "100",
          transition: "width 1s ease-in-out",
        }}
      ></div>

      {/* Loading indicator */}
      <div
        id="loading"
        ref={loadingRef}
        style={{
          position: "absolute",
          bottom: "50%",
          width: "100%",
          maxHeight: "20%",
          overflowY: "scroll",
          color: "white",
          padding: "10px",
          zIndex: "10",
          marginLeft: "auto",
          marginRight: "auto",
          left: "0",
          right: "0",
        }}
      ></div>

      {/* Button to start speaking */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: "4rem",
          width: "100%",
          alignItem: "center",
          justifyContent: "center",
          gap: "1rem",
        }}
      >
        <button
          onClick={handleStart}
          style={{
            zIndex: "1000",
            background: "#2135A9",
            color: "white",
            padding: "1rem 2rem",
            width: "fit-content",
            borderRadius: "500px",
            border: "none",
            marginTop: "0.5rem",
            cursor: "pointer",
          }}
        >
          Speak
        </button>
      </div>

      {/* Response text */}
      <span
        style={{
          position: "absolute",
          bottom: "8rem",
          marginLeft: "auto",
          marginRight: "auto",
          left: "0",
          right: "0",
          zIndex: "1050",
          background: "#000000",
          color: "white",
          padding: "1rem 2rem",
          width: "fit-content",
          borderRadius: "500px",
          border: "none",
          display: "flex",
        }}
      >
        {responseText ? (
          <span>{responseText}</span>
        ) : (
          <span>
            Welcome, I am your Virtual Assistant. How can I help you today?
          </span>
        )}
      </span>

      {/* Listening feedback */}
      {showListeningFeedback && (
        <span
          className="feedback"
          style={{
            position: "absolute",
            bottom: "1rem",
            marginLeft: "auto",
            marginRight: "auto",
            left: "0",
            right: "0",
            zIndex: "1050",
            background: "#000000",
            color: "white",
            padding: "0.5rem 1rem",
            width: "fit-content",
            borderRadius: "20px",
            border: "none",
            display: "flex",
          }}
        >
          Listening...
        </span>
      )}

      {/* Displaying images */}
      {imageContent && !imageClose && (
        <span
          style={{
            width: "600px",
            height: "fit-content",
            zIndex: "2500",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "absolute",
            bottom: "15rem",
            right: "10rem",
            borderRadius: "20px",
          }}
        >
          <img
            src={imageContent}
            alt="Response"
            style={{
              width: "600px",
              height: "auto",
              zIndex: "2000",
              right: "10rem",
              borderRadius: "20px 20px 0 0",
              border: "1px solid black",
            }}
          />
          <button
            onClick={() => setImageClose(true)}
            style={{
              background: "black",
              color: "white",
              padding: "1rem 2rem",
              width: "100%",
              borderRadius: "0 0 500px 500px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Close image
          </button>
        </span>
      )}

      {/* Video player
          {
              responseText && videoClose &&
              <span style={{ width: "600px", height: "fit-content", zIndex: "2500", display: "flex", flexDirection: "column", alignItems: "center", position: "absolute", bottom: "15rem", right: "10rem", borderRadius: "20px", overflow: "hidden" }}>
                  <video src={responseText} style={{ width: "600px", height: "fit-content", zIndex: "2000", right: "10rem", borderRadius: "20px 20px 0 0", border: "1px solid black" }} autoPlay controls>
                  </video>
                  <button onClick={() => setVideoClose(true)} style={{ background: "black", color: "white", padding: "1rem 2rem", width: "100%", borderRadius: "0 0 500px 500px", border: "none", cursor: "pointer" }}>Close Video</button>
              </span>
          } */}
    </div>
  );
};

export default App;
