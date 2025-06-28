// let controller = null,
//  signal = null,
//  modalCallbacks = null,
//  overlayCallback = null,
//  currentRoute = null,
//  localStream = null,
//  currentCall = null,
//  lastBytesSent = 0,
//  lastTimeStamp = 0,
//  connCheckupInterval = null,
//  rtcObject = null,
//  audioEnabled = true,
//  videoEnabled = true,
//  prefFacingMode = 'user',
//  profileData = null;


// const savedPeerId = localStorage.getItem('whispr-peer-id') || generateId();
// const peer = new Peer(savedPeerId);
// const baseUrl = window.location.origin + window.location.pathname;
// const overlay = document.getElementById('overlay');
// const toastContainer = document.getElementById('toast-container');
// const successToastTemp = document.getElementById('template-toast-success');
// const errorToastTemp = document.getElementById('template-toast-error');
// const sidebarEl = document.getElementById('sidebar');
// const openSidebarBtn = document.getElementById('open-sidebar');
// const toggleThemeBtn = document.getElementById('toggle-theme');
// const modalEl = document.getElementById('modal');
// const modalHeading = document.getElementById('modal-heading');
// const modalText = document.getElementById('modal-text');
// const modalCloseBtn = document.getElementById('modal-btn-close');
// const modalCancelBtn = document.getElementById('modal-btn-cancel');
// const modalConfirmBtn = document.getElementById('modal-btn-confirm');
// const viewEls = document.getElementById('views').children;
// const viewNavBtns = document.getElementById('view-nav').children;
// const localVideo = document.getElementById('call-video-local');
// const remoteVideo = document.getElementById('call-video-remote');
// const remoteAudio = document.getElementById('call-audio-remote');
// const profileForm = document.getElementById('form-update-profile');
// const profPicContainer = document.getElementById('profile-picture-container');


// const isOverlayVisible = () => { return !overlay.classList.contains('hidden') };
// const isSidebarOpen = () => { return !sidebarEl.classList.contains('-translate-x-full') };
// const isModalVisible = () => { return !modalEl.classList.contains('hidden') };
// const getHash = () => { return location.hash.slice(2) };


// function fadeEnter(element, opacity) {
//  if (element.classList.contains('hidden')) {
//   return;
//  }

//  if (opacity <= 1) {
//   element.style.opacity = opacity;
//   newOpacity = parseFloat(opacity) + 0.05;
//   requestAnimationFrame(() => fadeEnter(element, newOpacity));
//  }
// }


// function toggleFullScreen() {
//  if (!document.fullscreenElement) {
//   viewEls[1].firstElementChild.requestFullscreen();
//  } else {
//   document.exitFullscreen?.();
//  }
// }


// function toggleTheme() {
//  let preffTheme = localStorage.getItem('whispr-theme') || 'light';

//  if (preffTheme === 'light') {
//   document.documentElement.classList.add('dark');
//   preffTheme = 'dark';
//   localStorage.setItem('whispr-theme', preffTheme);
//  } else {
//   document.documentElement.classList.remove('dark');
//   preffTheme = 'light'
//   localStorage.setItem('whispr-theme', preffTheme);
//  }

//  createToast('success', 'Theme switched!', `Changed theme preference to ${preffTheme}.`);
// }


// function setOverlay(state) {
//  switch (state) {
//   case 'visible':
//    if (!isOverlayVisible()) {
//     overlay.classList.remove('hidden');
//    }
//    if (overlayCallback) {
//     overlay.addEventListener('click', overlayCallback);
//    }
//    break;

//   case 'hidden':
//    if (isOverlayVisible()) {
//     overlay.classList.add('hidden');
//    }
//    if (overlayCallback) {
//     overlay.removeEventListener('click', overlayCallback);
//     overlayCallback = null;
//    }
//    break;

//   default:
//    if (!isOverlayVisible()) {
//     setOverlay('visible');
//    } else {
//     setOverlay('hidden');
//    }
//  }
// }


