import React, { useEffect, useState, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { TalkingHead } from "./modules/talkinghead.mjs";
import { findBestMatch } from "string-similarity";
import bg from "./assets/022.jpg";

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
  const [showListeningFeedback, setShowListeningFeedback] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const avatarRef = useRef();
  const loadingRef = useRef();
  const headRef = useRef(null);

  // Define extractLink function
  const extractLink = (text) => {
    // Implement logic to extract link from text
    const regex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(regex);
    return match ? match[0] : null;
  };

  const conversations = [
    {
      question: "Johar! Mujhe ek sawaal poochhna hai.",
      answer:
        "Johar Bhaiya! Johar Didi! Main hoon Swasthya Bir – aapka swasthya saathi. Kya main aapki madad kar sakta hoon? Kuch poochhna hai swasthya ke baare mein?",
    },
    {
      question: "5 saal ke bachhe ko bukhaar hai, kya karein?",
      answer:
        "Thik hai, chinta mat kijiye. Bachhe ko bukhaar ho toh sabse pehle:\n\n- Paani pilaiye, har ek ghante mein thoda-thoda.\n- Kapde geele karke maathe aur badan pe sekein.\n- Zyada kapde na pehnaayein, halka kapda theek hai.\n\nAgar 102 se zyada bukhaar ho ya 2 din tak na utare, aaspaas ke doctor ya Asha didi se milna zaroori hai.",
    },
    {
      question: "Haan, doctor ka number chahiye.",
      answer:
        "Thik hai. Aapke gaon mein Mahuwa Swasthya Kendra uplabdh hai.\nDoctor se milne ke liye call kijiye: 9002337788\nYa direct jaa sakte hain – subah 9 se shaam 4 baje tak khula rahega.",
    },
    {
      question: "Aur kya karna chahiye taaki dubara bukhaar na ho?",
      answer:
        "Aapka dhyan rakhiye:\n- Din mein 3 baar paani piyiye\n- Saaf safai banaye rakhiye\n- Bacche ko swachh aur poshtik bhojan dijiye\n\nPhir milenge, Johar!",
    },
    {
      question: "Bahut dhanyawaad, Swasthya Bir!",
      answer:
        "Aapka swasth rehna hi mera lakshya hai. Zarurat padne par phir se bula lijiye. Johar!",
    },
  ];

  // Reset image close state when changing image content
  useEffect(() => {
    if (imageContent) {
      setImageClose(false);
    }
  }, [imageContent]);

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
    setImageContent('');
    
    const trimmedTranscript = transcript.trim().toLowerCase();
    console.log("Transcript:", trimmedTranscript);

    const matches = findBestMatch(
      trimmedTranscript,
      conversations.map((conv) => conv.question.trim().toLowerCase())
    );

    if (matches.bestMatch.rating >= 0.5) {
      const bestMatchIndex = matches.bestMatchIndex;
      const matchingConversation = conversations[bestMatchIndex];
      console.log("Best match:", matchingConversation.question);

      setImageContent(matchingConversation.image || "");
      setResponseText(matchingConversation.answer);

      const extractedLink = extractLink(matchingConversation.answer);
      setLink(extractedLink);

      // Make the talking head speak using the built-in TTS
      if (headRef.current) {
        try {
          console.log("Making talking head speak:", matchingConversation.answer);
          await headRef.current.speakText(matchingConversation.answer);
        } catch (error) {
          console.error("Error making talking head speak:", error);
        }
      } else {
        console.error("headRef.current is not available!");
      }
    } else {
      console.log(
        "No sufficiently close conversation found for transcript:",
        trimmedTranscript
      );

      // Default message when no match is found
      const defaultMessage = "Bhaiya ghar jao";
      setResponseText(defaultMessage);

      // Try to speak the default message
      if (headRef.current) {
        try {
          await headRef.current.speakText(defaultMessage);
        } catch (error) {
          console.error("Error speaking default message:", error);
        }
      }
    }
  };

  useEffect(() => {
    // Check if TalkingHead library is available
    console.log("TalkingHead library available?", typeof TalkingHead !== "undefined");

    const initTalkingHead = async () => {
      if (typeof TalkingHead === "undefined") {
        console.error("TalkingHead library not available!");
        if (loadingRef.current) {
          loadingRef.current.textContent = "TalkingHead library not loaded correctly";
        }
        return;
      }
      
      const nodeAvatar = avatarRef.current;
      if (!nodeAvatar) {
        console.error("Avatar reference not available!");
        return;
      }

      console.log("Creating Talking Head instance");
      
      try {
        // Create TalkingHead instance with Google TTS API
        const API_KEY_TTS =  import.meta.env.VITE_TTS_API;; // Replace with your actual API key
        
        headRef.current = new TalkingHead(nodeAvatar, {
          cameraView: "upper",
          ttsEndpoint: `https://eu-texttospeech.googleapis.com/v1beta1/text:synthesize`,
          ttsApikey: API_KEY_TTS,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
          cameraRotateEnable: false,
          avatarMood: "neutral"
        });

        const nodeLoading = loadingRef.current;
        if (nodeLoading) {
          nodeLoading.textContent = "लोड हो रहा है...";
        }

        // Set voiceId based on Hindi language
        const voiceId = "en-US-Standard-A"; // Hindi voice

        await headRef.current.showAvatar(
          {
            url: "/assets/model.glb",
            body: "M",
            ttsLang: "en-US",
            ttsVoice: voiceId,
            lipsyncLang: "en", // Using English for lip sync as Hindi might not be fully supported
          },
          (ev) => {
            if (ev.lengthComputable && nodeLoading) {
              let val = Math.min(100, Math.round((ev.loaded / ev.total) * 100));
              nodeLoading.textContent = `लोड हो रहा है ${val}%`;
            }
          }
        );

        if (nodeLoading) {
          nodeLoading.style.display = "none";
        }

        // Test speech after initialization
        console.log("Testing talking head with simple message...");
        setTimeout(() => {
          if (headRef.current) {
            headRef.current.speakText("नमस्ते, मैं स्वास्थ्य बीर हूँ।")
              .then(() => console.log("Test speech completed"))
              .catch(err => console.error("Test speech failed:", err));
          } else {
            console.error("headRef.current is not available for test speak");
          }
        }, 3000); // Wait 3 seconds to ensure initialization is complete
      } catch (error) {
        console.error("Failed to initialize Talking Head:", error);
        if (loadingRef.current) {
          loadingRef.current.textContent = "अवतार लोड करने में समस्या आई: " + error.toString();
        }
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
      {/* Background image */}
      <img
        src={bg}
        alt="Background"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
          objectFit: "cover",
          zIndex: "-10",
        }}
      />

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
    </div>
  );
};

export default App;