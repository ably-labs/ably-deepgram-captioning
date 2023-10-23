import { useState } from "react";
import './App.css'
import { useAbly, useChannel } from 'ably/react';
import { Types } from 'ably';

function App() {
  // Get Ably request channel
  const client = useAbly();
  const requestChannel = useChannel('request-channel').channel;

  const [state, setState] = useState({ active: 'stop' });
  const [transcription, setTranscription] = useState("");
  const [recorder, setRecorder] = useState({} as MediaRecorder);


  // Listen for transcription updates from Ably
  const [lastPersonTalking, setLastPersonTalking] = useState('');
  useChannel('broadcast-channel', (message: Types.Message) => {
    let transcript = message.data;
    if (lastPersonTalking !== message.name) {
      setTranscription(prevTranscription => (prevTranscription + '\n' + message.name + ': '));
      setLastPersonTalking (message.name);
    }
    setTranscription(prevTranscription => (prevTranscription + transcript + ' '));
  });

  async function start(_e: any) {
    setState({ active: 'start' });
    // Add microphone access and send audio to Ably
    navigator.mediaDevices.getUserMedia({ audio: true }).then(async (stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      setRecorder(mediaRecorder);

      // Enter Ably Presence to indicate we're ready to send audio
      await requestChannel.presence.enter();

      // Send audio to Ably
      mediaRecorder.addEventListener('dataavailable', async (event) => {
        if (event.data.size > 0) {
          const arrayBuffer = await event.data.arrayBuffer();
          requestChannel.publish(client.auth.clientId, arrayBuffer);
        }
      });
      mediaRecorder.start(1000);
    });
  }

  async function stop(_e: any) {
    setState({ active: 'stop' });
    if (recorder.state != null) {
      recorder.stop();
      await requestChannel.presence.leave();
    }
  }

  return (
    <div>
      <p id="realtime-title">Click start to begin recording!</p>
      <button onClick={start}
        className={state.active === 'start' ? 'active' : ''}
      >Start</button>
      <button onClick={stop}
        className={state.active === 'stop' ? 'active' : ''}
      >Stop</button>
      <p id="message">{transcription}</p>
    </div>
  );
}

export default App;
