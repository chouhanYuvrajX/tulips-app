const generateSpeech = async (text) => {
  try {
    // StreamElements TTS API - 100% Free, No API Key needed
    // Voice 'Matthew' deep aur calm male voice ke liye best hai.
    // Aur options: 'Brian' (UK male), 'Russell' (AU male)
    const voice = 'Matthew'; 
    const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodeURIComponent(text)}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`TTS API Error: ${response.status} ${response.statusText}`);
      return null;
    }

    // Convert audio buffer to Base64 string (Same logic as ElevenLabs)
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');
    
    return `data:audio/mpeg;base64,${base64Audio}`;

  } catch (error) {
    console.error('Error generating TTS:', error.message);
    return null;
  }
};

module.exports = { generateSpeech };
