/*
const savedPeerId = sessionStorage.getItem('whispr-peer-id') || generateId();
const peer = new Peer(savedPeerId, { debug: 3 });

let signal = null;
let modalId = null;
let modalCallbacks = null;
let overlayCallback = null;
let currentRoute = null;
let localStream = null;
let currentCall = null;
let lastBytesSent = 0;
let lastTimeStamp = 0;
let connCheckupInterval = null;
let callingTimeout = null;
let rtcObject = null;
let audioEnabled = true;
let videoEnabled = true;
let availableCameras = [];
let availableMicrophones = [];
let availableSpeakers = [];
let selectedCamera;
let selectedMic;
let selectedSpeaker;
let prefFacingMode = 'user';
let profileData = null;
let peerIdToCall = null;
let storedPeerList = null;
let callStartTime = null;
let callTimerInterval = null;

const urlRegEx = /^(https?|ftp):\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
const baseUrl = window.location.origin + window.location.pathname;
const overlay = document.getElementById('overlay');
const toastContainer = document.getElementById('toast-container');
const successToastTemp = document.getElementById('template-toast-success');
const errorToastTemp = document.getElementById('template-toast-error');
const infoToastTemp = document.getElementById('template-toast-info');
const sidebarEl = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('btn-open-sidebar');
const toggleThemeBtn = document.getElementById('btn-toggle-theme');
const modalEl = document.getElementById('modal');
const modalSpinner = document.getElementById('modal-spinner');
const modalHeading = document.getElementById('modal-heading');
const modalText = document.getElementById('modal-text');
const modalCloseBtn = document.getElementById('btn-close-modal');
const modalCancelBtn = document.getElementById('btn-cancel-modal');
const modalConfirmBtn = document.getElementById('btn-confirm-modal');
const viewEls = document.getElementById('views').children;
const viewNavBtns = document.getElementById('view-nav').children;
const localVideoEl = document.getElementById('call-video-local');
const remoteVideoEl = document.getElementById('call-video-remote');
const remoteAudioEl = document.getElementById('call-audio-remote');
const callControls = document.getElementById('call-controls-container').children;
const toggleMuteBtn = document.getElementById('btn-toggle-mute');
const toggleMaskBtn = document.getElementById('btn-toggle-mask');
const toggleFullscreenBtn = document.getElementById('btn-toggle-fullscreen');
const endCallBtn = document.getElementById('btn-end-call');
const selectCameraEl = document.getElementById('select-cameras');
const selectMicEl = document.getElementById('select-microphones');
const selectSpeakerEl = document.getElementById('select-speakers');
const profileForm = document.getElementById('form-update-profile');
const profileImages = document.querySelectorAll('img[data-profile-picture]');
const profileImageIcons = document.querySelectorAll('i[data-profile-placeholder]');
const shortNameEls = document.querySelectorAll('[data-name-short]');
const fullNameEls = document.querySelectorAll('[data-name-full]');
const statusHeadEls = document.querySelectorAll('[data-status-head]');
const statusTextEl = document.querySelector('[data-status-text]');
const callPeerBtn = document.getElementById('btn-call-peer');
const copyIdBtn = document.getElementById('btn-copy-id');
const shareUrlBtn = document.getElementById('btn-share-url');
const peerListContainer = document.getElementById('peer-list');
const currentPeerInfo = document.getElementById('current-peer-info');
const callDurationEl = document.querySelector('[data-call-duration]');
const connIndicatorEl = document.querySelector('[data-conn-indicator]');
const connLabelEl = document.querySelector('[data-conn-label]');
const connLatencyEl = document.querySelector('[data-conn-latency]');
const connJitterEl = document.querySelector('[data-conn-jitter]');
const connPacketsEl = document.querySelector('[data-conn-packets]');
const connBitrateEl = document.querySelector('[data-conn-bitrate]');

function isOverlayVisible() {
 return !overlay.classList.contains('hidden');
}

function isSidebarOpen() {
 return !sidebarEl.classList.contains('-translate-x-full');
}

function isModalVisible() {
 return !modalEl.classList.contains('hidden');
}

function getHash() {
 return location.hash.slice(2);
}

function isUrl(url) {
 return urlRegEx.test(url);
}

function getLabelById(devices, id) {
 return devices.find(d => d.deviceId === id).label || 'Unknown';
}

function getDateAndTime(date = new Date()) {
 const weekday = date.toLocaleString('en-IN', { weekday: 'short' });
 const month = date.toLocaleString('en-IN', { month: 'short' });
 const day = String(date.getDate()).padStart(2, '0');
 const year = date.getFullYear();
 
 const time = date.toLocaleTimeString('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
 });
 
 return `${weekday} ${month} ${day} ${year}, ${time}`;
}

function fillOptions(element, array) {
 element.innerHTML = '';
 array.forEach(device => {
  const opt = document.createElement('option');
  opt.value = device.deviceId;
  opt.text = device.label;
  element.appendChild(opt);
 });
};

function fadeEnter(element, opacity = 0) {
 if (element.classList.contains('hidden')) return;
 
 if (opacity <= 1) {
  element.style.opacity = opacity;
  const newOpacity = opacity + 0.05;
  requestAnimationFrame(() => fadeEnter(element, newOpacity));
 }
}

function toggleFullScreen() {
 if (!document.fullscreenElement) {
  viewEls[1].firstElementChild.requestFullscreen();
 } else {
  document.exitFullscreen();
 }
}

function toggleTheme() {
 let prefTheme = localStorage.getItem('whispr-theme') || 'light';
 
 if (prefTheme === 'light') {
  document.documentElement.classList.add('dark');
  prefTheme = 'dark';
 } else {
  document.documentElement.classList.remove('dark');
  prefTheme = 'light';
 }
 
 localStorage.setItem('whispr-theme', prefTheme);
 createToast('success', 'Theme switched!', `Changed theme preference to ${prefTheme}.`);
}

function setOverlay(state) {
 switch (state) {
  case 'visible':
   if (!isOverlayVisible()) overlay.classList.remove('hidden');
   if (overlayCallback) overlay.addEventListener('click', overlayCallback);
   break;
   
  case 'hidden':
   if (isOverlayVisible()) overlay.classList.add('hidden');
   if (overlayCallback) {
    overlay.removeEventListener('click', overlayCallback);
    overlayCallback = null;
   }
   break;
   
  default:
   isOverlayVisible() ? setOverlay('hidden') : setOverlay('visible');
 }
}

function createToast(type, heading, text) {
 let toastEl;
 
 switch (type) {
  case 'success':
   toastEl = successToastTemp.content.cloneNode(true).firstElementChild;
   break;
   
  case 'error':
   toastEl = errorToastTemp.content.cloneNode(true).firstElementChild;
   break;
   
  default:
   toastEl = infoToastTemp.content.cloneNode(true).firstElementChild;
 }
 
 toastEl.querySelector('h4').textContent = heading;
 toastEl.querySelector('p').textContent = text;
 toastContainer.appendChild(toastEl);
 
 setTimeout(() => {
  toastEl.classList.replace('animate-fadeInUp', 'animate-fadeOutUp');
  
  setTimeout(() => toastEl.remove(), 320);
 }, 5000);
}

function showModal(id, heading, text, confirmCallback, cancelCallback = null, spinner = false) {
 modalId = id;
 modalHeading.textContent = heading;
 modalText.textContent = text;
 
 if (modalCallbacks) {
  modalCancelBtn.removeEventListener('click', modalCallbacks.cancel);
  modalConfirmBtn.removeEventListener('click', modalCallbacks.confirm);
 }
 
 if (isSidebarOpen()) {
  setSidebar('close');
 }
 
 modalCallbacks = {
  confirm: () => {
   if (confirmCallback) confirmCallback();
   closeModal();
  },
  cancel: () => {
   if (cancelCallback) cancelCallback();
   closeModal();
  }
 };
 
 modalCancelBtn.classList.toggle('hidden', !cancelCallback);
 
 modalConfirmBtn.addEventListener('click', modalCallbacks.confirm);
 if (cancelCallback) {
  modalCancelBtn.addEventListener('click', modalCallbacks.cancel);
 }
 
 modalSpinner.classList.toggle('hidden', !spinner);
 modalEl.classList.remove('hidden');
 setOverlay('visible');
}

function closeModal() {
 if (!isModalVisible()) return;
 
 if (modalCallbacks) {
  modalCancelBtn.removeEventListener('click', modalCallbacks.cancel);
  modalConfirmBtn.removeEventListener('click', modalCallbacks.confirm);
  modalCallbacks = null;
 }
 
 modalEl.classList.add('hidden');
 setOverlay('hidden');
}

function closeModalById(id) {
 if (!id) return;
 if (id === modalId) {
  closeModal();
 }
}

function setSidebar(state) {
 switch (state) {
  case 'open':
   if (!isSidebarOpen()) {
    sidebarEl.classList.remove('-translate-x-full');
    overlayCallback = () => setSidebar('close');
    setOverlay('visible');
   }
   break;
   
  case 'close':
   if (isSidebarOpen()) {
    sidebarEl.classList.add('-translate-x-full');
    setOverlay('hidden');
   }
   break;
   
  default:
   isSidebarOpen() ? setSidebar('close') : setSidebar('open');
 }
}

function initPeerList() {
 const list = JSON.parse(localStorage.getItem('whispr-peer-list'));
 
 // Clear the container first
 peerListContainer.innerHTML = '';
 
 if (!list || !Array.isArray(list)) {
  return;
 }
 
 list.forEach(item => {
  const itemContainer = document.createElement('div');
  itemContainer.className = 'flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors duration-150';
  
  itemContainer.innerHTML = `
  <div class="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
   ${item.profilePicture ? `<img class="object-cover w-full h-full rounded-full" src="${item.profilePicture}" alt="profile picture">` : '<i class="fas fa-user text-surface-600 dark:text-surface-300 text-xs"></i>'}
  </div>
  <div class="flex-1 inline-flex flex-col min-w-0">
   <p class="text-sm leading-tight font-medium text-surface-900 dark:text-surface-100 truncate">${item.name || 'Anonymous'}</p>
   <span class="text-xs leading-tight text-surface-500 dark:text-surface-400">${item.time || ''}</span>
  </div>
  `;
  
  peerListContainer.prepend(itemContainer);
  
  itemContainer.addEventListener('click', () => {
   callPeer(item.id);
  }, { signal });
 });
}

function updateCurrentPeer(type, name, imageUrl) {
 const currentInfoContainer = currentPeerInfo.closest('details');
 const peerImage = currentPeerInfo.querySelector('div');
 const peerName = currentPeerInfo.querySelector('p');
 
 switch (type) {
  case 'reset':
   peerImage.innerHTML = '';
   peerName.textContent = '';
   
   if (!currentInfoContainer.classList.contains('hidden')) {
    currentInfoContainer.classList.add('hidden');
   }
   break;
   
  default:
   peerImage.innerHTML = imageUrl !== null || imageUrl !== '' ?
    `<img class="object-cover w-full h-full" src="${imageUrl}" alt="peer profile picture">` :
    '<i class="fas fa-user text-surface-600 dark:text-surface-300 text-xs"></i>';
   peerName.textContent = name;
   
   if (currentInfoContainer.classList.contains('hidden')) {
    currentInfoContainer.classList.remove('hidden');
   }
 }
}

function updatePeerList(newPeer) {
 if (typeof newPeer !== 'object' || newPeer === null) {
  return;
 }
 
 storedPeerList = JSON.parse(localStorage.getItem('whispr-peer-list')) || [];
 
 if (storedPeerList.length > 6) {
  storedPeerList.shift();
 }
 storedPeerList.push(newPeer);
 
 localStorage.setItem('whispr-peer-list', JSON.stringify(storedPeerList));
 
 initPeerList();
}

function resolveRouter(route = null) {
 const hash = typeof route === 'string' && route !== null ?
  (location.hash = `#/${route}`, route) :
  getHash() || 'home';
 
 if (hash === currentRoute) return;
 
 currentRoute = hash;
 
 for (const view of viewEls) {
  if (view.id === hash) {
   view.style.opacity = 0;
   view.classList.remove('hidden');
   fadeEnter(view);
  } else {
   view.classList.add('hidden');
  }
 }
}

function updateProfilePicture(type, url) {
 switch (type) {
  case 'reset':
   profileImages.forEach(image => {
    if (!image.classList.contains('hidden')) {
     image.classList.add('hidden');
     image.src = '';
    }
   });
   
   profileImageIcons.forEach(imageIcon => {
    if (imageIcon.classList.contains('hidden')) {
     imageIcon.classList.remove('hidden');
    }
   });
   break;
   
  case 'set':
   if (!url) {
    updateProfilePicture('reset');
    return;
   }
   
   profileImages.forEach(image => {
    if (image.classList.contains('hidden')) {
     image.classList.remove('hidden');
    }
   });
   
   profileImageIcons.forEach(imageIcon => {
    if (!imageIcon.classList.contains('hidden')) {
     imageIcon.classList.add('hidden');
    }
   });
   
   profileImages.forEach(image => image.src = url);
   break;
 }
}

function initProfile() {
 profileData = JSON.parse(localStorage.getItem('whispr-profile'));
 
 if (!profileData) {
  profileForm.name.value = '';
  profileForm.profilePicture.value = '';
  
  updateProfilePicture('reset');
  
  fullNameEls.forEach(el => {
   el.textContent = 'Anonymous';
  });
  
  shortNameEls.forEach(el => {
   el.textContent = 'there';
  });
  return;
 }
 
 profileForm.name.value = profileData.name;
 profileForm.profilePicture.value = profileData.profilePicture;
 
 updateProfilePicture('set', profileData.profilePicture);
 
 fullNameEls.forEach(el => {
  el.textContent = profileData.name ? profileData.name : 'Anonymous';
 });
 
 shortNameEls.forEach(el => {
  el.textContent = profileData.name.includes(' ') ? profileData.name.split(' ')[0] : profileData.name;
 });
}

function updateProfile(e) {
 e.preventDefault();
 
 if (!isUrl(this.profilePicture.value)) {
  createToast('error', 'Invalid profile image url!', 'Entered url for profile image is not valid.');
  return;
 }
 
 profileData = {
  name: this.name.value || 'Anonymous',
  profilePicture: this.profilePicture.value || null,
 };
 
 localStorage.setItem('whispr-profile', JSON.stringify(profileData));
 initProfile();
 createToast('success', 'Profile Updated!', 'But! Be mindful of the information you enter.');
}

function deleteProfile() {
 showModal(
  'delete_profile',
  "Delete Profile",
  "Are you sure you want to delete your profile information?",
  () => {
   localStorage.removeItem('whispr-profile');
   profileData = null;
   initProfile();
   createToast('info', 'Warning!', 'User Information deleted.');
  }
 );
}

async function getAvailableMediaDevices() {
 // Ensure permission to get labels
 const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
 tempStream.getTracks().forEach(t => t.stop());
 
 const devices = await navigator.mediaDevices.enumerateDevices();
 
 devices.forEach(d => {
  const data = {
   label: d.label,
   deviceId: d.deviceId
  };
  if (d.kind === 'videoinput') availableCameras.push(data);
  else if (d.kind === 'audioinput') availableMicrophones.push(data);
  else if (d.kind === 'audiooutput') availableSpeakers.push(data);
 });
 
 navigator.mediaDevices.ondevicechange = () => {
  createToast('info', 'Device list changed!', 'A change was detected in media devices.');
  getAvailableMediaDevices();
 };
 
 fillOptions(selectCameraEl, availableCameras);
 fillOptions(selectMicEl, availableMicrophones);
 fillOptions(selectSpeakerEl, availableSpeakers);
 
 selectedCamera = selectCameraEl.value;
 selectedMic = selectMicEl.value;
 selectedSpeaker = selectCameraEl.value;
}

async function getMediaStream(preferredVideoId, preferredAudioId) {
 try {
  const constraints = {
   video: preferredVideoId ? { deviceId: { exact: preferredVideoId } } : true,
   audio: preferredAudioId ? { deviceId: { exact: preferredAudioId } } : true
  };
  
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  return stream;
 } catch (error) {
  createToast('error', 'Media access failed!', 'Trying fallback devices...');
  
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(d => d.kind === 'videoinput');
  const audioDevices = devices.filter(d => d.kind === 'audioinput');
  
  // Try any working video+audio combo
  for (const video of videoDevices) {
   for (const audio of audioDevices) {
    try {
     const fallbackStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: video.deviceId } },
      audio: { deviceId: { exact: audio.deviceId } }
     });
     return fallbackStream;
    } catch (e) {
     continue;
    }
   }
  }
  
  throw new Error('No working camera or mic found');
 }
}

function generateId() {
 const prefix = 'whispr-';
 const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
 const segments = [6, 6, 6];
 
 let id = prefix;
 
 for (let i = 0; i < segments.length; i++) {
  for (let j = 0; j < segments[i]; j++) {
   id += chars[Math.floor(Math.random() * chars.length)];
  }
  if (i < segments.length - 1) id += '-';
 }
 
 sessionStorage.setItem('whispr-peer-id', id);
 return id;
}

async function shareId(type = 'url') {
 try {
  if (!peer.id) {
   createToast('error', 'Peer ID not available', 'Peer.js is not initialised yet. Refresh the page if this issue persists.');
   return;
  }
  
  if (type === 'url') {
   const shareData = {
    title: 'Join my Whispr call!',
    text: 'Click to connect with me:',
    url: `${baseUrl}?peer=${peer.id}`
   };
   
   try {
    await navigator.share(shareData);
    createToast('success', 'Link shared!', 'Wait for the person to join.');
   } catch {
    await navigator.clipboard.writeText(shareData.url);
    createToast('error', 'Share failed!', 'Url copied to your clipboard. Share the url.');
   }
  } else {
   await navigator.clipboard.writeText(peer.id);
   createToast('success', 'Copied!', 'Share the ID');
  }
 } catch (err) {
  const text = type === 'url' ? `${baseUrl}?peer=${peer.id}` : peer.id;
  createToast('error', 'Share failed', 'Try copying manually');
  if (text) createToast('info', 'Copy this!', text);
 }
}

async function callPeer(peerId) {
 if (currentCall) {
  showModal(
   'new_call',
   "New Call!",
   "You're already in a call. End current call?",
   async () => {
    cleanupCallResources();
    await initiateNewCall(peerId);
   }
  );
  return;
 }
 await initiateNewCall(peerId);
}

async function initiateNewCall(peerId) {
 try {
  const remoteId = peerId || prompt('Enter peer ID to call:');
  if (!remoteId) throw new Error('No ID provided');
  
  const stream = await getMediaStream(selectedCamera, selectedMic);
  localStream = stream;
  localVideoEl.srcObject = stream;
  
  const call = peer.call(remoteId, stream, { metadata: profileData });
  setupCallEvents(call);
  showModal(
   'calling',
   "Calling…",
   "Wait a moment! Connecting your call.",
   () => {
    cleanupCallResources();
   },
   null,
   true
  );
  callingTimeout = setTimeout(() => {
   cleanupCallResources();
   // setStatus(false);
   closeModalById('calling');
  }, 30000);
 } catch (err) {
  createToast('error', 'Call failed', err.message);
 }
}

async function checkConnection() {
 if (!rtcObject) {
  console.warn("No RTCPeerConnection provided!");
  return;
 }
 
 const scoreMetric = (value, { good, bad }) => {
  if (value == null) return 0;
  if (value < good) return 4;
  if (value < bad) return 2;
  if (value > bad) return 1;
  return 0;
 };
 
 const stats = await rtcObject.getStats();
 let selectedPairId = null;
 let quality = {
  rtt: null,
  jitter: null,
  packetsLost: null,
  bitrateSend: null,
 };
 
 stats.forEach(stat => {
  if (stat.type === "transport" && stat.selectedCandidatePairId) {
   selectedPairId = stat.selectedCandidatePairId;
  }
 });
 
 stats.forEach(stat => {
  if (stat.type === "candidate-pair" && stat.id === selectedPairId) {
   quality.rtt = stat.currentRoundTripTime * 1000;
  }
  
  if (stat.type === "inbound-rtp" && !stat.isRemote) {
   if (stat.kind === "audio" || stat.kind === "video") {
    quality.jitter = stat.jitter * 1000;
    quality.packetsLost = stat.packetsLost;
   }
  }
  
  if (stat.type === "outbound-rtp" && !stat.isRemote) {
   if (stat.kind === "audio" || stat.kind === "video") {
    quality.bitrateSend = stat.bytesSent;
   }
  }
 });
 
 // Calculate scores
 const scores = {
  rtt: scoreMetric(quality.rtt, { good: 100, bad: 300 }),
  jitter: scoreMetric(quality.jitter, { good: 15, bad: 30 }),
  loss: scoreMetric(quality.packetsLost, { good: 1, bad: 50 }),
  bitrate: scoreMetric(quality.bitrateSend, { good: 250000, bad: 80000 }),
 };
 
 connBitrateEl.textContent = quality.bitrateSend;
 connJitterEl.textContent = quality.jitter;
 connLatencyEl.textContent = quality.rtt;
 connPacketsEl.textContent = quality.packetsLost;
 
 const totalScore = scores.rtt + scores.jitter + scores.loss + scores.bitrate;
 connIndicatorEl.className = 'absolute top-2 left-7 w-2 h-2 rounded-full bg-gray-400';
 connLabelEl.textContent = 'Unknown';
 
 if (totalScore >= 15) {
  connIndicatorEl.className = 'absolute top-2 left-7 w-2 h-2 rounded-full bg-green-500';
  connLabelEl.textContent = 'Excellent';
 } else if (totalScore >= 11) {
  connIndicatorEl.className = 'absolute top-2 left-7 w-2 h-2 rounded-full bg-yellow-500';
  connLabelEl.textContent = 'Good';
 } else if (totalScore >= 6) {
  connIndicatorEl.className = 'absolute top-2 left-7 w-2 h-2 rounded-full bg-orange-500';
  connLabelEl.textContent = 'Fair';
 } else {
  connIndicatorEl.className = 'absolute top-2 left-7 w-2 h-2 rounded-full bg-red-500';
  connLabelEl.textContent = 'Poor';
 }
}

function setInCallInteractions(boolean) {
 for (let button of callControls) {
  button.disabled = !boolean;
 }
}

function cleanupCallResources() {
 // Stop media tracks
 if (localStream) {
  localStream.getTracks().forEach(track => track.stop());
  localStream = null;
 }
 
 audioEnabled = true;
 videoEnabled = true;
 
 // Clear video elements
 localVideoEl.srcObject = null;
 remoteVideoEl.srcObject = null;
 remoteAudioEl.srcObject = null;
 
 // Clear connection monitoring
 if (connCheckupInterval) {
  clearInterval(connCheckupInterval);
  connCheckupInterval = null;
 }
 
 if (callingTimeout) {
  clearInterval(callingTimeout);
  callingTimeout = null;
 }
 
 if (callTimerInterval) {
  stopCallTimer();
  callTimerInterval = null;
 }
 
 if (currentCall) {
  currentCall.close();
  updateCurrentPeer('reset');
  createToast('info', 'Call ended', 'The call has been disconnected');
 }
 
 // Reset call state
 currentCall = null;
 rtcObject = null;
 
 setInCallInteractions(false);
 resolveRouter('home');
 // setStatus(false);
}

function endCall() {
 showModal(
  'end_call',
  "End Call",
  "Are you sure you want to end the current call?",
  () => {
   cleanupCallResources();
  }
 );
}

function toggleMute() {
 if (!localStream) {
  createToast('info', 'No active call!', 'You are not in a call');
  return;
 }
 
 audioEnabled = !audioEnabled;
 localStream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
 createToast('success',
  audioEnabled ? 'Microphone on' : 'Microphone off',
  audioEnabled ? 'Microphone enabled' : 'Microphone disabled');
 this.querySelector('i').className = `fas ${audioEnabled ? 'fa-microphone' : 'fa-microphone-slash'} text-base`;
}

function toggleMask() {
 if (!localStream) {
  createToast('info', 'No active call!', 'You are not in a call');
  return;
 }
 
 videoEnabled = !videoEnabled;
 localStream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
 createToast('success',
  videoEnabled ? 'Camera on' : 'Camera off',
  videoEnabled ? 'Camera enabled' : 'Camera disabled');
 this.querySelector('i').className = `fas ${videoEnabled ? 'fa-video' : 'fa-video-slash'} text-base`;
}

function startCallTimer() {
 callStartTime = Date.now();
 
 callTimerInterval = setInterval(() => {
  const elapsed = Date.now() - callStartTime;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  callDurationEl.textContent =
   `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
 }, 1000);
}

function stopCallTimer() {
 clearInterval(callTimerInterval);
 callTimerInterval = null;
 callDurationEl.textContent = "00:00";
}

function setupCallEvents(call) {
 if (callingTimeout) {
  clearInterval(callingTimeout);
  callingTimeout = null;
 }
 
 if (currentCall) currentCall.close();
 currentCall = call;
 rtcObject = call.peerConnection;
 
 call.on('stream', remoteStream => {
  // if (callingTimeout) {
  //  clearInterval(callingTimeout);
  //  callingTimeout = null;
  // }
  // setStatus(false);
  closeModalById('calling');
  startCallTimer();
  
  const videoStream = new MediaStream([remoteStream.getVideoTracks()[0]]);
  const audioStream = new MediaStream([remoteStream.getAudioTracks()[0]]);
  
  remoteVideoEl.srcObject = videoStream;
  remoteAudioEl.srcObject = audioStream;
  
  if ('setSinkId' in remoteAudioEl && selectedSpeaker) {
   try {
    remoteAudioEl.setSinkId(selectedSpeaker);
    console.log('Speaker switched to:', selectedSpeaker);
   } catch (err) {
    console.warn('Speaker switching failed:', err);
   }
  }
 });
 
 call.on('close', cleanupCallResources);
 rtcObject.oniceconnectionstatechange = () => {
  if (rtcObject.iceConnectionState === 'disconnected') {
   cleanupCallResources();
  }
 };
 call.on('error', () => {
  createToast('error', 'Call error!', 'An error occurred');
  cleanupCallResources();
 });
 
 if (connCheckupInterval) clearInterval(connCheckupInterval);
 
 connCheckupInterval = setInterval(() => {
  checkConnection();
 }, 2000);
 
 setInCallInteractions(true);
 resolveRouter('call');
}

function setupPeerEventListeners() {
 peer.on('open', id => {
  // setStatus(false);
  closeModalById('initializing');
  closeModalById('disconnected');
  
  createToast('info', 'Id generated!', `Your session ID: ${id}`);
  
  const params = new URLSearchParams(window.location.search);
  if (params.has('peer')) callPeer(params.get('peer'));
 });
 
 peer.on('call', call => {
  const answerCall = () => {
   const time = getDateAndTime();
   const peerInfo = {
    time,
    id: call.peer,
    ...call.metadata
   };
   updatePeerList(peerInfo);
   getMediaStream(selectedCamera, selectedMic)
    .then(stream => {
     localStream = stream;
     localVideoEl.srcObject = stream;
     
     resolveRouter('call');
     updateCurrentPeer('set', peerInfo.name, peerInfo.profilePicture);
     call.answer(stream);
     // setStatus(true, "Waiting...", `Connecting you to ${peerInfo.name || 'Anonymous'}`, true);
     
     const dataConn = peer.connect(call.peer);
     
     dataConn.on('open', () => {
      dataConn.send({
       type: 'metadata',
       ...profileData
      });
      
      setTimeout(() => {
       if (dataConn.open) dataConn.close();
      }, 1000);
     });
     
     setupCallEvents(call);
     createToast('success', 'Call answered!', 'Connected with caller');
    })
    .catch(() => {
     createToast('error', 'Call failed', 'Could not access media devices');
    });
  };
  
  const rejectCall = () => {
   createToast('info', 'Call declined', 'You declined the incoming call');
   // If we want to formally reject in PeerJS:
   call.answer();
   setTimeout(() => call.close(), 1000);
  };
  
  showModal(
   'incoming_call',
   'Incoming call!',
   `${call.metadata.name || call.peer} is calling`,
   answerCall,
   rejectCall
  );
 });
 
 peer.on('connection', conn => {
  conn.on('data', data => {
   if (data.type === 'metadata') {
    const time = getDateAndTime();
    updatePeerList({
     time,
     id: conn.peer,
     ...data
    });
    
    updateCurrentPeer('set', data.name, data.profilePicture);
   }
  });
 });
 
 peer.on('disconnected', () => {
  // setStatus(true, "Disconnected!", "Trying to reconnect...", true);
  showModal(
   'disconnected',
   "Disconnected!",
   "Trying to reconnect...",
   null,
   null,
   true
  );
  cleanupCallResources()
  // createToast('info', 'Disconnected', 'Reconnecting...');
  peer.reconnect();
 });
 
 peer.on('close', () => {
  // setStatus(true, "Signed Out!", "Refresh to create new session.", false);
  showModal(
   'signed_out',
   "Signed Out!",
   "Refresh to create new session.",
  );
  // createToast('info', 'Signed out', '');
  cleanupCallResources();
 });
 
 peer.on('error', err => {
  cleanupCallResources();
  createToast('error', 'Connection error', 'A peer error occurred');
 });
}

function cleanupApp() {
 // Cleanup calls first
 cleanupCallResources();
 
 // Cleanup peer connection
 if (peer && !peer.destroyed) {
  peer.destroy();
  // setStatus(true, "Signed Out!", "Refresh to create new session.", false);
  showModal(
   'signed_out',
   "Signed Out!",
   "Refresh to create new session.",
  );
 }
 
 // Abort all event listeners
 if (controller) {
  controller.abort();
 }
}

function createPeerWithRetry(peerId, options = {}, maxRetries = 3, retryDelay = 1000) {
 return new Promise((resolve, reject) => {
  let attempts = 0;
  
  const tryCreatePeer = () => {
   const peer = new Peer(peerId, options);
   
   peer.on('open', () => {
    console.log(`Peer connected successfully with ID: ${peer.id}`);
    resolve(peer);
   });
   
   peer.on('error', (err) => {
    if (err.type === 'unavailable-id' && attempts < maxRetries) {
     attempts++;
     console.warn(`ID "${peerId}" unavailable. Retrying (${attempts}/${maxRetries})...`);
     setTimeout(tryCreatePeer, retryDelay);
    } else {
     reject(new Error(`Failed to create Peer: ${err.message}`));
    }
   });
  };
  
  tryCreatePeer();
 });
}

async function main() {
 controller = new AbortController();
 signal = controller.signal;
 
 // Initialize theme
 if (localStorage.getItem('whispr-theme') === 'dark') {
  document.documentElement.classList.add('dark');
 }
 
 // Setup event listeners
 callPeerBtn.addEventListener('click', () => {
  peerIdToCall = document.getElementById('input-peer-id').value;
  
  if (peerIdToCall) {
   callPeer(peerIdToCall);
  } else {
   createToast('error', 'No Peer Id!', 'Enter a Peer id to call.');
  }
 }, { signal });
 
 modalCloseBtn.addEventListener('click', closeModal, { signal });
 openSidebarBtn.addEventListener('click', setSidebar, { signal });
 toggleThemeBtn.addEventListener('click', toggleTheme, { signal });
 
 toggleMuteBtn.addEventListener('click', toggleMute, { signal });
 toggleMaskBtn.addEventListener('click', toggleMask, { signal });
 toggleFullscreenBtn.addEventListener('click', toggleFullScreen, { signal });
 endCallBtn.addEventListener('click', endCall, { signal });
 
 copyIdBtn.addEventListener('click', () => {
  shareId('id');
 }, { signal });
 shareUrlBtn.addEventListener('click', () => {
  shareId('url');
 }, { signal });
 
 Array.from(viewNavBtns).forEach(button => {
  button.addEventListener('click', () => resolveRouter(button.dataset.page), { signal });
 });
 
 selectCameraEl.addEventListener('change', function() {
  selectedCamera = this.value;
  createToast('success', 'Camera preference changed!', `All of your new calls will use the selected camera: ${getLabelById(availableCameras, selectedCamera)}`);
 }, { signal });
 
 selectMicEl.addEventListener('change', function() {
  selectedMic = this.value;
  createToast('success', 'Microphone preference changed!', `All of your new calls will use the selected microphone: ${getLabelById(availableMicrophones, selectedMic)}`);
 }, { signal });
 
 selectSpeakerEl.addEventListener('change', function() {
  selectedSpeaker = this.value;
  createToast('success', 'Camera preference changed!', `All of your new calls will use the selected speaker: ${getLabelById(availableSpeakers, selectedSpeaker)}`);
 }, { signal });
 
 profileForm.addEventListener('reset', deleteProfile, { signal });
 profileForm.addEventListener('submit', updateProfile, { signal });
 
 window.addEventListener('online', () => {
  createToast('success', 'Online', 'You are back online');
 }, { signal });
 
 window.addEventListener('offline', () => {
  createToast('error', 'Offline', 'Check your connection');
 }, { signal });
 
 document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === 'visible') {
   createToast('info', 'Welcome back', 'Where did you go?');
  }
 }, { signal });
 
 window.addEventListener('hashchange', resolveRouter, { signal });
 
 // Initialize app
 setInCallInteractions(false);
 setupPeerEventListeners();
 initPeerList();
 initProfile();
 resolveRouter('home');
 updateCurrentPeer('reset');
 getAvailableMediaDevices();
 
 // setStatus(true, "Initializing...", "Loading necessary dependencies", true);
 showModal(
  'initializing',
  "Initializing...",
  "Loading necessary dependencies.",
  null,
  null,
  true
 );
}

// Event listeners for cleanup
window.addEventListener('DOMContentLoaded', main);
window.addEventListener('beforeunload', cleanupApp);
*/