// function createToast(type, heading, text) {
//  let toastEl;
//  if (type === 'success') {
//   toastEl = successToastTemp.content.cloneNode(true).firstElementChild;
//  } else {
//   toastEl = errorToastTemp.content.cloneNode(true).firstElementChild;
//  }

//  toastEl.querySelector('h4').textContent = heading;
//  toastEl.querySelector('p').textContent = text;
//  toastContainer.appendChild(toastEl);

//  setTimeout(() => {
//   toastEl.classList.replace('animate-fadeInUp', 'animate-fadeOutUp');
//   setTimeout(() => toastEl.remove(), 320);
//  }, 5000);
// }


// function closeModal() {
//  if (isModalVisible()) {
//   if (modalCallbacks) {
//    modalCancelBtn.removeEventListener('click', modalCallbacks.cancel);
//    modalConfirmBtn.removeEventListener('click', modalCallbacks.confirm);

//    modalCallbacks = null;
//   }

//   modalEl.classList.add('hidden');
//   setOverlay('hidden');
//  }
// }


// function setSidebar(state) {
//  switch (state) {
//   case 'open':
//    if (!isSidebarOpen()) {
//     sidebarEl.classList.remove('-translate-x-full');
//     overlayCallback = () => setSidebar('close');
//     setOverlay('visible');
//    }
//    break;

//   case 'close':
//    if (isSidebarOpen()) {
//     sidebarEl.classList.add('-translate-x-full');
//     setOverlay('hidden');
//    }
//    break;

//   default:
//    if (isSidebarOpen()) {
//     setSidebar('close');
//    } else {
//     setSidebar('open');
//    }
//  }
// }


// function resolveRouter(route = null) {
//  let hash;
//  if (typeof route === 'string' && route !== null) {
//   hash = route;
//   location.hash = `#/${route}`;
//  } else {
//   hash = getHash() || 'home';
//   console.log('Routing to:', hash);
//  }

//  if (hash === currentRoute) {
//   return;
//  }

//  currentRoute = hash;

//  for (const view of viewEls) {
//   if (view.id === hash) {
//    view.style.opacity = 0;
//    view.classList.remove('hidden');
//    fadeEnter(view, 0);
//   } else {
//    view.classList.add('hidden');
//   }
//  }
// }


// function updateProfilePicture(type, url) {
//  const image = profPicContainer.querySelector('img');
//  const placeholder = profPicContainer.querySelector('i');

//  const isImageVisible = !image.classList.contains('hidden');
//  const isPlaceholderVisible = !placeholder.classList.contains('hidden');

//  switch (type) {
//   case 'reset':
//    if (isImageVisible) {
//     image.classList.add('hidden');
//     image.src = '';
//    }

//    if (!isPlaceholderVisible) {
//     placeholder.classList.remove('hidden');
//    }
//    break;

//   case 'set':
//    if (url === null || url === '') {
//     updateProfilePicture('reset');
//     return;
//    }

//    if (!isImageVisible) {
//     image.classList.remove('hidden');
//    }

//    if (isPlaceholderVisible) {
//     placeholder.classList.add('hidden');
//    }

//    image.src = url;
//    break;
//  }

// }


// function initProfileForm() {
//  profileData = JSON.parse(localStorage.getItem('whispr-profile'));

//  if (!profileData) {
//   profileForm.name.value = '';
//   profileForm.profilePicture.value = '';
//   profileForm.email.value = '';
//   profileForm.bio.value = '';

//   updateProfilePicture('reset');

//   return;
//  }

//  profileForm.name.value = profileData.name;
//  profileForm.profilePicture.value = profileData.profilePicture;
//  profileForm.email.value = profileData.email;
//  profileForm.bio.value = profileData.bio;

//  updateProfilePicture('set', profileData.profilePicture)
// }


// function updateProfile(e) {
//  e.preventDefault();

