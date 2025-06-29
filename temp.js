let signal = null;
let modalCallbacks = null;
let overlayCallback = null;
let currentRoute = null;
let localStream = null;
let currentCall = null;
let lastBytesSent = 0;
let lastTimeStamp = 0;
let connCheckupInterval = null;
let rtcObject = null;
let audioEnabled = true;
let videoEnabled = true;
let prefFacingMode = 'user';
let profileData = null;
let peerIdToCall = null;
let storedPeerList = null;

const urlRegEx = /^(https?|ftp):\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
const baseUrl = window.location.origin + window.location.pathname;
const overlay = document.getElementById('overlay');
const toastContainer = document.getElementById('toast-container');
const successToastTemp = document.getElementById('template-toast-success');
const errorToastTemp = document.getElementById('template-toast-error');
const sidebarEl = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('btn-open-sidebar');
const toggleThemeBtn = document.getElementById('btn-toggle-theme');
const modalEl = document.getElementById('modal');
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
const profileForm = document.getElementById('form-update-profile');
const profileImages = document.querySelectorAll('img[data-profile-picture]');
const profileImageIcons = document.querySelectorAll('i[data-profile-placeholder]');
const shortNameEls = document.querySelectorAll('[data-name-short]');
const fullNameEls = document.querySelectorAll('[data-name-full]');
const emailEls = document.querySelectorAll('[data-email]');
const callPeerBtn = document.getElementById('btn-call-peer');
const copyIdBtn = document.getElementById('btn-copy-id');
const shareUrlBtn = document.getElementById('btn-share-url');
const peerListContainer = document.getElementById('peer-list');

const savedPeerId = sessionStorage.getItem('whispr-peer-id') || generateId();
const peer = new Peer(savedPeerId);

function isOverlayVisible() { return !overlay.classList.contains('hidden'); }

function isSidebarOpen() { return !sidebarEl.classList.contains('-translate-x-full'); }

function isModalVisible() { return !modalEl.classList.contains('hidden'); }

function getHash() { return location.hash.slice(2); }

function isUrl(url) { return urlRegEx.test(url); }

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
  document.exitFullscreen?.();
 }
}

function toggleTheme() {
 let preffTheme = localStorage.getItem('whispr-theme') || 'light';
 
 if (preffTheme === 'light') {
  document.documentElement.classList.add('dark');
  preffTheme = 'dark';
 } else {
  document.documentElement.classList.remove('dark');
  preffTheme = 'light';
 }
 
 localStorage.setItem('whispr-theme', preffTheme);
 createToast('success', 'Theme switched!', `Changed theme preference to ${preffTheme}.`);
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
 const toastEl = type === 'success' ?
  successToastTemp.content.cloneNode(true).firstElementChild :
  errorToastTemp.content.cloneNode(true).firstElementChild;
 
 toastEl.querySelector('h4').textContent = heading;
 toastEl.querySelector('p').textContent = text;
 toastContainer.appendChild(toastEl);
 
 setTimeout(() => {
  toastEl.classList.replace('animate-fadeInUp', 'animate-fadeOutUp');
  
  setTimeout(() => toastEl.remove(), 320);
 }, 5000);
}