const savedPeerId = localStorage.getItem('whispr-peer-id') || generateId(),
 peer = new Peer(savedPeerId, { debug: 1 }),
 urlRegEx = /^(https?|ftp):\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/,
 drawing = {
  sendDrawingInterval: 35,
  lastPointSentAt: 0,
  minMoveDiff: 2,
  isDrawing: false,
  lastDrawn: null,
  drawnStrokes: [],
  currentStroke: null,
  brushAlphaVal: 255,
  currentDrawingTool: 'pen',
  canvasTranslation: [0, 0, 1]
 },
 baseUrl = window.location.origin + window.location.pathname,
 overlay = document.getElementById('overlay'),
 toastContainer = document.getElementById('toast-container'),
 successToastTemp = document.getElementById('template-toast-success'),
 errorToastTemp = document.getElementById('template-toast-error'),
 infoToastTemp = document.getElementById('template-toast-info'),
 sidebarEl = document.getElementById('sidebar'),
 openSidebarBtn = document.getElementById('btn-open-sidebar'),
 toggleThemeBtn = document.getElementById('btn-toggle-theme'),
 modalEl = document.getElementById('modal'),
 modalSpinner = document.getElementById('modal-spinner'),
 modalHeading = document.getElementById('modal-heading'),
 modalText = document.getElementById('modal-text'),
 modalCloseBtn = document.getElementById('btn-close-modal'),
 modalCancelBtn = document.getElementById('btn-cancel-modal'),
 modalConfirmBtn = document.getElementById('btn-confirm-modal'),
 viewEls = document.getElementById('views').children,
 viewNavBtns = document.getElementById('view-nav').children,
 localVideoEl = document.getElementById('call-video-local'),
 remoteVideoEl = document.getElementById('call-video-remote'),
 remoteAudioEl = document.getElementById('call-audio-remote'),
 callControls = document.getElementById('call-controls-container').children,
 toggleMuteBtn = document.getElementById('btn-toggle-mute'),
 toggleMaskBtn = document.getElementById('btn-toggle-mask'),
 toggleFullscreenBtn = document.getElementById('btn-toggle-fullscreen'),
 endCallBtn = document.getElementById('btn-end-call'),
 selectCameraEl = document.getElementById('select-cameras'),
 selectMicEl = document.getElementById('select-microphones'),
 selectSpeakerEl = document.getElementById('select-speakers'),
 profileForm = document.getElementById('form-update-profile'),
 profileImages = document.querySelectorAll('img[data-profile-picture]'),
 profileImageIcons = document.querySelectorAll('i[data-profile-placeholder]'),
 shortNameEls = document.querySelectorAll('[data-name-short]'),
 fullNameEls = document.querySelectorAll('[data-name-full]'),
 statusHeadEls = document.querySelectorAll('[data-status-head]'),
 statusTextEl = document.querySelector('[data-status-text]'),
 callPeerBtn = document.getElementById('btn-call-peer'),
 copyIdBtn = document.getElementById('btn-copy-id'),
 shareUrlBtn = document.getElementById('btn-share-url'),
 peerListContainer = document.getElementById('peer-list'),
 currentPeerInfo = document.getElementById('current-peer-info'),
 callDurationEl = document.querySelector('[data-call-duration]'),
 connIndicatorEl = document.querySelector('[data-conn-indicator]'),
 connLabelEl = document.querySelector('[data-conn-label]'),
 connLatencyEl = document.querySelector('[data-conn-latency]'),
 connJitterEl = document.querySelector('[data-conn-jitter]'),
 connPacketsEl = document.querySelector('[data-conn-packets]'),
 connBitrateEl = document.querySelector('[data-conn-bitrate]'),
 drawingBoardEl = document.getElementById('canvas'),
 drawingBoardContainer = drawingBoardEl.parentElement,
 drawingCtx = drawingBoardEl.getContext('2d'),
 brushColorEl = document.getElementById('strokeColor'),
 brushAlphaEl = document.getElementById('strokeAlpha'),
 strokeSizeEl = document.getElementById('strokeSize'),
 brushToolEl = document.getElementById('paintbrush'),
 eraserToolEl = document.getElementById('eraser'),
 eraserSizeEl = document.getElementById('eraserSize'),
 clearCanvasBtn = document.getElementById('clearCanvas'),
 undoStrokeBtn = document.getElementById('undoStroke'),
 downloadCanvasBtn = document.getElementById('downloadCanvas');

