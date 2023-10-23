import dotenv from 'dotenv';
dotenv.config({ path: `.env.local` });

import Deepgram from '@deepgram/sdk';
const deepgram = new Deepgram.Deepgram(process.env.VITE_DEEPGRAM_API_KEY);

import Ably from 'ably';
const ably = new Ably.Realtime(process.env.VITE_ABLY_API_KEY);

const fromClientChannel = ably.channels.get('request-channel');
const broadcastChannel = ably.channels.get('broadcast-channel');

// On new presence member in Ably joining, start up new deepgramLive session
fromClientChannel.presence.subscribe('enter', (member) => {
    console.log("New member joined: " + member.clientId);
    const deepgramLive = deepgram.transcription.live({
        punctuate: true,
        smart_format: true,
        encoding: "opus",
    });

    deepgramLive.addListener("transcriptReceived", (transcription) => {
        const data = JSON.parse(transcription);
        if (data.channel == null) return;
        const transcript = data.channel.alternatives[0].transcript;

        if (transcript) {
            broadcastChannel.publish(member.clientId, transcript);
        }
    });

    deepgramLive.addListener("error", (err) => {
        console.log(err);
    });

    deepgramLive.addListener("close", (closeMsg) => {
        console.log("Connection closed");
    });

    fromClientChannel.subscribe(member.clientId, (msg) => {
        if (deepgramLive.getReadyState() === 1) {
            deepgramLive.send(msg.data);
        }
    });

    fromClientChannel.presence.subscribe('leave', (member) => {
        console.log("Member left: " + member.clientId);
    });
});