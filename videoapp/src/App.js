import React, { useState, useEffect, useRef } from "react";
import './App.css';
import { Row, Col } from 'react-simple-flex-grid';
import "react-simple-flex-grid/lib/main.css";
import { 
  MeetingProvider,
  MeetingConsumer,
  useMeeting,
  useParticipant
} from "@videosdk.live/react-sdk";
import { getToken, getMeetingId } from "./api"; // Update import as per your `./api` file

// Chunk function to divide an array into chunks of 3
const chunk = (arr) => {
  const newArr = [];
  while (arr.length) newArr.push(arr.splice(0, 3));
  return newArr;
};

// ParticipantView component to display participant's webcam, mic, and screen share
function ParticipantView({ participantId }) {
  const webcamRef = useRef(null);
  const micRef = useRef(null);
  const screenShareRef = useRef(null);

  const {
    displayName,
    webcamStream,
    micStream,
    screenShareStream,
    webcamOn,
    micOn,
    screenShareOn
  } = useParticipant(participantId);

  useEffect(() => {
    if (webcamRef.current) {
      if (webcamOn && webcamStream && webcamStream.track) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(webcamStream.track);
        webcamRef.current.srcObject = mediaStream;
        webcamRef.current
          .play()
          .catch((error) => console.error("webcamRef.current.play() failed", error));
      } else {
        webcamRef.current.srcObject = null;
      }
    }
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream && micStream.track) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);
        micRef.current.srcObject = mediaStream;
        micRef.current
          .play()
          .catch((error) => console.error("micRef.current.play() failed", error));
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  useEffect(() => {
    if (screenShareRef.current) {
      if (screenShareOn && screenShareStream && screenShareStream.track) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(screenShareStream.track);
        screenShareRef.current.srcObject = mediaStream;
        screenShareRef.current
          .play()
          .catch((error) => console.error("screenShareRef.current.play() failed", error));
      } else {
        screenShareRef.current.srcObject = null;
      }
    }
  }, [screenShareStream, screenShareOn]);

  return (
    <div className="participant-block">
      <audio ref={micRef} autoPlay />
      {(webcamOn || micOn) ? (
        <div>
          <h2>{displayName}</h2>
          <video ref={webcamRef} autoPlay />
        </div>
      ) : null}
      {screenShareOn ? (
        <div>
          <h2>Screen Shared</h2>
          <video ref={screenShareRef} autoPlay />
        </div>
      ) : null}
      <span>Mic: {micOn ? "Yes" : "No"}, Camera: {webcamOn ? "Yes" : "No"}, Screen Share: {screenShareOn ? "Yes" : "No"}</span>
    </div>
  );
}

// Update toggle functions in your MeetingGrid component
function MeetingGrid(props) {
  const [joined, setJoined] = useState(false);

  const { join, leave, toggleMic, toggleWebcam, toggleScreenShare, participants } = useMeeting();

  const joinMeeting = () => {
    setJoined(true);
    join();
  };

  return (
    <div className="app-container">
      <header>Meeting Id: {props.meetingId}</header>

      {joined ? (
        <>
          <div className="meeting-controls">
            <button onClick={() => leave()}>Leave</button> {/* Ensure no event object is passed */}
            <button onClick={() => toggleMic()}>Toggle Mic</button> {/* Wrap with arrow function */}
            <button onClick={() => toggleWebcam()}>Toggle Webcam</button> {/* Wrap with arrow function */}
            <button onClick={() => toggleScreenShare()}>Toggle Screen Share</button> {/* Wrap with arrow function */}
          </div>

          <div className="participant-grid">
            {chunk([...participants.keys()]).map((k) => (
              <Row key={k} gutter={80}>
                {k.map((participantId) => (
                  <Col span={4} key={participantId}>
                    <ParticipantView participantId={participantId} />
                  </Col>
                ))}
              </Row>
            ))}
          </div>
        </>
      ) : (
        <div className="join-button-area">
          <button onClick={joinMeeting}>Join</button>
        </div>
      )}
    </div>
  );
}


// JoinScreen component to either join or create a meeting
function JoinScreen({ updateMeetingId, getMeetingAndToken }) {
  return (
    <div>
      <input 
        type="text" 
        placeholder="Enter Meeting Id" 
        onChange={(e) => updateMeetingId(e.target.value)} 
      />
      <button onClick={getMeetingAndToken}>Join</button>
      <button onClick={getMeetingAndToken}>Create Meeting</button>
    </div>
  );
}

// Main App component
function App() {
  const [token, setToken] = useState(null);
  const [meetingId, setMeetingId] = useState(null);

  // Fetch token and meetingId
  const getMeetingAndToken = async () => {
    const token = await getToken();
    setToken(token);
    const meetingId = await getMeetingId(token); // Use `getMeetingId` instead of `createMeeting`
    setMeetingId(meetingId);
  };

  const updateMeetingId = (meetingId) => {
    setMeetingId(meetingId);
  };

  return token && meetingId ? (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: true,
        webcamEnabled: true,
        name: "Harsh Mer",
      }}
      token={token}
    >
      <MeetingConsumer>
        {() => (
          <div>
            <h2>Meeting ID: {meetingId}</h2>
            <MeetingGrid meetingId={meetingId} />
          </div>
        )}
      </MeetingConsumer>
    </MeetingProvider>
  ) : (
    <JoinScreen updateMeetingId={updateMeetingId} getMeetingAndToken={getMeetingAndToken} />
  );
}

export default App;
