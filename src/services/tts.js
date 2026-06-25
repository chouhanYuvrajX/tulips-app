const { EdgeTTS } = require('@andresaya/edge-tts');

const generateSpeech = async (text) => {
  try {
    const tts = new EdgeTTS();
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