let signal = null,
 modalId = null,
 modalCallbacks = null,
 overlayCallback = null,
 currentRoute = null,
 localStream = null,
 currentCall = null,
 currentDataConn = null,
 lastBytesSent = 0,
 lastTimeStamp = 0,
 connCheckupInterval = null,
 callingTimeout = null,
 rtcObject = null,
 audioEnabled = true,
 videoEnabled = true,
 availableCameras = [],
 availableMicrophones = [],
 availableSpeakers = [],
 selectedCamera = null,
 selectedMic = null,
 selectedSpeaker = null,
 profileData = null,
 peerIdToCall = null,
 storedPeerList = null,
 callStartTime = null,
 callTimerInterval = null,
 controller = null;

function isOverlayVisible() {
 return !overlay.classList.contains('hidden');
}

function isSidebarOpen() {
 return !sidebarEl.classList.contains('-translate-x-full');
}

function isModalVisible() {
 return !modalEl.classList.contains('hidden');
}

function getHash() {
 return location.hash.slice(2);
}

function isUrl(url) {
 return urlRegEx.test(url);
}

function getLabelById(devices, id) {
 const device = devices.find(d => d.deviceId === id);
 return device ? device.label || 'Unknown' : 'Unknown';
}

function getDateAndTime(date = new Date()) {
 const weekday = date.toLocaleString('en-IN', { weekday: 'short' });
 const month = date.toLocaleString('en-IN', { month: 'short' });
 const day = String(date.getDate()).padStart(2, '0');
 const year = date.getFullYear();
 
 const time = date.toLocaleTimeString('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
 });
 
 return `${weekday} ${month} ${day} ${year}, ${time}`;
}