//  profileData = {
//   name: this.name.value || 'Unknown',
//   profilePicture: this.profilePicture.value || null,
//   email: this.email.value || null,
//   bio: this.bio.value || null
//  };

//  localStorage.setItem('whispr-profile', JSON.stringify(profileData));

//  initProfileForm();

//  createToast('success', 'Profile Updated!', 'But! Be mindful of the information you enter.');
// }


// function deleteProfile() {
//  localStorage.removeItem('whispr-profile');
//  profileData = null;
//  initProfileForm();
//  createToast('error', 'Warning!', 'User Information deleted.');
// }


// async function getMediaStream(facingMode) {
//  try {
//   // First try with facingMode
//   const stream = await navigator.mediaDevices.getUserMedia({
//    video: { facingMode },
//    audio: true
//   });
//   return stream;
//  } catch (error) {
//   createToast('error', 'Accessing camera failed!', `Couldn't get camera by facingMode (${facingMode}), trying device enumeration`);

//   // Fallback to device enumeration
//   const devices = await navigator.mediaDevices.enumerateDevices();
//   const videoDevices = devices.filter(d => d.kind === 'videoinput');

//   for (const device of videoDevices) {
//    try {
//     const stream = await navigator.mediaDevices.getUserMedia({
//      video: { deviceId: { exact: device.deviceId } },
//      audio: true
//     });
//     const track = stream.getVideoTracks()[0];
//     const settings = track.getSettings();

//     if (!facingMode || settings.facingMode === facingMode) {
//      return stream;
//     }
//     track.stop();
//    } catch (e) {
//     continue;
//    }
//   }

//   createToast('error', 'Error accessing camera!', 'No suitable camera found.');
//  }
// }


// function generateId() {
//  const prefix = 'whispr-';
//  const chars = '0123456789abcdefghijklmnopqrstuvwxyz_-';
//  const segments = [8, 6, 6];

//  let id = prefix;

//  for (let i = 0; i < segments.length; i++) {
//   for (let j = 0; j < segments[i]; j++) {
//    const randomIndex = Math.floor(Math.random() * chars.length);
//    id += chars[randomIndex];
//   }
//   if (i < segments.length - 1) {
//    id += '-';
//   }
//  }

//  createToast('success', 'Id generation successful!', `Your Id for this session is ${id}`);

//  return id;
// }


// function shareId(type = 'url') {
//  if (type === 'url') {
//   navigator.share({
//    title: 'Join my Whispr call!',
//    text: 'Click to connect with me:',
//    url: `${baseUrl}?peer=${peer.id}`
//   }).then(() => {
//    createToast('success', 'Link shared successfully!', 'Wait for the other person to join.');
//   }).catch(err => {
//    console.error('Sharing failed:', err);
//    createToast('error', 'Share failed!', 'Try copying the link.');
//   });
//  } else {
//   navigator.clipboard.writeText(peer.id)
//    .then(() => createToast('success', 'Link copied to clipboard!', 'Share with the person you want to talk to.'))
//    .catch(() => createToast('error', 'Failed to copy link.', 'Some error occurred!'));
//  }
// }


// function callPeer(peerId) {
//  const remoteId = !peerId ? prompt('Enter peer ID to call:') : peerId;
//  if (!remoteId) {
//   createToast('error', 'Failed to call!', 'There is no id to join.');
//   return;
//  };

//  getMediaStream(prefFacingMode).then(stream => {
//   localStream = stream;
//   localVideo.srcObject = stream;

//   const call = peer.call(remoteId, stream);
//   setupCallEvents(call);
//  }).catch(err => {
//   createToast('error', 'Error accessing media devices!', 'No camera/microphone found to call with.');
//  });
// }

// function endCall() {
//  if (connCheckupInterval) {
//   clearInterval(connCheckupInterval);
//   connCheckupInterval = null;
//  }

