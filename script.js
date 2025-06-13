const baseUrl = window.location.origin + window.location.pathname;
const peer = new Peer(null, { debug: 3 });
let localStream;
let currentCall;
let lastBytesSent = 0;
let lastTimestamp = 0;
let connCheckupInterval = null;
let rtcObject = null;

// DOM Elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const micIcon = document.getElementById('micIcon');
const videoIcon = document.getElementById('videoIcon');
const QUALITY = document.getElementById('quality');
const RTT = document.getElementById('rtt');
const BITRATE = document.getElementById('bitrate');
const PACKETS = document.getElementById('packets');

let audioEnabled = true;
let videoEnabled = true;

// Add this once when initializing your app
toastContainer.addEventListener('click', (e) => {
 if (e.target.closest('.ai-btn')) {
  e.target.closest('div').remove();
 }
});

function showToast(message, type = 'info') {
 const toast = document.createElement('div');
 toast.className = `flex items-center gap-5 w-fit px-6 py-3 rounded-xl text-white text-sm shadow-lg ${
    type === 'error' ? 'bg-red-500' : 'bg-gray-800'
  } animate-fadeInOut`;
 toast.innerHTML = message + `<button class="ai-btn size-8 rounded-lg flex items-center justify-center text-white bg-white/10">
  <i class="ri-close-line"></i>
 </button>`;
 
 toastContainer.appendChild(toast);
 setTimeout(() => toast.remove(), 3000);
}

function updateIndicator(element, classes, text) {
 const nodes = element.children;
 
 if (nodes.length === 1) {
  nodes[0].textContent = text;
 } else {
  nodes[0].classList = classes;
  nodes[1].textContent = text;
 }
}

function toggleFullScreen() {
 if (currentCall && !document.fullscreenElement) {
  remoteVideo.requestFullscreen();
 } else {
  document.exitFullscreen?.();
 }
}

function shareLink() {
 const url = `https://nikhil-sha.github.io/Whispr/?peer=${peer.id}`;
 
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
 endCall();
});

peer.on('error', err => {
 console.error('Peer error:', err);
 showToast('A peer error occurred.', 'error');
});

// Call a peer
function callPeer(peerId = 'ask') {
 const remoteId = peerId === 'ask' ? prompt('Enter peer ID to call:') : peerId;
 if (!remoteId) {
  showToast('Failed to call', 'error');
  return;
 };
 
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
 
 rtcObject = call.peerConnection;
 if (connCheckupInterval) clearInterval(connCheckupInterval);
 connCheckupInterval = setInterval(updateConnectionQuality, 2000);
}

// Get User Media
function getMediaStream() {
 return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
}

// Mute/Unmute mic
function toggleMute() {
 if (!localStream) {
  showToast('You are not in a call.');
  return;
 };
 audioEnabled = !audioEnabled;
 localStream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
 micIcon.className = audioEnabled ? 'ri-mic-line' : 'ri-mic-off-line';
 showToast(audioEnabled ? 'Microphone unmuted' : 'Microphone muted');
}

// Toggle camera
function toggleVideo() {
 if (!localStream) {
  showToast('You are not in a call.');
  return
 };
 videoEnabled = !videoEnabled;
 localStream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
 videoIcon.className = videoEnabled ? 'ri-camera-line' : 'ri-camera-off-line';
 showToast(videoEnabled ? 'Camera on' : 'Camera off');
}

function updateConnectionQuality() {
 rtcObject.getStats(null).then(stats => {
  stats.forEach(report => {
   if (report.type === 'candidate-pair' && report.state === 'succeeded') {
    const rtt = report.currentRoundTripTime * 1000; // convert to ms
    
    if (rtt < 100) {
     updateIndicator(QUALITY, 'w-3 h-3 rounded-full bg-green-500 shadow-md animate-pulse', 'Excellent');
    } else if (rtt < 250) {
     updateIndicator(QUALITY, 'w-3 h-3 rounded-full bg-yellow-500 shadow-md animate-pulse', 'Good');
    } else if (rtt < 500) {
     updateIndicator(QUALITY, 'w-3 h-3 rounded-full bg-orange-500 shadow-md animate-pulse', 'Poor');
    } else {
     updateIndicator(QUALITY, 'w-3 h-3 rounded-full bg-red-500 shadow-md animate-pulse', 'Very Poor');
    }
    
    updateIndicator(RTT, null, `${rtt.toFixed(2)} ms`)
   }
   
   if (report.type === 'outbound-rtp' && report.kind === 'video') {
    const bytesSent = report.bytesSent;
    const now = report.timestamp;
    
    if (lastTimestamp) {
     const bitrate = 8 * (bytesSent - lastBytesSent) / ((now - lastTimestamp) / 1000); // bits/sec
     const kbps = (bitrate / 1000).toFixed(2);
     updateIndicator(BITRATE, null, `${kbps} kbps`);
    }
    
    lastBytesSent = bytesSent;
    lastTimestamp = now;
   }
   
   if (report.type === 'inbound-rtp' && report.kind === 'video') {
    updateIndicator(PACKETS, null, report.packetsLost)
   }
  });
 });
}

// End call & cleanup
function endCall() {
 if (localStream) {
  localStream.getTracks().forEach(track => track.stop());
  localStream = null;
 }
 
 localVideo.srcObject = null;
 remoteVideo.srcObject = null;
 
 if (currentCall) {
  currentCall.close();
  currentCall = null;
  showToast('Call disconnected');
 }
}