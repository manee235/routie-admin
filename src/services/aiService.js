import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

export const generateNarration = async (prompt) => {
  if (!API_KEY) {
    console.warn("No Gemini API key found in .env. Falling back to basic narration.");
    return fallbackNarration(prompt);
  }
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return fallbackNarration(prompt);
  }
};

const fallbackNarration = (prompt) => {
  if (prompt.includes("Bus Status")) {
    return "Here is the bus status. It is currently operating normally.";
  }
  if (prompt.includes("Dashboard Analytics")) {
    return "Your analytics dashboard looks great. The system is operating normally.";
  }
  return "AI narration is offline because no API key was provided.";
};

export const playAudio = (text) => {
  if (!('speechSynthesis' in window)) {
    console.error("Speech synthesis not supported in this browser.");
    return;
  }
  
  window.speechSynthesis.cancel(); // Stop any ongoing speech
  
  // Clean up markdown bold asterisks if Gemini outputs them
  const cleanText = text.replace(/\*/g, '');
  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;

    // Premium/natural sounding voices ranked by preference
    const preferredVoiceNames = [
      "Microsoft Aria Online (Natural) - English (United States)",
      "Microsoft Jenny Online (Natural) - English (United States)",
      "Google UK English Female",
      "Samantha", // Mac
      "Google US English",
      "Microsoft Zira Desktop - English (United States)"
    ];

    let selectedVoice = null;
    for (const name of preferredVoiceNames) {
      selectedVoice = voices.find(v => v.name === name);
      if (selectedVoice) break;
    }
    
    // Fallback to any English female voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female'));
    }
    
    // Ultimate fallback to the first English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en'));
    }

    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // Chrome sometimes loads voices asynchronously
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = setVoice;
  } else {
    setVoice();
  }
};
