import { useState } from 'react';
import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder';
import axios from 'axios';
import './App.css';

const App = () => {
  const [theme, setTheme] = useState('');
  const [text, setText] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const recorderControls = useAudioRecorder();

  const fetchTextFromAI = async () => {
    setLoading(true);

    try {
      const response = await axios.post('https://us-central1-chat-ai-416420.cloudfunctions.net/daily/theme', {
        theme: theme,
      });
  
      if (response.data && response.data.candidates && response.data.candidates.length > 0) {
        const text = response.data.candidates[0].content.parts[0].text;
        setText(text);
      } else {
        console.error('No candidate data found in response');
      }
    } catch (error) {
      console.error('Error fetching text from AI:', error);
    } finally {
      setLoading(false); 
    }
  };

  const handleAudioSubmit = async () => {
    setLoading(true);

    if (!audioBlob) {
      console.error('No audio blob to submit');
      setLoading(false);
      return;
    }

    try {
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      const arrayBuffer = await audioFile.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const data = {
        "audio": {
          "inlineData": {
            "mimeType": "audio/webm", 
            "data": base64Audio
          }
        }
      };

      const response = await axios.post('https://us-central1-chat-ai-416420.cloudfunctions.net/daily/audio', data);

      if (response.data && response.data.candidates && response.data.candidates.length > 0) {
        const text = response.data.candidates[0].content.parts[0].text;
        setResponse(text);
      } else {
        console.error('No candidate data found in response');
      }
    } catch (error) {
      console.error('Error submitting audio to AI:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (event) => {
    setTheme(event.target.value);
  };

  const handleRecordingComplete = (blob) => {
    setAudioBlob(blob);
    setRecording(false);
  };

  const handleRecordingStatusChange = (status) => {
    setRecording(status === 'recording');
  };

  const handleClearState = () => {
    setTheme('');
    setText('');
    setAudioBlob(null);
    setResponse('');
  };

  return (
    <div className="container">
      <h1 className="title">My Daily Practice</h1>
      <label className="label">
        Theme:
        <input className="input" type="text" value={theme} onChange={handleThemeChange} />
      </label>
      <button className="button" onClick={fetchTextFromAI} disabled={loading}>Generate Text</button>
      {loading && <p>Loading...</p>} 
      <p className="text">{text}</p>

      <AudioRecorder 
        onRecordingComplete={handleRecordingComplete}
        handleStatusChange={handleRecordingStatusChange} 
        recorderControls={recorderControls}
      />
      <button className="button" onClick={handleAudioSubmit} disabled={!audioBlob || loading || recording}>
        Submit Audio
      </button>

      {response && (
        <div className="response">
          <h2 className="response-title">AI Response:</h2>
          <p className="response-text">{response}</p>
        </div>
      )}

      <button className="button" onClick={handleClearState}>Clear State</button>
    </div>
  );
};

export default App;