function fillOptions(element, array) {
 element.innerHTML = '';
 array.forEach(device => {
  const opt = document.createElement('option');
  opt.value = device.deviceId;
  opt.text = device.label || 'Unknown';
  element.appendChild(opt);
 });
}

function fadeEnter(element, opacity = 0) {
 if (element.classList.contains('hidden')) return;
 
 if (opacity <= 1) {
  element.style.opacity = opacity;
  const newOpacity = opacity + 0.05;
  requestAnimationFrame(() => fadeEnter(element, newOpacity));
 }
}

function toggleFullScreen() {
 const icon = this.querySelector('i');
 if (!document.fullscreenElement) {
  viewEls[1].firstElementChild.requestFullscreen()
   .then(() => {
    icon.classList.remove('fa-expand');
    icon.classList.add('fa-compress');
   })
   .catch(err => {
    createToast('error', 'Fullscreen failed', err.message);
   });
 } else {
  document.exitFullscreen();
  icon.classList.remove('fa-compress');
  icon.classList.add('fa-expand');
 }
}

function toggleTheme() {
 const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
 let prefTheme = localStorage.getItem('whispr-theme') || (prefersDark ? 'dark' : 'light');
 
 if (prefTheme === 'light') {
  document.documentElement.classList.add('dark');
  prefTheme = 'dark';
 } else {
  document.documentElement.classList.remove('dark');
  prefTheme = 'light';
 }
 
 localStorage.setItem('whispr-theme', prefTheme);
 createToast('success', 'Theme switched!', `Changed theme preference to ${prefTheme}.`);
}