//  if (localStream) {
//   localStream.getTracks().forEach(track => track.stop());
//   localStream = null;
//   createToast('success', 'Media devices released!', 'Camera and microphone streams are closed.');
//  }

//  localVideo.srcObject = null;
//  remoteVideo.srcObject = null;
//  remoteAudio.srcObject = null;

//  if (currentCall) {
//   try {
//    currentCall.close();
//   } catch (e) {
//    console.warn('Error while closing call:', e);
//   }
//   currentCall = null;
//   createToast('success', 'Call ended!', 'The call has now been disconnected.');
//  }

//  lastBytesSent = 0;
//  lastTimeStamp = 0;
//  rtcObject = null;

//  resolveRouter('home');
// }


// function toggleMute() {
//  if (!localStream) {
//   createToast('error', 'No active call!', 'You are not in a call.');
//   return;
//  };
//  audioEnabled = !audioEnabled;
//  localStream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
//  createToast('success', audioEnabled ? 'Microphone unmuted!' : 'Microphone muted!', audioEnabled ? 'Enabled microphone stream.' : 'Disabled microphone stream.');
// }


// function toggleMask() {
//  if (!localStream) {
//   console.log('You are not in a call.');
//   return;
//  };
//  videoEnabled = !videoEnabled;
//  localStream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
//  createToast('success', videoEnabled ? 'Camera on!' : 'Camera off!', videoEnabled ? 'Enabled camera stream.' : 'Disabled camera stream.');
// }


// function setupCallEvents(call) {
//  if (currentCall) currentCall.close();
//  currentCall = call;

//  call.on('stream', remoteStream => {
//   const videoTrack = remoteStream.getVideoTracks()[0];
//   const videoStream = new MediaStream([videoTrack]);

//   const audioTrack = remoteStream.getAudioTracks()[0];
//   const audioStream = new MediaStream([audioTrack]);

//   remoteVideo.srcObject = videoStream;
//   remoteAudio.srcObject = audioStream;
//  });

//  call.on('close', () => {
//   endCall();
//  });

//  call.on('error', err => {
//   createToast('error', 'Call error!', 'An error occurred during the call.');
//   endCall();
//  });

//  rtcObject = call.peerConnection;
//  if (connCheckupInterval) clearInterval(connCheckupInterval);
//  connCheckupInterval = setInterval(() => {
//   console.log(rtcObject)
//  }, 5000);

//  rtcObject.oniceconnectionstatechange = () => {
//   if (rtcObject.iceConnectionState === 'disconnected' ||
//    rtcObject.iceConnectionState === 'failed') {
//    createToast('error', 'Call disconnected!', 'Connection lost with peer.');
//    endCall();
//   }
//  };

//  resolveRouter('call');
// }


// function setupPeerEventListeners() {
//  peer.on('open', id => {
//   const urlParams = new URLSearchParams(window.location.search);
//   const peerIdToJoin = urlParams.get('peer');

//   if (peerIdToJoin) {
//    createToast('error', 'Calling!', `Connecting to peer: ${peerIdToJoin}`);
//    callPeer(peerIdToJoin);
//    return;
//   }
//  });

//  peer.on('call', call => {
//   getMediaStream(prefFacingMode).then(stream => {
//    localStream = stream;
//    localVideo.srcObject = stream;

//    resolveRouter('call');

//    call.answer(stream);
//    setupCallEvents(call);
//    createToast('success', 'Incoming call!', `${call.metadata.name} is calling.`);
//   }).catch(err => {
//    createToast('error', 'Call not answered!', 'Error accessing media devices.');
//   });
//  });

//  peer.on('disconnected', () => {
//   createToast('error', 'Server disconnected!', 'Connection lost. Trying to reconnect...');
//   peer.reconnect();
//  });

//  peer.on('close', () => {
//   createToast('error', 'Instance deleted!', 'You are now signed out. Refresh or revisit the site to create a new instance.');
//   endCall();
//  });

