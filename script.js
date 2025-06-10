const peer = new Peer();
let localStream;
let currentCall;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const myId = document.getElementById('my-id');
const micIcon = document.getElementById('micIcon');
const videoIcon = document.getElementById('videoIcon');

peer.on('open', id => {
 myId.textContent = 'Your ID: ' + id;
});

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
 localStream = stream;
 localVideo.srcObject = stream;
 
 peer.on('call', call => {
  if (currentCall) currentCall.close();
  currentCall = call;
  call.answer(localStream);
  call.on('stream', remoteStream => {
   remoteVideo.srcObject = remoteStream;
  });
 });
 
}).catch(err => console.error('Media Error:', err));

function callPeer() {
 const remoteId = prompt("Enter peer ID:");
 if (!remoteId) return;
 const call = peer.call(remoteId, localStream);
 currentCall = call;
 call.on('stream', remoteStream => {
  remoteVideo.srcObject = remoteStream;
 });
}

function endCall() {
 if (currentCall) {
  currentCall.close();
  remoteVideo.srcObject = null;
 }
}

function toggleMute() {
 if (!localStream) return;
 const audioTrack = localStream.getAudioTracks()[0];
 audioTrack.enabled = !audioTrack.enabled;
 micIcon.className = audioTrack.enabled ? "ri-mic-line" : "ri-mic-off-line";
}

function toggleVideo() {
 if (!localStream) return;
 const videoTrack = localStream.getVideoTracks()[0];
 videoTrack.enabled = !videoTrack.enabled;
 videoIcon.className = videoTrack.enabled ? "ri-camera-line" : "ri-camera-off-line";
}