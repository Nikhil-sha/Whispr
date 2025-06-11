const peer = new Peer();
let localStream;
let currentCall;

// DOM Elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const myIdDisplay = document.getElementById('my-id');
const micIcon = document.getElementById('micIcon');
const videoIcon = document.getElementById('videoIcon');

let audioEnabled = true;
let videoEnabled = true;

function showToast(message, type = 'info') {
 const toast = document.createElement('div');
 toast.className = `mb-2 px-4 py-2 rounded-lg text-white text-sm shadow-lg ${
    type === 'error' ? 'bg-red-500' : 'bg-gray-800'
  } animate-fadeInOut`;
 toast.textContent = message;
 
 toastContainer.appendChild(toast);
 
 setTimeout(() => {
  toast.remove();
 }, 3000);
}

function shareLink(myId) {
 const url = `https://nikhil-sha.github.io/Whispr/?peer=${myId}`;
 
 if (navigator.share) {
  navigator.share({
   title: 'Join my Whispr call!',
   text: 'Click to connect with me:',
   url: url
  }).then(() => {
   showToast('Link shared successfully!');
  }).catch(err => {
   console.error('Sharing failed:', err);
   showToast('Share failed. Try copying the link.', 'error');
  });
 } else {
  // Fallback for browsers without Web Share API
  navigator.clipboard.writeText(url)
   .then(() => showToast('Link copied to clipboard!'))
   .catch(() => showToast('Failed to copy link.', 'error'));
 }
}

function init() {
 const urlParams = new URLSearchParams(window.location.search);
 const peerIdToJoin = urlParams.get('peer');
 
 if (peerIdToJoin) {
  showToast(`Connecting to peer: ${peerIdToJoin}`);
  callPeer(peerIdToJoin);
  return;
 }
}

// PeerJS ID Display
peer.on('open', id => {
 myIdDisplay.textContent = `Your ID: ${id}`;
 init();
});

// Handle incoming call
peer.on('call', call => {
 getMediaStream().then(stream => {
  localStream = stream;
  localVideo.srcObject = stream;
  
  call.answer(localStream);
  setupCallEvents(call);
  showToast('Incoming call.');
 }).catch(err => {
  showToast('Error accessing media devices.', 'error');
 });
});

peer.on('disconnected', () => {
 showToast('Connection lost. Trying to reconnect...');
 peer.reconnect();
});

peer.on('close', () => {
 showToast('Connection closed.');
 cleanupCall();
});

peer.on('error', err => {
 console.error('Peer error:', err);
 showToast('A peer error occurred.', 'error');
});

// Call a peer
function callPeer(peerId = "ask") {
 const remoteId = peerId === "ask" ? prompt("Enter peer ID to call:") : peerId;
 if (!remoteId) return;
 
 getMediaStream().then(stream => {
  localStream = stream;
  localVideo.srcObject = stream;
  
  const call = peer.call(remoteId, localStream);
  setupCallEvents(call);
 }).catch(err => {
  showToast('Error accessing media devices.', 'error');
 });
}

// Setup call events
function setupCallEvents(call) {
 if (currentCall) currentCall.close();
 currentCall = call;
 
 call.on('stream', remoteStream => {
  remoteVideo.srcObject = remoteStream;
 });
 
 call.on('close', () => {
  endCall();
  showToast('Call ended.');
 });
 
 call.on('error', err => {
  showToast('An error occurred during the call.', 'error');
  endCall();
 });
}

// Get User Media
function getMediaStream() {
 return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
}

// Mute/Unmute mic
function toggleMute() {
 if (!localStream) return;
 audioEnabled = !audioEnabled;
 localStream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
 micIcon.className = audioEnabled ? 'ri-mic-line' : 'ri-mic-off-line';
 showToast(audioEnabled ? 'Microphone unmuted' : 'Microphone muted');
}

// Toggle camera
function toggleVideo() {
 if (!localStream) return;
 videoEnabled = !videoEnabled;
 localStream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
 videoIcon.className = videoEnabled ? 'ri-camera-line' : 'ri-camera-off-line';
 showToast(videoEnabled ? 'Camera on' : 'Camera off');
}

// End call & cleanup
function endCall() {
 if (currentCall) {
  currentCall.close();
  currentCall = null;
  showToast('Call disconnected');
 }
 
 if (localStream) {
  localStream.getTracks().forEach(track => track.stop());
  localStream = null;
 }
 
 localVideo.srcObject = null;
 remoteVideo.srcObject = null;
}