function setOverlay(state) {
 switch (state) {
  case 'visible':
   if (!isOverlayVisible()) overlay.classList.remove('hidden');
   if (overlayCallback) overlay.addEventListener('click', overlayCallback);
   break;
   
  case 'hidden':
   if (isOverlayVisible()) overlay.classList.add('hidden');
   if (overlayCallback) {
    overlay.removeEventListener('click', overlayCallback);
    overlayCallback = null;
   }
   break;
   
  default:
   isOverlayVisible() ? setOverlay('hidden') : setOverlay('visible');
 }
}

function createToast(type, heading, text) {
 let toastEl;
 
 switch (type) {
  case 'success':
   toastEl = successToastTemp.content.cloneNode(true).firstElementChild;
   break;
   
  case 'error':
   toastEl = errorToastTemp.content.cloneNode(true).firstElementChild;
   break;
   
  default:
   toastEl = infoToastTemp.content.cloneNode(true).firstElementChild;
 }
 
 toastEl.querySelector('h4').textContent = heading;
 toastEl.querySelector('p').textContent = text;
 toastContainer.appendChild(toastEl);
 
 setTimeout(() => {
  toastEl.classList.replace('animate-fadeInUp', 'animate-fadeOutUp');
  
  setTimeout(() => toastEl.remove(), 320);
 }, 5000);
}

function showModal(id, heading, text, confirmCallback, cancelCallback = null, spinner = false) {
 if (isModalVisible()) closeModal();
 
 modalId = id;
 modalHeading.textContent = heading;
 modalText.textContent = text;
 
 if (modalCallbacks) {
  modalCancelBtn.removeEventListener('click', modalCallbacks.cancel);
  modalConfirmBtn.removeEventListener('click', modalCallbacks.confirm);
 }
 
 if (isSidebarOpen()) {
  setSidebar('close');
 }
 
 modalCallbacks = {
  confirm: () => {
   if (confirmCallback) confirmCallback();
   closeModal();
  },
  cancel: () => {
   if (cancelCallback) cancelCallback();
   closeModal();
  }
 };
 
 modalConfirmBtn.classList.toggle('hidden', !confirmCallback);
 modalCancelBtn.classList.toggle('hidden', !cancelCallback);
 
 if (confirmCallback) {
  modalConfirmBtn.addEventListener('click', modalCallbacks.confirm);
 }
 if (cancelCallback) {
  modalCancelBtn.addEventListener('click', modalCallbacks.cancel);
 }
 
 modalSpinner.classList.toggle('hidden', !spinner);
 modalEl.classList.remove('hidden');
 setOverlay('visible');
}

function closeModal() {
 if (!isModalVisible()) return;
 
 if (modalCallbacks) {
  modalCancelBtn.removeEventListener('click', modalCallbacks.cancel);
  modalConfirmBtn.removeEventListener('click', modalCallbacks.confirm);
  modalCallbacks = null;
 }
 
 modalEl.classList.add('hidden');
 setOverlay('hidden');
}

function closeModalById(id) {
 if (!id) return;
 if (id === modalId) {
  closeModal();
 }
}

function setSidebar(state) {
 switch (state) {
  case 'open':
   if (!isSidebarOpen()) {
    sidebarEl.classList.remove('-translate-x-full');
    overlayCallback = () => setSidebar('close');
    setOverlay('visible');
   }
   break;
   
  case 'close':
   if (isSidebarOpen()) {
    sidebarEl.classList.add('-translate-x-full');
    setOverlay('hidden');
   }
   break;
   
  default:
   isSidebarOpen() ? setSidebar('close') : setSidebar('open');
 }
}

function initPeerList() {
 const list = JSON.parse(localStorage.getItem('whispr-peer-list')) || [];
 
 // Clear the container first
 peerListContainer.innerHTML = '';
 
 if (!Array.isArray(list) || list.length === 0) {
  const emptyState = document.createElement('div');
  emptyState.className = 'text-center py-4 text-surface-500 dark:text-surface-400';
  emptyState.textContent = 'No recent calls';
  peerListContainer.appendChild(emptyState);
  return;
 }
 
 list.forEach(item => {
  if (!item.id) return;
  
  const itemContainer = document.createElement('div');
  itemContainer.className = 'flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors duration-150 cursor-pointer';
  
  itemContainer.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
      ${item.profilePicture ? `<img class="object-cover w-full h-full rounded-full" src="${item.profilePicture}" alt="profile picture">` : '<i class="fas fa-user text-surface-600 dark:text-surface-300 text-xs"></i>'}
    </div>
    <div class="flex-1 inline-flex flex-col min-w-0">
      <p class="text-sm leading-tight font-medium text-surface-900 dark:text-surface-100 truncate">${item.name || 'Anonymous'}</p>
      <span class="text-xs leading-tight text-surface-500 dark:text-surface-400">${item.time || ''}</span>
    </div>
    `;
  
  peerListContainer.prepend(itemContainer);
  
  itemContainer.addEventListener('click', () => {
   callPeer(item.id);
  }, { signal });
 });
}

function updateCurrentPeer(type, name, imageUrl) {
 const currentInfoContainer = currentPeerInfo.closest('details');
 const peerImage = currentPeerInfo.querySelector('div');
 const peerName = currentPeerInfo.querySelector('p');
 
 switch (type) {
  case 'reset':
   peerImage.innerHTML = '<i class="fas fa-user text-surface-600 dark:text-surface-300 text-xs"></i>';
   peerName.textContent = '';
   
   if (!currentInfoContainer.classList.contains('hidden')) {
    currentInfoContainer.classList.add('hidden');
   }
   break;
   
  default:
   peerImage.innerHTML = imageUrl ?
    `<img class="object-cover w-full h-full" src="${imageUrl}" alt="peer profile picture">` :
    '<i class="fas fa-user text-surface-600 dark:text-surface-300 text-xs"></i>';
   peerName.textContent = name || 'Anonymous';
   
   if (currentInfoContainer.classList.contains('hidden')) {
    currentInfoContainer.classList.remove('hidden');
   }
 }
}

function updatePeerList(newPeer) {
 if (typeof newPeer !== 'object' || newPeer === null || !newPeer.id) {
  return;
 }
 
 storedPeerList = JSON.parse(localStorage.getItem('whispr-peer-list')) || [];
 
 // Remove any existing entry with the same ID
 storedPeerList = storedPeerList.filter(item => item.id !== newPeer.id);
 
 if (storedPeerList.length >= 6) {
  storedPeerList.shift();
 }
 storedPeerList.push(newPeer);
 
 localStorage.setItem('whispr-peer-list', JSON.stringify(storedPeerList));
 initPeerList();
}

function resolveRouter(route = null) {
 const hash = typeof route === 'string' && route !== null ?
  (location.hash = `#/${route}`, route) :
  getHash() || 'home';
 
 if (hash === currentRoute) return;
 
 currentRoute = hash;
 
 for (const view of viewEls) {
  if (view.id === hash) {
   view.style.opacity = 0;
   view.classList.remove('hidden');
   fadeEnter(view);
   if (view.id === 'board') resizeDrawingCanvas();
  } else {
   view.classList.add('hidden');
  }
 }
}

function updateProfilePicture(type, url) {
 switch (type) {
  case 'reset':
   profileImages.forEach(image => {
    if (!image.classList.contains('hidden')) {
     image.classList.add('hidden');
     image.src = '';
    }
   });
   
   profileImageIcons.forEach(imageIcon => {
    if (imageIcon.classList.contains('hidden')) {
     imageIcon.classList.remove('hidden');
    }
   });
   break;
   
  case 'set':
   if (!url) {
    updateProfilePicture('reset');
    return;
   }
   
   profileImages.forEach(image => {
    if (image.classList.contains('hidden')) {
     image.classList.remove('hidden');
    }
    image.src = url;
   });
   
   profileImageIcons.forEach(imageIcon => {
    if (!imageIcon.classList.contains('hidden')) {
     imageIcon.classList.add('hidden');
    }
   });
   break;
 }
}

function initProfile() {
 profileData = JSON.parse(localStorage.getItem('whispr-profile')) || {};
 
 profileForm.name.value = profileData.name || '';
 profileForm.profilePicture.value = profileData.profilePicture || '';
 
 if (profileData.profilePicture) {
  updateProfilePicture('set', profileData.profilePicture);
 } else {
  updateProfilePicture('reset');
 }
 
 const displayName = profileData.name || 'Anonymous';
 const shortName = displayName.includes(' ') ? displayName.split(' ')[0] : displayName;
 
 fullNameEls.forEach(el => {
  el.textContent = displayName;
 });
 
 shortNameEls.forEach(el => {
  el.textContent = shortName || 'there';
 });
}

function updateProfile(e) {
 e.preventDefault();
 
 if (this.profilePicture.value && !isUrl(this.profilePicture.value)) {
  createToast('error', 'Invalid profile image url!', 'Entered url for profile image is not valid.');
  return;
 }
 
 profileData = {
  name: this.name.value.trim() || 'Anonymous',
  profilePicture: this.profilePicture.value.trim() || null,
 };
 
 localStorage.setItem('whispr-profile', JSON.stringify(profileData));
 initProfile();
 createToast('success', 'Profile Updated!', 'Your profile information has been saved.');
}

function deleteProfile() {
 showModal(
  'delete_profile',
  "Delete Profile",
  "Are you sure you want to delete your profile information? This cannot be undone.",
  () => {
   localStorage.removeItem('whispr-profile');
   profileData = null;
   initProfile();
   createToast('info', 'Profile Deleted', 'Your profile information has been removed.');
  }
 );
}

async function getAvailableMediaDevices() {
 try {
  // Request permissions first
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  stream.getTracks().forEach(track => track.stop());
  
  const devices = await navigator.mediaDevices.enumerateDevices();
  
  availableCameras = devices
   .filter(d => d.kind === 'videoinput')
   .map(d => ({ label: d.label, deviceId: d.deviceId }));
  
  availableMicrophones = devices
   .filter(d => d.kind === 'audioinput')
   .map(d => ({ label: d.label, deviceId: d.deviceId }));
  
  availableSpeakers = devices
   .filter(d => d.kind === 'audiooutput')
   .map(d => ({ label: d.label, deviceId: d.deviceId }));
  
  navigator.mediaDevices.ondevicechange = () => {
   createToast('info', 'Device list changed!', 'A change was detected in media devices.');
   getAvailableMediaDevices();
  };
  
  fillOptions(selectCameraEl, availableCameras);
  fillOptions(selectMicEl, availableMicrophones);
  fillOptions(selectSpeakerEl, availableSpeakers);
  
  selectedCamera = availableCameras[0].deviceId || null;
  selectedMic = availableMicrophones[0].deviceId || null;
  selectedSpeaker = availableSpeakers[0].deviceId || null;
 } catch (error) {
  createToast('error', 'Media Access Error', 'Could not access media devices. Please check your permissions.');
  console.error('Media device access error:', error);
 }
}

async function getMediaStream(preferredVideoId, preferredAudioId) {
 try {
  const constraints = {
   video: preferredVideoId ? { deviceId: { exact: preferredVideoId } } : true,
   audio: preferredAudioId ? { deviceId: { exact: preferredAudioId } } : true
  };
  
  return await navigator.mediaDevices.getUserMedia(constraints);
 } catch (error) {
  createToast('error', 'Media access failed!', 'Trying fallback devices...');
  
  try {
   // Try with just audio if video fails
   const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
   });
   createToast('info', 'Audio only', 'Could not access camera, using audio only');
   return audioOnlyStream;
  } catch (audioError) {
   createToast('error', 'Media access completely failed', 'Could not access any media devices');
   throw new Error('No working media devices found');
  }
 }
}

