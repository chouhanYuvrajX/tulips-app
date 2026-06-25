const { EdgeTTS } = require('@andresaya/edge-tts');

const generateSpeech = async (text) => {
  try {
    const tts = new EdgeTTS();
    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    await tts.synthesize(text, 'en-IN-PrabhatNeural', {
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