function showModal(heading, text, confirmCallback, cancelCallback = null) {
 modalHeading.textContent = heading;
 modalText.textContent = text;
 
 if (modalCallbacks) {
  modalCancelBtn.removeEventListener('click', modalCallbacks.cancel);
  modalConfirmBtn.removeEventListener('click', modalCallbacks.confirm);
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

function initPeerList(list) {
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
   <span class="text-xs leading-tight text-surface-500 dark:text-surface-400">${item.email || ''}</span>
  </div>
  `;
  
  peerListContainer.appendChild(itemContainer);
  
  itemContainer.addEventListener('click', () => {
   callPeer(item.id);
  }, { signal });
 });
}

function updatePeeList(newPeer) {
 if (typeof newPeer !== 'object' || newPeer === null) {
  return;
 }
 
 storedPeerList = JSON.parse(localStorage.getItem('whispr-peer-list')) || [];
 
 if (storedPeerList.length > 6) {
  storedPeerList.shift();
 }
 storedPeerList.push(newPeer);
 
 localStorage.setItem('whispr-peer-list', JSON.stringify(storedPeerList));
 
 initPeerList(storedPeerList);
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
  profileForm.email.value = '';
  profileForm.bio.value = '';
  
  updateProfilePicture('reset');
  
  fullNameEls.forEach(el => {
   el.textContent = 'Anonymous';
  });
  
  shortNameEls.forEach(el => {
   el.textContent = 'there';
  });
  
  emailEls.forEach(el => {
   el.textContent = '';
  });
  return;
 }
 
 profileForm.name.value = profileData.name;
 profileForm.profilePicture.value = profileData.profilePicture;
 profileForm.email.value = profileData.email;
 profileForm.bio.value = profileData.bio;
 
 updateProfilePicture('set', profileData.profilePicture);
 
 fullNameEls.forEach(el => {
  el.textContent = profileData.name ? profileData.name : 'Anonymous';
 });
 
 shortNameEls.forEach(el => {
  el.textContent = profileData.name.includes(' ') ? profileData.name.split(' ')[0] : profileData.name;
 });
 
 emailEls.forEach(el => {
  el.textContent = profileData.email;
 });
}

function updateProfile(e) {
 e.preventDefault();
 
 if (!isUrl(this.profilePicture.value)) {
  createToast('error', 'Invalid profile image url!', 'Entered url for profile image is not valid.');
  return;
 }
 
 if (!validator.isEmail(this.email.value)) {
  createToast('error', 'Invalid email!', 'Entered email address is either not complete or not valid.');
  return;
 }
 
 profileData = {
  name: this.name.value || 'Anonymous',
  profilePicture: this.profilePicture.value || null,
  email: this.email.value || null,
  bio: this.bio.value || null
 };
 
 localStorage.setItem('whispr-profile', JSON.stringify(profileData));
 initProfile();
 createToast('success', 'Profile Updated!', 'But! Be mindful of the information you enter.');
}

function deleteProfile() {
 showModal(
  "Delete Profile",
  "Are you sure you want to delete your profile information?",
  () => {
   localStorage.removeItem('whispr-profile');
   profileData = null;
   initProfile();
   createToast('error', 'Warning!', 'User Information deleted.');
  }
 );
}

async function getMediaStream(facingMode) {
 try {
  const stream = await navigator.mediaDevices.getUserMedia({
   video: { facingMode },
   audio: true
  });
  return stream;
 } catch (error) {
  createToast('error', 'Camera access failed!', `Couldn't get camera (${facingMode}), trying alternatives`);
  
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
  
  throw new Error('No suitable camera found');
 }
}

function generateId() {
 const prefix = 'whispr-';
 const chars = '0123456789abcdefghijklmnopqrstuvwxyz_-';
 const segments = [8, 6, 6];
 
 let id = prefix;
 
 for (let i = 0; i < segments.length; i++) {
  for (let j = 0; j < segments[i]; j++) {
   id += chars[Math.floor(Math.random() * chars.length)];
  }
  if (i < segments.length - 1) id += '-';
 }
 
 sessionStorage.setItem('whispr-peer-id', id);
 createToast('success', 'Id generated!', `Your session ID: ${id}`);
 return id;
}

async function shareId(type = 'url') {
 try {
  if (!peer.id) createToast('error', 'Peer ID not available', 'Peer.js is not initialised yet. Refresh the page if this issue persists.');
  
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
  if (text) createToast('error', 'Copy this!', text);
 }
}

async function callPeer(peerId) {
 if (currentCall) {
  showModal(
   "New Call",
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
  
  const stream = await getMediaStream(prefFacingMode);
  localStream = stream;
  localVideoEl.srcObject = stream;
  
  const call = peer.call(remoteId, stream, { metadata: profileData });
  setupCallEvents(call);
 } catch (err) {
  createToast('error', 'Call failed', err.message);
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
 
 // Clear video elements
 localVideoEl.srcObject = null;
 remoteVideoEl.srcObject = null;
 remoteAudioEl.srcObject = null;
 
 // Clear connection monitoring
 if (connCheckupInterval) {
  clearInterval(connCheckupInterval);
  connCheckupInterval = null;
 }
 
 // Reset call state
 currentCall = null;
 rtcObject = null;
 
 setInCallInteractions(false);
 createToast('success', 'Call ended', 'The call has been disconnected');
 resolveRouter('home');
}

function endCall() {
 showModal(
  "End Call",
  "Are you sure you want to end the current call?",
  () => {
   cleanupCallResources();
  }
 );
}

function toggleMute() {
 if (!localStream) {
  createToast('error', 'No active call!', 'You are not in a call');
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
  createToast('error', 'No active call!', 'You are not in a call');
  return;
 }
 
 videoEnabled = !videoEnabled;
 localStream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
 createToast('success',
  videoEnabled ? 'Camera on' : 'Camera off',
  videoEnabled ? 'Camera enabled' : 'Camera disabled');
 this.querySelector('i').className = `fas ${videoEnabled ? 'fa-video' : 'fa-video-slash'} text-base`;
}

function setupCallEvents(call) {
 if (currentCall) currentCall.close();
 currentCall = call;
 
 call.on('stream', remoteStream => {
  const videoStream = new MediaStream([remoteStream.getVideoTracks()[0]]);
  const audioStream = new MediaStream([remoteStream.getAudioTracks()[0]]);
  
  remoteVideoEl.srcObject = videoStream;
  remoteAudioEl.srcObject = audioStream;
 });
 
 call.on('close', endCall);
 call.on('error', () => {
  createToast('error', 'Call error!', 'An error occurred');
  endCall();
 });
 
 // Setup connection monitoring
 rtcObject = call.peerConnection;
 if (connCheckupInterval) clearInterval(connCheckupInterval);
 
 connCheckupInterval = setInterval(() => {
  if (rtcObject && ['disconnected', 'failed'].includes(rtcObject.iceConnectionState)) {
   createToast('error', 'Connection lost', 'Peer disconnected');
   cleanupCallResources();
  }
 }, 5000);
 
 setInCallInteractions(true);
 resolveRouter('call');
}

function setupPeerEventListeners() {
 peer.on('open', id => {
  const peerIdToJoin = new URLSearchParams(window.location.search).get('peer');
  if (peerIdToJoin) callPeer(peerIdToJoin);
 });
 
 peer.on('call', call => {
  const answerCall = () => {
   const peerInfo = {
    id: call.peer,
    ...call.metadata
   };
   updatePeeList(peerInfo);
   getMediaStream(prefFacingMode)
    .then(stream => {
     localStream = stream;
     localVideoEl.srcObject = stream;
     resolveRouter('call');
     call.answer(stream);
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
   call.close();
  };
  
  showModal(
   'Incoming call!',
   `${call.metadata?.name || call.peer} is calling`,
   answerCall,
   rejectCall
  );
 });
 
 peer.on('disconnected', () => {
  createToast('error', 'Disconnected', 'Reconnecting...');
  peer.reconnect();
 });
 
 peer.on('close', () => {
  createToast('error', 'Signed out', 'Refresh to create new session');
  cleanupCallResources();
 });
 
 peer.on('error', err => {
  createToast('error', 'Connection error', 'A peer error occurred');
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

function main() {
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
   createToast('success', 'Welcome back', 'Where did you go?');
  }
 }, { signal });
 
 window.addEventListener('hashchange', resolveRouter, { signal });
 
 // Initialize app
 setInCallInteractions(false);
 setupPeerEventListeners();
 initPeerList(JSON.parse(localStorage.getItem('whispr-peer-list')));
 initProfile();
 resolveRouter();
}

// Event listeners for cleanup
window.addEventListener('DOMContentLoaded', main);
window.addEventListener('beforeunload', cleanupApp);
// window.addEventListener('pagehide', cleanupApp);