function generateId() {
 const prefix = 'whispr-';
 const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
 const segments = [6, 6, 6];
 
 let id = prefix;
 
 for (let i = 0; i < segments.length; i++) {
  for (let j = 0; j < segments[i]; j++) {
   id += chars[Math.floor(Math.random() * chars.length)];
  }
  if (i < segments.length - 1) id += '-';
 }
 
 localStorage.setItem('whispr-peer-id', id);
 return id;
}

async function shareId(type = 'url') {
 try {
  if (!peer.id) {
   createToast('error', 'Peer ID not available', 'Peer.js is not initialised yet. Refresh the page if this issue persists.');
   return;
  }
  
  if (type === 'url') {
   const shareData = {
    title: 'Join my Whispr call!',
    text: 'Click to connect with me:',
    url: `${baseUrl}?peer=${peer.id}`
   };
   
   try {
    await navigator.share(shareData);
    createToast('success', 'Link shared!', 'Wait for the person to join.');
   } catch {
    await navigator.clipboard.writeText(shareData.url);
    createToast('error', 'Share failed!', 'Url copied to your clipboard. Share the url.');
   }
  } else {
   await navigator.clipboard.writeText(peer.id);
   createToast('success', 'Copied!', 'Share the ID');
  }
 } catch (err) {
  const text = type === 'url' ? `${baseUrl}?peer=${peer.id}` : peer.id;
  createToast('error', 'Share failed', 'Try copying manually');
  if (text) createToast('info', 'Copy this!', text);
 }
}

async function callPeer(peerId) {
 if (currentCall) {
  showModal(
   'new_call',
   "New Call!",
   "You're already in a call. End current call?",
   async () => {
     cleanupCallResources();
     await initiateNewCall(peerId);
    },
    null,
    true
  );
  return;
 }
 
 await initiateNewCall(peerId);
}

async function initiateNewCall(peerId) {
 try {
  const remoteId = peerId || prompt('Enter peer ID to call:');
  if (!remoteId) {
   createToast('info', 'Call canceled', 'No peer ID was provided');
   return;
  }
  
  const stream = await getMediaStream(selectedCamera, selectedMic);
  localStream = stream;
  localVideoEl.srcObject = stream;
  
  const call = peer.call(remoteId, stream, { metadata: profileData });
  setupCallEvents(call);
  
  showModal(
   'calling',
   "Calling…",
   `Connecting to ${remoteId}`,
   () => {
    cleanupCallResources();
   },
   null,
   true
  );
  
  callingTimeout = setTimeout(() => {
   if (!currentCall) {
    createToast('error', 'Call timed out', 'The call could not be established');
    cleanupCallResources();
    closeModalById('calling');
   }
  }, 30000);
 } catch (err) {
  createToast('error', 'Call failed', err.message);
  cleanupCallResources();
 }
}

function resizeDrawingCanvas() {
 const ratio = Math.max(window.devicePixelRatio || 1, 1);
 const w = Math.max(1, Math.floor(drawingBoardContainer.clientWidth));
 const h = Math.max(1, Math.floor(drawingBoardContainer.clientHeight));
 drawingBoardEl.width = Math.floor(w * ratio);
 drawingBoardEl.height = Math.floor(h * ratio);
 drawingBoardEl.style.width = w + 'px';
 drawingBoardEl.style.height = h + 'px';
 drawingCtx.setTransform(ratio, 0, 0, ratio, 0, 0); // drawing in CSS pixels
 // fill white background
 drawingCtx.fillStyle = '#ffffff';
 drawingCtx.fillRect(0, 0, drawingBoardEl.width / ratio, drawingBoardEl.height / ratio);
 redrawDrawingCanvas();
}

function transformCanvas(transformType, transformValue) {
 switch (transformType) {
  case 'x':
   drawing.canvasTranslation[0] = drawing.canvasTranslation[0] + transformValue;
   break;
   
  case 'y':
   drawing.canvasTranslation[1] = drawing.canvasTranslation[1] + transformValue;
   break;
   
  case 's':
   if (drawing.canvasTranslation[2] >= 3 || drawing.canvasTranslation[2] <= 0.5) break;
   drawing.canvasTranslation[2] = drawing.canvasTranslation[2] + transformValue;
   break;
   
  default:
   drawing.canvasTranslation = [0, 0, 0.8];
 }
 
 drawingBoardContainer.style.transform = `translateX(${drawing.canvasTranslation[0]}px) translateY(${drawing.canvasTranslation[1]}px) scale(${drawing.canvasTranslation[2]})`;
 resizeDrawingCanvas();
}

function setStrokeStyle(tool, color, size) {
 if (tool === 'eraser') {
  drawingCtx.globalCompositeOperation = 'destination-out';
  drawingCtx.lineWidth = size;
 }
 else {
  drawingCtx.globalCompositeOperation = 'source-over';
  drawingCtx.lineWidth = size;
  drawingCtx.strokeStyle = color;
  drawingCtx.lineCap = 'round';
  drawingCtx.lineJoin = 'round';
 }
}

function setDrawingTool(newTool) {
 drawing.currentDrawingTool = newTool;
}

function redrawDrawingCanvas() {
 drawingCtx.clearRect(0, 0, drawingBoardEl.width / devicePixelRatio, drawingBoardEl.height / devicePixelRatio);
 for (const s of drawing.drawnStrokes) {
  if (!s || s.length < 1) continue;
  drawSmoothedStroke(s);
 }
}

function drawSmoothedStroke(points) {
 if (!points || points.length === 0) return;
 const meta = points.meta || { tool: 'pen', color: 'rgba(0, 0, 0, 0.25)', size: 4 };
 setStrokeStyle(meta.tool, meta.color, meta.size);
 drawingCtx.beginPath();
 if (points.length === 1) {
  const p = points[0];
  drawingCtx.moveTo(p.x, p.y);
  drawingCtx.lineTo(p.x + 0.01, p.y + 0.01); // tiny dot
  drawingCtx.stroke();
  return;
 }
 // midpoint smoothing: p0 -> p1 -> p2, draw quadratic curve
 drawingCtx.moveTo(points[0].x, points[0].y);
 for (let i = 1; i < points.length - 1; i++) {
  const p0 = points[i - 1],
   p1 = points[i],
   p2 = points[i + 1];
  const cx = p1.x;
  const cy = p1.y;
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  drawingCtx.quadraticCurveTo(cx, cy, mx, my);
 }
 // final line to last
 const last = points[points.length - 1];
 drawingCtx.lineTo(last.x, last.y);
 drawingCtx.stroke();
}

