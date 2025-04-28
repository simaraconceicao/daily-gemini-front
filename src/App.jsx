import { useState, useEffect } from 'react';
import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder';
import ReactAudioPlayer from 'react-audio-player';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import './App.css';

const App = () => {
  const [theme, setTheme] = useState('');
  const [text, setText] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioSubmitLoading, setAudioSubmitLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [synthesizing, setSynthesizing] = useState(false);

  const recorderControls = useAudioRecorder();
 
  const fetchTextFromAI = async () => {
    setLoading(true);

    try {
      const response = await axios.post('https://daily-773267354023.us-central1.run.app/theme', {
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
    setAudioSubmitLoading(true); 

    if (!audioBlob) {
      console.error('No audio blob to submit');
      setAudioSubmitLoading(false); 
      return;
    }

    try {
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      const arrayBuffer = await audioFile.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const data = {
        "audio": {
          "inlineData": {
            "mimeType": "audio/webm",
            "data": base64Audio
          }
        }
      };

      const response = await axios.post('https://daily-773267354023.us-central1.run.app/audio', data);

      if (response.data && response.data.candidates && response.data.candidates.length > 0) {
        const text = response.data.candidates[0].content.parts[0].text;
        setResponse(text);
      } else {
        console.error('No candidate data found in response');
      }
    } catch (error) {
      console.error('Error submitting audio to AI:', error);
    } finally {
      setAudioSubmitLoading(false); 
    }
  };

  const handleThemeChange = (event) => {
    setTheme(event.target.value);
  };

  const handleRecordingComplete = (blob) => {
    setAudioBlob(blob);
  };

  const handleClearState = () => {
    setTheme('');
    setText('');
    setAudioBlob(null);
    setResponse('');
    setAudioUrl(null);
  }
  
  useEffect(() => {
    const synthesizeAudio = async () => {
      if (text) {
        setSynthesizing(true);
        try {
          const response = await axios.post('https://daily-773267354023.us-central1.run.app/synthesize', {
            text: text,
          });

          if (response.data && response.data.data) {
            const audioContent = response.data.data; 
            const blob = new Blob([new Uint8Array(audioContent)], { type: 'audio/mpeg' });
            setAudioUrl(URL.createObjectURL(blob));
          } else {
            console.error('No audio content found in response');
          }

        } catch (error) {
          console.error('Error synthesizing audio:', error);
        } finally {
          setSynthesizing(false);
        }
      }
    };

    synthesizeAudio();
  }, [text]);

  return (
    <div className="container">
      <div className="banner">
        <h1 className="app-title">WordUp</h1>
        <p className="app-slogan">Minutes a Day, Fluent for Life</p>
      </div>
      <div className="content">
        <h1 className="title">written comprehension</h1>

        <div className="input-group">
          <label htmlFor="theme" className="label">
            Topic:
          </label>
          <input type="text" id="theme" className="input" value={theme} onChange={handleThemeChange} />
        </div>

        <button className="button primary" onClick={fetchTextFromAI} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Text'}
        </button>

        {text && <p className="generated-text">{text}</p>}
      </div>
      
      <div className="content">
        <h1 className="title">oral comprehension</h1>
        {synthesizing && <p>Synthesizing audio...</p>}
        <ReactAudioPlayer
          src={audioUrl}
          controls
          disabled={synthesizing}
        />
      </div>

      <div className="content">
        <h1 className="title">pronouncing skills</h1>

        <div className="recorder">
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            recorderControls={recorderControls}
            className="audio-recorder"
          />
        </div>

        {audioBlob && ( 
          <ReactAudioPlayer 
            src={URL.createObjectURL(audioBlob)} 
            controls
            className="audio-player"
          />
        )}

        <button
          className="button primary submit"
          onClick={handleAudioSubmit}
          disabled={!audioBlob || audioSubmitLoading}
        >
          {audioSubmitLoading ? 'Submitting...' : 'Submit Audio'}
        </button>

        {response && (
          <div className="response">
            <h2 className="response-title">AI Response:</h2>
            <ReactMarkdown className="response-text">{response}</ReactMarkdown> 
          </div>
        )}
      </div>
      <div>
        <button className="button danger" onClick={handleClearState}>
          Clear All
        </button>
      </div>

    </div>
    
  );
};

export default App;