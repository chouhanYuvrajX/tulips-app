const { EdgeTTS } = require('@andresaya/edge-tts');

const generateSpeech = async (text, { language, voiceSpeed } = {}) => {
  try {
    const tts = new EdgeTTS();
    // Emoji aur special characters hatao
    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    const shortText = text.substring(0, 300);
    
    // Voice Selection logic
    let voice;
    if (language === 'Hindi' || language === 'Hinglish') {
      // Note: hi-IN-MadhurNeural is used for Hinglish as well for now.
      // A dedicated Hinglish-tuned voice could be swapped in later if available.
      voice = 'hi-IN-MadhurNeural';
    } else if (language === 'English') {
      voice = 'en-IN-PrabhatNeural';
    } else {
      // Fallback to auto-detection from script
      const hasHindi = /[\u0900-\u097F]/.test(shortText);
      voice = hasHindi ? 'hi-IN-MadhurNeural' : 'en-IN-PrabhatNeural';
    }

    // Voice Speed (Rate) logic
    let rate = '+0%';
    if (voiceSpeed === 'slow') {
      rate = '-15%';
    } else if (voiceSpeed === 'fast') {
      rate = '+15%';
    }

    console.log(`🔊 Using voice: ${voice}, speed: ${rate} for text: "${shortText}"`);
    
    await tts.synthesize(shortText, voice, {
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      rate: rate
    });
    const base64Audio = tts.toBase64();
    return base64Audio;
  } catch (error) {
    console.error('TTS Error:', error.message);
    return null;
  }
};

module.exports = { generateSpeech };