function toCanvasCoords(e) {
 const rect = drawingBoardContainer.getBoundingClientRect(); // transformed rect in screen coords
 let px, py;
 // point within transformed container in screen pixels
 if (e.touches) {
  px = e.touches[0].clientX - rect.left;
  py = e.touches[0].clientY - rect.top;
 } else {
  px = e.clientX - rect.left;
  py = e.clientY - rect.top;
 }
 // invert scale: canvas logical (CSS) pixel = px / scale
 const x = px / drawing.canvasTranslation[2];
 const y = py / drawing.canvasTranslation[2];
 return { x, y };
}

function startDraw(e) {
 drawing.isDrawing = true;
 drawing.lastDrawn = toCanvasCoords(e);
 drawing.brushAlphaVal = parseInt(brushAlphaEl.value);
 drawing.currentStroke = [];
 drawing.currentStroke.meta = {
  tool: drawing.currentDrawingTool,
  color: brushColorEl.value.concat(drawing.brushAlphaVal.toString(16)),
  size: strokeSizeEl.value
 };
 drawing.currentStroke.push(drawing.lastDrawn);
 
 // ✅ draw first dot immediately
 redrawDrawingCanvas();
 drawSmoothedStroke(drawing.currentStroke);
 
 sendOverDataConn({ type: 'draw_begin', meta: drawing.currentStroke.meta, point: drawing.lastDrawn });
}

function moveDraw(e) {
 if (!drawing.isDrawing) return;
 const p = toCanvasCoords(e);
 // distance filter
 const dx = p.x - drawing.lastDrawn.x,
  dy = p.y - drawing.lastDrawn.y;
 if (Math.hypot(dx, dy) < drawing.minMoveDiff) return;
 drawing.currentStroke.push(p);
 // incremental draw locally using smoothing (we'll just redraw entire stroke for simplicity)
 redrawDrawingCanvas();
 // drawSmoothedStroke(drawing.currentStroke.concat()); // temporary draw
 drawSmoothedStroke(drawing.currentStroke);
 drawing.lastDrawn = p;
 
 const now = performance.now();
 if (now - drawing.lastPointSentAt >= drawing.sendDrawingInterval) {
  drawing.lastPointSentAt = now;
  sendOverDataConn({ type: 'draw_move', point: p });
 }
}

function endDraw() {
 if (!drawing.isDrawing) return;
 drawing.isDrawing = false;
 drawing.drawnStrokes.push(drawing.currentStroke);
 
 // ✅ ensure single-dot strokes render immediately
 redrawDrawingCanvas();
 
 sendOverDataConn({ type: 'draw_end' });
 drawing.currentStroke = null;
}

function sendOverDataConn(dataToSend) {
 if (currentDataConn && currentDataConn.open) currentDataConn.send(dataToSend);
}

function handleIncomingData(d) {
 if (!d || !d.type) return;
 switch (d.type) {
  case 'metadata': {
   const time = getDateAndTime();
   updatePeerList({
    time,
    id: currentDataConn.peer,
    ...d
   });
   
   updateCurrentPeer('set', d.name, d.profilePicture);
   break;
  }
  case 'draw_begin': {
   const s = [];
   s.meta = d.meta || { tool: 'pen', color: '#000', size: 4 };
   s.push(d.point);
   drawing.drawnStrokes.push(s);
   redrawDrawingCanvas();
   break;
  }
  case 'draw_move': {
   const s = drawing.drawnStrokes[drawing.drawnStrokes.length - 1];
   if (s) {
    s.push(d.point);
    redrawDrawingCanvas();
   }
   break;
  }
  case 'draw_end': {
   redrawDrawingCanvas();
   break;
  }
  case 'clear':
   drawing.drawnStrokes = [];
   redrawDrawingCanvas();
   break;
  case 'undo':
   drawing.drawnStrokes.pop();
   redrawDrawingCanvas();
   break;
  default:
   break;
 }
}

async function checkConnection() {
 if (!rtcObject) {
  console.warn("No active RTCPeerConnection to check");
  return;
 }
 
 try {
  const stats = await rtcObject.getStats();
  let selectedPairId = null;
  let quality = {
   rtt: null,
   jitter: null,
   packetsLost: null,
   bitrateSend: null,
  };
  
  stats.forEach(stat => {
   if (stat.type === "transport" && stat.selectedCandidatePairId) {
    selectedPairId = stat.selectedCandidatePairId;
   }
  });
  
  stats.forEach(stat => {
   if (stat.type === "candidate-pair" && stat.id === selectedPairId) {
    quality.rtt = stat.currentRoundTripTime * 1000;
   }
   
   if (stat.type === "inbound-rtp" && !stat.isRemote) {
    if (stat.kind === "audio" || stat.kind === "video") {
     quality.jitter = stat.jitter * 1000;
     quality.packetsLost = stat.packetsLost;
    }
   }
   
   if (stat.type === "outbound-rtp" && !stat.isRemote) {
    if (stat.kind === "audio" || stat.kind === "video") {
     quality.bitrateSend = stat.bytesSent;
    }
   }
  });
  
  // Update UI with connection quality
  connBitrateEl.textContent = quality.bitrateSend ? `${(quality.bitrateSend / 1000).toFixed(1)} kbps` : 'N/A';
  connJitterEl.textContent = quality.jitter ? `${quality.jitter.toFixed(1)} ms` : 'N/A';
  connLatencyEl.textContent = quality.rtt ? `${quality.rtt.toFixed(1)} ms` : 'N/A';
  connPacketsEl.textContent = quality.packetsLost !== null ? quality.packetsLost : 'N/A';
  
  // Determine connection quality label
  if (quality.rtt === null || quality.jitter === null) {
   connIndicatorEl.className = 'absolute top-2 left-7 w-2 h-2 rounded-full bg-gray-400';
   connLabelEl.textContent = 'Unknown';
   return;
  }
  
  if (quality.rtt < 100 && quality.jitter < 15) {
   connIndicatorEl.className = 'absolute top-2 left-7 w-2 h-2 rounded-full bg-green-500';
   connLabelEl.textContent = 'Excellent';
  } else if (quality.rtt < 200 && quality.jitter < 30) {
   connIndicatorEl.className = 'absolute top-2 left-7 w-2 h-2 rounded-full bg-yellow-500';
   connLabelEl.textContent = 'Good';
  } else if (quality.rtt < 500 && quality.jitter < 50) {
   connIndicatorEl.className = 'absolute top-2 left-7 w-2 h-2 rounded-full bg-orange-500';
   connLabelEl.textContent = 'Fair';
  } else {
   connIndicatorEl.className = 'absolute top-2 left-7 w-2 h-2 rounded-full bg-red-500';
   connLabelEl.textContent = 'Poor';
  }
 } catch (err) {
  console.error('Connection check failed:', err);
 }
}

function setInCallInteractions(boolean) {
 Array.from(callControls).forEach(button => {
  button.disabled = !boolean;
  if (!boolean) {
   if (button.id === 'btn-toggle-mute') {
    button.firstElementChild.className = 'fas fa-microphone text-base';
   } else if (button.id === 'btn-toggle-mask') {
    button.firstElementChild.className = 'fas fa-video text-base';
   }
  }
 });
}

function cleanupCallResources() {
 // Stop media tracks
 if (localStream) {
  localStream.getTracks().forEach(track => track.stop());
  localStream = null;
 }
 
 // Reset media states
 audioEnabled = true;
 videoEnabled = true;
 
 // Clear video elements
 localVideoEl.srcObject = null;
 remoteVideoEl.srcObject = null;
 remoteAudioEl.srcObject = null;
 
 // Clear timers and intervals
 if (connCheckupInterval) {
  clearInterval(connCheckupInterval);
  connCheckupInterval = null;
 }
 
 if (callingTimeout) {
  clearTimeout(callingTimeout);
  callingTimeout = null;
 }
 
 if (callTimerInterval) {
  clearInterval(callTimerInterval);
  callTimerInterval = null;
 }
 
 // Close current call if exists
 if (currentCall) {
  currentCall.close();
  currentCall = null;
 }
 
 // Reset connection objects
 rtcObject = null;
 
 if (currentDataConn) {
  currentDataConn.close();
  currentDataConn = null;
 }
 
 // Update UI
 setInCallInteractions(false);
 updateCurrentPeer('reset');
 callDurationEl.textContent = "00:00";
 resolveRouter('home');
}

function endCall() {
 showModal(
  'end_call',
  "End Call",
  "Are you sure you want to end the current call?",
  () => {
   cleanupCallResources();
   createToast('info', 'Call ended', 'The call has been disconnected');
  }
 );
}

function toggleMute() {
 if (!localStream) {
  createToast('info', 'No active call', 'You are not in a call');
  return;
 }
 
 audioEnabled = !audioEnabled;
 localStream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
 
 const icon = this.querySelector('i');
 icon.className = `fas ${audioEnabled ? 'fa-microphone' : 'fa-microphone-slash'} text-base`;
 
 createToast('success',
  audioEnabled ? 'Microphone on' : 'Microphone off',
  audioEnabled ? 'Microphone enabled' : 'Microphone disabled');
}

function toggleMask() {
 if (!localStream) {
  createToast('info', 'No active call', 'You are not in a call');
  return;
 }
 
 videoEnabled = !videoEnabled;
 localStream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
 
 const icon = this.querySelector('i');
 icon.className = `fas ${videoEnabled ? 'fa-video' : 'fa-video-slash'} text-base`;
 
 createToast('success',
  videoEnabled ? 'Camera on' : 'Camera off',
  videoEnabled ? 'Camera enabled' : 'Camera disabled');
}