//  peer.on('error', err => {
//   // console.error('Peer error:', err);
//   createToast('error', 'Peer.js error!', 'A peer error occurred.');
//  });
// }


// function main() {
//  controller = new AbortController();
//  signal = controller.signal;

//  const savedTheme = localStorage.getItem('whispr-theme') || 'light';
//  if (savedTheme === 'dark') {
//   document.documentElement.classList.add('dark');
//  }

//  modalCloseBtn.addEventListener('click', closeModal, { signal });
//  openSidebarBtn.addEventListener('click', setSidebar, { signal });
//  toggleThemeBtn.addEventListener('click', toggleTheme, { signal });

//  for (let button of viewNavBtns) {
//   button.addEventListener('click', function() {
//    resolveRouter(button.dataset.page)
//   }, { signal });
//  }

//  profileForm.addEventListener('reset', deleteProfile, { signal });
//  profileForm.addEventListener('submit', updateProfile, { signal });

//  window.addEventListener('online', function() {
//   createToast('success', 'Back online!', 'You are back online!');
//  }, { signal });
//  window.addEventListener('offline', function() {
//   createToast('error', 'You are now offline!', 'Check your wifi network or cellular connection.');
//  }, { signal });
//  document.addEventListener("visibilitychange", function() {
//   let state = document.visibilityState;
//   if (state === 'visible') {
//    createToast('success', 'Hey! Welcome back.', 'Where did you go?')
//   }
//  }, { signal });
//  window.addEventListener('hashchange', resolveRouter, { signal });

//  setupPeerEventListeners();
//  initProfileForm();
//  resolveRouter();
// }


// window.addEventListener('DOMContentLoaded', main);
// window.addEventListener('beforeunload', function(e) {
//  controller.abort();
//  console.log('Listeners detached!');

//  if (localStream) {
//   localStream.getTracks().forEach(track => track.stop());
//   localStream = null;
//   console.log('Media devices released');
//  }

//  if (currentCall) {
//   try {
//    currentCall.close();
//   } catch (e) {
//    console.warn('Error while closing call:', e);
//   }
//   currentCall = null;
//   console.log('Call ended');
//  }

//  if (peer) {
//   peer.destroy();
//   console.log('Peer.js Instance destroyed');
//  }
// });




let controller = null;
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
const localVideo = document.getElementById('call-video-local');
const remoteVideo = document.getElementById('call-video-remote');
const remoteAudio = document.getElementById('call-audio-remote');
const callControls = document.getElementById('call-controls-container');
const toggleMuteBtn = document.getElementById('btn-toggle-mute');
const toggleMaskBtn = document.getElementById('btn-toggle-mask');
const toggleFullscreenBtn = document.getElementById('btn-toggle-fullscreen');
const endCallBtn = document.getElementById('btn-end-call');
const profileForm = document.getElementById('form-update-profile');
const profPicContainer = document.getElementById('profile-picture-container');
const callPeerBtn = document.getElementById('btn-call-peer');
const copyIdBtn = document.getElementById('btn-copy-id');
const shareUrlBtn = document.getElementById('btn-share-url');

const savedPeerId = sessionStorage.getItem('whispr-peer-id') || generateId();
const peer = new Peer(savedPeerId);

function isOverlayVisible() { return !overlay.classList.contains('hidden'); }

function isSidebarOpen() { return !sidebarEl.classList.contains('-translate-x-full'); }

function isModalVisible() { return !modalEl.classList.contains('hidden'); }

function getHash() { return location.hash.slice(2); }

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
 const image = profPicContainer.querySelector('img');
 const placeholder = profPicContainer.querySelector('i');
 
 switch (type) {
  case 'reset':
   if (!image.classList.contains('hidden')) {
    image.classList.add('hidden');
    image.src = '';
   }
   if (placeholder.classList.contains('hidden')) {
    placeholder.classList.remove('hidden');
   }
   break;
   
  case 'set':
   if (!url) {
    updateProfilePicture('reset');
    return;
   }
   
   if (image.classList.contains('hidden')) {
    image.classList.remove('hidden');
   }
   if (!placeholder.classList.contains('hidden')) {
    placeholder.classList.add('hidden');
   }
   
   image.src = url;
   break;
 }
}

