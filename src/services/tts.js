const { EdgeTTS } = require('@andresaya/edge-tts');

const generateSpeech = async (text) => {
  try {
    const tts = new EdgeTTS();
    // Emoji aur special characters hatao
    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    const shortText = text.substring(0, 300);
    
    // Hindi (Devanagari) characters hone par Hindi voice, nahi to English
    const hasHindi = /[\u0900-\u097F]/.test(shortText);
    const voice = hasHindi ? 'hi-IN-MadhurNeural' : 'en-IN-PrabhatNeural';
    console.log(`🔊 Using voice: ${voice} for text: "${shortText}"`);
    
    await tts.synthesize(shortText, voice, {
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3'
    });
    const base64Audio = tts.toBase64();
    return base64Audio;
  } catch (error) {
    console.error('TTS Error:', error.message);
    return null;
  }
};

module.exports = { generateSpeech };