function startCallTimer() {
 callStartTime = Date.now();
 
 callTimerInterval = setInterval(() => {
  const elapsed = Date.now() - callStartTime;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  callDurationEl.textContent =
   `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
 }, 1000);
}

function setupCallEvents(call) {
 if (callingTimeout) {
  clearTimeout(callingTimeout);
  callingTimeout = null;
 }
 
 if (currentCall) currentCall.close();
 currentCall = call;
 rtcObject = call.peerConnection;
 
 call.on('stream', remoteStream => {
  closeModalById('calling');
  startCallTimer();
  
  // Separate video and audio streams for better control
  const videoStream = new MediaStream();
  const audioStream = new MediaStream();
  
  remoteStream.getVideoTracks().forEach(track => videoStream.addTrack(track));
  remoteStream.getAudioTracks().forEach(track => audioStream.addTrack(track));
  
  remoteVideoEl.srcObject = videoStream;
  remoteAudioEl.srcObject = audioStream;
  
  // Set audio output device if supported
  if ('setSinkId' in remoteAudioEl && selectedSpeaker) {
   remoteAudioEl.setSinkId(selectedSpeaker)
    .catch(err => console.warn('Failed to set audio output:', err));
  }
  
  setInCallInteractions(true);
  resolveRouter('call');
 });
 
 call.on('close', () => {
  closeModalById('calling');
  createToast('info', 'Call ended', 'The remote peer disconnected');
  cleanupCallResources();
 });
 
 rtcObject.oniceconnectionstatechange = () => {
  if (rtcObject.iceConnectionState === 'disconnected') {
   closeModalById('calling');
   createToast('info', 'Call ended', 'The remote peer disconnected');
   cleanupCallResources();
  }
 }
 
 call.on('error', (err) => {
  closeModalById('calling');
  createToast('error', 'Call error', err.message);
  cleanupCallResources();
 });
 
 // Monitor connection quality
 if (connCheckupInterval) clearInterval(connCheckupInterval);
 connCheckupInterval = setInterval(() => checkConnection(), 2000);
}

function setupPeerEventListeners() {
 peer.on('open', id => {
  closeModalById('initializing');
  closeModalById('disconnected');
  createToast('info', 'Ready to connect', `Your ID: ${id}`);
  
  // Check for peer ID in URL
  const params = new URLSearchParams(window.location.search);
  if (params.has('peer')) {
   callPeer(params.get('peer'));
  }
 });
 
 peer.on('call', call => {
  const answerCall = () => {
   const time = getDateAndTime();
   const peerInfo = {
    time,
    id: call.peer,
    ...call.metadata
   };
   
   updatePeerList(peerInfo);
   
   getMediaStream(selectedCamera, selectedMic)
    .then(stream => {
     localStream = stream;
     localVideoEl.srcObject = stream;
     
     updateCurrentPeer('set', peerInfo.name, peerInfo.profilePicture);
     call.answer(stream);
     
     // Exchange metadata via data connection
     currentDataConn = peer.connect(call.peer);
     
     currentDataConn.on('open', () => {
      sendOverDataConn({
       type: 'metadata',
       ...profileData
      });
     });
     
     currentDataConn.on('data', data => handleIncomingData(data));
     currentDataConn.on('error', (error) => {
      if (currentDataConn && currentDataConn.open) {
       currentDataConn.close();
      }
      
      currentDataConn = null;
     });
     
     setupCallEvents(call);
     createToast('success', 'Call answered!', `Connected with ${peerInfo.name || 'Anonymous'}`);
    })
    .catch(err => {
     createToast('error', 'Call failed', 'Could not access media devices');
     console.error('Media access error:', err);
    });
  };
  
  const rejectCall = () => {
   call.answer();
   setTimeout(() => call.close(), 1000);
   createToast('info', 'Call declined', 'You declined the incoming call');
  };
  
  showModal(
   'incoming_call',
   'Incoming call!',
   `${call.metadata.name || call.peer} is calling`,
   answerCall,
   rejectCall
  );
 });
 
 peer.on('connection', conn => {
  if (currentDataConn) {
   createToast('info', 'Already Connected!', 'Someone trying to connect to your Data Connection.');
   return;
  }
  
  currentDataConn = conn;
  
  currentDataConn.on('data', data => handleIncomingData(data));
  currentDataConn.on('error', (error) => {
   if (currentDataConn && currentDataConn.open) {
    currentDataConn.close();
   }
   
   currentDataConn = null;
  });
 });
 
 peer.on('disconnected', () => {
  showModal(
   'disconnected',
   "Disconnected!",
   "Attempting to reconnect...",
   null,
   null,
   true
  );
  cleanupCallResources();
  peer.reconnect();
 });
 
 peer.on('close', () => {
  showModal(
   'signed_out',
   "Connection Closed",
   "Refresh to create new session",
  );
  cleanupCallResources();
 });
 
 peer.on('error', err => {
  closeModalById('calling');
  createToast('error', 'Connection error', err.message);
  console.error('Peer error:', err);
 });
}

function cleanupApp() {
 // Cleanup calls first
 cleanupCallResources();
 
 // Cleanup peer connection
 if (peer && !peer.destroyed) {
  peer.destroy();
 }
 
 // Abort all event listeners
 if (controller) {
  controller.abort();
 }
}

async function main() {
 controller = new AbortController();
 signal = controller.signal;
 
 // Initialize theme
 const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
 const savedTheme = localStorage.getItem('whispr-theme');
 
 if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
  document.documentElement.classList.add('dark');
 }
 
 // Setup event listeners
 callPeerBtn.addEventListener('click', () => {
  const input = document.getElementById('input-peer-id');
  peerIdToCall = input.value.trim();
  
  if (peerIdToCall) {
   callPeer(peerIdToCall);
  } else {
   createToast('error', 'No Peer ID', 'Please enter a valid Peer ID');
  }
 }, { signal });
 
 modalCloseBtn.addEventListener('click', closeModal, { signal });
 openSidebarBtn.addEventListener('click', () => setSidebar(), { signal });
 toggleThemeBtn.addEventListener('click', toggleTheme, { signal });
 
 toggleMuteBtn.addEventListener('click', toggleMute, { signal });
 toggleMaskBtn.addEventListener('click', toggleMask, { signal });
 toggleFullscreenBtn.addEventListener('click', toggleFullScreen, { signal });
 endCallBtn.addEventListener('click', endCall, { signal });
 
 drawingBoardEl.addEventListener('mousedown', startDraw, { signal });
 drawingBoardEl.addEventListener('mousemove', moveDraw, { signal });
 window.addEventListener('mouseup', endDraw, { signal });
 drawingBoardEl.addEventListener('touchstart', (e) => {
  e.preventDefault();
  startDraw(e);
 }, { passive: false, signal });
 drawingBoardEl.addEventListener('touchmove', (e) => {
  e.preventDefault();
  moveDraw(e);
 }, { passive: false, signal });
 drawingBoardEl.addEventListener('touchend', (e) => {
  e.preventDefault();
  endDraw(e);
 }, { passive: false, signal });
 
 brushToolEl.addEventListener('click', () => setDrawingTool('pen'), { signal });
 
 eraserToolEl.addEventListener('click', () => setDrawingTool('eraser'), { signal });
 
 clearCanvasBtn.addEventListener('click', () => {
  drawing.drawnStrokes = [];
  redrawDrawingCanvas();
  sendOverDataConn({ type: 'clear' });
 }, { signal });
 
 undoStrokeBtn.addEventListener('click', () => {
  drawing.drawnStrokes.pop();
  redrawDrawingCanvas();
  sendOverDataConn({ type: 'undo' });
 }, { signal });
 
 downloadCanvasBtn.addEventListener('click', () => {
  const anchor = document.createElement('a'),
   randNum = Math.floor(Math.random() * 10000);
  anchor.download = `whispr-whiteboard-${randNum}.png`;
  anchor.href = drawingBoardEl.toDataURL();
  anchor.click();
 }, { signal });
 
 copyIdBtn.addEventListener('click', () => shareId('id'), { signal });
 shareUrlBtn.addEventListener('click', () => shareId('url'), { signal });
 
 Array.from(viewNavBtns).forEach(button => {
  button.addEventListener('click', () => resolveRouter(button.dataset.page), { signal });
 });
 
 selectCameraEl.addEventListener('change', function() {
  selectedCamera = this.value;
  const label = getLabelById(availableCameras, selectedCamera);
  createToast('success', 'Camera changed', label || 'Default camera');
 }, { signal });
 
 selectMicEl.addEventListener('change', function() {
  selectedMic = this.value;
  const label = getLabelById(availableMicrophones, selectedMic);
  createToast('success', 'Microphone changed', label || 'Default microphone');
 }, { signal });
 
 selectSpeakerEl.addEventListener('change', function() {
  selectedSpeaker = this.value;
  const label = getLabelById(availableSpeakers, selectedSpeaker);
  createToast('success', 'Speaker changed', label || 'Default speaker');
 }, { signal });
 
 profileForm.addEventListener('reset', deleteProfile, { signal });
 profileForm.addEventListener('submit', updateProfile, { signal });
 
 window.addEventListener('online', () => {
  createToast('success', 'Online', 'You are back online');
 }, { signal });
 
 window.addEventListener('offline', () => {
  createToast('error', 'Offline', 'Check your internet connection');
 }, { signal });
 
 document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === 'visible') {
   createToast('info', 'Welcome back', 'The app is now active');
  }
 }, { signal });
 
 window.addEventListener('hashchange', resolveRouter, { signal });
 window.addEventListener('resize', resizeDrawingCanvas, { signal });
 
 // Initialize app components
 setInCallInteractions(false);
 setupPeerEventListeners();
 initPeerList();
 initProfile();
 getAvailableMediaDevices();
 resolveRouter('home');
 updateCurrentPeer('reset');
 resizeDrawingCanvas();
 
 // Show initialization status
 showModal(
  'initializing',
  "Initializing...",
  "Setting up your connection",
  null,
  null,
  true
 );
}

// Event listeners for app lifecycle
window.addEventListener('DOMContentLoaded', main);
window.addEventListener('beforeunload', cleanupApp);