function initProfileForm() {
 profileData = JSON.parse(localStorage.getItem('whispr-profile'));
 
 if (!profileData) {
  profileForm.name.value = '';
  profileForm.profilePicture.value = '';
  profileForm.email.value = '';
  profileForm.bio.value = '';
  updateProfilePicture('reset');
  return;
 }
 
 profileForm.name.value = profileData.name;
 profileForm.profilePicture.value = profileData.profilePicture;
 profileForm.email.value = profileData.email;
 profileForm.bio.value = profileData.bio;
 updateProfilePicture('set', profileData.profilePicture);
}

function updateProfile(e) {
 e.preventDefault();
 
 profileData = {
  name: this.name.value || 'Unknown',
  profilePicture: this.profilePicture.value || null,
  email: this.email.value || null,
  bio: this.bio.value || null
 };
 
 localStorage.setItem('whispr-profile', JSON.stringify(profileData));
 initProfileForm();
 createToast('success', 'Profile Updated!', 'But! Be mindful of the information you enter.');
}

function deleteProfile() {
 showModal(
  "Delete Profile",
  "Are you sure you want to delete your profile information?",
  () => {
   localStorage.removeItem('whispr-profile');
   profileData = null;
   initProfileForm();
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
  localVideo.srcObject = stream;
  
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
 localVideo.srcObject = null;
 remoteVideo.srcObject = null;
 remoteAudio.srcObject = null;
 
 // Clear connection monitoring
 if (connCheckupInterval) {
  clearInterval(connCheckupInterval);
  connCheckupInterval = null;
 }
 
 // Reset call state
 currentCall = null;
 rtcObject = null;
 
 setInCallInteractions(false);
}

function endCall() {
 showModal(
  "End Call",
  "Are you sure you want to end the current call?",
  () => {
   cleanupCallResources();
   createToast('success', 'Call ended', 'The call has been disconnected');
   resolveRouter('home');
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
}

function toggleMask() {
 if (!localStream) {
  createToast('error', 'No active call', 'You are not in a call');
  return;
 }
 
 videoEnabled = !videoEnabled;
 localStream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
 createToast('success',
  videoEnabled ? 'Camera on' : 'Camera off',
  videoEnabled ? 'Camera enabled' : 'Camera disabled');
}

function setupCallEvents(call) {
 if (currentCall) currentCall.close();
 currentCall = call;
 
 call.on('stream', remoteStream => {
  const videoStream = new MediaStream([remoteStream.getVideoTracks()[0]]);
  const audioStream = new MediaStream([remoteStream.getAudioTracks()[0]]);
  
  remoteVideo.srcObject = videoStream;
  remoteAudio.srcObject = audioStream;
 });
 
 call.on('close', endCall);
 call.on('error', () => {
  createToast('error', 'Call error', 'An error occurred');
  endCall();
 });
 
 // Setup connection monitoring
 rtcObject = call.peerConnection;
 if (connCheckupInterval) clearInterval(connCheckupInterval);
 
 connCheckupInterval = setInterval(() => {
  if (rtcObject && ['disconnected', 'failed'].includes(rtcObject.iceConnectionState)) {
   createToast('error', 'Connection lost', 'Peer disconnected');
   endCall();
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
   getMediaStream(prefFacingMode)
    .then(stream => {
     localStream = stream;
     localVideo.srcObject = stream;
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
  endCall();
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
 setupPeerEventListeners();
 initProfileForm();
 resolveRouter();
}

// Event listeners for cleanup
window.addEventListener('DOMContentLoaded', main);
window.addEventListener('beforeunload', cleanupApp);
// window.addEventListener('pagehide', cleanupApp);