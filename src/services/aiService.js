const OPENAI_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// ── Generate narration text using OpenAI Chat Completions ──
export const generateNarration = async (prompt) => {
  if (!OPENAI_KEY) {
    console.warn('No OpenAI API key found in .env');
    return fallbackNarration(prompt);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional, concise dispatcher AI. Speak in a calm, natural, professional tone. Never use markdown, asterisks, or bullet points in your responses.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('OpenAI Chat Error:', err);
      return fallbackNarration(prompt);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || fallbackNarration(prompt);
  } catch (error) {
    console.error('OpenAI fetch error:', error);
    return fallbackNarration(prompt);
  }
};

// ── Play audio using OpenAI TTS API (nova voice — natural & clear) ──
export const playAudio = async (text) => {
  if (!OPENAI_KEY) {
    playFallbackTTS(text);
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova',
        input: text.replace(/\*/g, ''),
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI TTS Error:', response.status);
      playFallbackTTS(text);
      return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.onended = () => URL.revokeObjectURL(audioUrl);
    await audio.play();
  } catch (error) {
    console.error('OpenAI TTS fetch error:', error);
    playFallbackTTS(text);
  }
};

// ── Fallback: browser SpeechSynthesis if OpenAI TTS unavailable ──
const playFallbackTTS = (text) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const cleanText = text.replace(/\*/g, '');
  const utterance = new SpeechSynthesisUtterance(cleanText);

  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const preferred = [
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Google UK English Female',
      'Samantha',
      'Google US English',
    ];
    let voice = null;
    for (const name of preferred) {
      voice = voices.find(v => v.name === name);
      if (voice) break;
    }
    if (!voice) voice = voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = setVoice;
  } else {
    setVoice();
  }
};

// ── Static fallback text ──
const fallbackNarration = (prompt) => {
  if (prompt.toLowerCase().includes('bus')) return 'Bus is currently operating normally on its assigned route.';
  return 'The system is operating normally. All services are running as scheduled.';
};
