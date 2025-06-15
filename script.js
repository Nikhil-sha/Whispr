const baseUrl = window.location.origin + window.location.pathname;
const peer = new Peer(null, { debug: 3 });
let localStream;
let currentCall;
let lastBytesSent = 0;
let lastTimestamp = 0;
let connCheckupInterval = null;
let rtcObject = null;

// DOM Elements
const canvas = document.getElementById('canvas');
const localVideo = document.getElementById('localVideo');
const remoteAudio = document.getElementById('remoteAudio');
const remoteVideo = document.getElementById('remoteVideo');
const micIcon = document.getElementById('micIcon');
const videoIcon = document.getElementById('videoIcon');
const QUALITY = document.getElementById('quality');
const RTT = document.getElementById('rtt');
const BITRATE = document.getElementById('bitrate');
const PACKETS = document.getElementById('packets');

let audioEnabled = true;
let videoEnabled = true;
let prefFacingMode = 'user';

function showToast(message, type = 'info') {
 const duration = message.split(' ').length * 800;
 
 const toast = document.createElement('div');
 toast.className = `flex items-center gap-3 w-fit px-6 py-3 rounded-xl text-white text-sm shadow-lg ${
   type === 'error' ? 'bg-red-500' : 'bg-gray-800'
  }`;
 toast.style.animation = `fadeInOut ${duration - 100}ms ease forwards`;
 toast.innerHTML = message + `<button class="flex-shrink-0 ai-btn size-8 rounded-lg flex items-center justify-center text-white bg-white/10">
  <i class="ri-close-line"></i>
 </button>`;
 
 toastContainer.appendChild(toast);
 
 setTimeout(() => toast.remove(), duration);
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
 if (!document.fullscreenElement) {
  canvas.requestFullscreen();
 } else {
  document.exitFullscreen?.();
 }
}

function switchFacing() {
 showToast(`Camera Switched (${prefFacingMode === 'user' ? 'Back' : 'Front'}). Reconnection needed to apply changes.`);
 prefFacingMode = prefFacingMode === 'user' ? 'environment' : 'user';
}

function shareLink(type = 'url') {
 let content;
 
 if (navigator.share) {
  if (type === 'url') {
   content = {
    title: 'Join my Whispr call!',
    text: 'Click to connect with me:',
    url: `${baseUrl}?peer=${peer.id}`
   }
  } else {
   content = {
    title: 'Join me on Whispr!',
    text: `My Whispr instance: ${peer.id}`,
   }
  }
  navigator.share(content).then(() => {
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

peer.on('open', id => {
 init();
});

peer.on('call', call => {
 getMediaStream(prefFacingMode).then(stream => {
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

function callPeer(peerId = 'ask') {
 const remoteId = peerId === 'ask' ? prompt('Enter peer ID to call:') : peerId;
 if (!remoteId) {
  showToast('Failed to call', 'error');
  return;
 };
 
 getMediaStream(prefFacingMode).then(stream => {
  localStream = stream;
  localVideo.srcObject = stream;
  
  const call = peer.call(remoteId, localStream);
  setupCallEvents(call);
 }).catch(err => {
  showToast('Error accessing media devices.', 'error');
 });
}

function setupCallEvents(call) {
 if (currentCall) currentCall.close();
 currentCall = call;
 
 call.on('stream', remoteStream => {
  const videoTrack = remoteStream.getVideoTracks()[0];
  const videoStream = new MediaStream([videoTrack]);
  
  const audioTrack = remoteStream.getAudioTracks()[0];
  const audioStream = new MediaStream([audioTrack]);
  
  remoteVideo.srcObject = videoStream;
  remoteAudio.srcObject = audioStream;
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
 
 rtcObject.oniceconnectionstatechange = () => {
  if (rtcObject.iceConnectionState === 'disconnected' ||
   rtcObject.iceConnectionState === 'failed') {
   endCall();
   showToast('Connection lost with peer.');
  }
 };
}

async function getMediaStream(facingMode) {
 try {
  // First try with facingMode
  const stream = await navigator.mediaDevices.getUserMedia({
   video: { facingMode },
   audio: true
  });
  return stream;
 } catch (error) {
  showToast(`Couldn't get camera by facingMode (${facingMode}), trying device enumeration`, 'error');
  
  // Fallback to device enumeration
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(d => d.kind === 'videoinput');
  
  for (const device of videoDevices) {
   try {
    const stream = await navigator.mediaDevices.getUserMedia({
     video: { deviceId: { exact: device.deviceId } },
     audio: true
    });
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    
    if (!facingMode || settings.facingMode === facingMode) {
     return stream;
    }
    track.stop();
   } catch (e) {
    continue;
   }
  }
  
  showToast("No suitable camera found", 'error');
 }
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
 if (connCheckupInterval) {
  clearInterval(connCheckupInterval);
  connCheckupInterval = null;
 }
 
 if (localStream) {
  localStream.getTracks().forEach(track => track.stop());
  localStream = null;
 }
 
 localVideo.srcObject = null;
 remoteVideo.srcObject = null;
 remoteAudio.srcObject = null;
 
 if (currentCall) {
  try {
   currentCall.close();
  } catch (e) {
   console.warn('Error while closing call:', e);
  }
  currentCall = null;
 }
 
 lastBytesSent = 0;
 lastTimestamp = 0;
 rtcObject = null;
 
 showToast('Call ended');
}

toastContainer.addEventListener('click', (e) => {
 if (e.target.closest('.ai-btn')) {
  e.target.closest('div').remove();
 }
});

setTimeout(() => showToast('Warning: This service is under development, some features may break. Please avoid long sessions and use it responsibly!', 'error'), 1000);