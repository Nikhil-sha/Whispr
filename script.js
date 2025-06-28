// Storage Module
const WhisprStorage = {
	list: [],
	
	init() {
		try {
			const stored = localStorage.getItem('WhisprPeerList');
			if (stored) {
				this.list = JSON.parse(stored);
			}
		} catch (error) {
			console.error("Failed to load stored list:", error);
			this.list = [];
		}
	},
	
	updateList(newItem) {
		if (this.list.length >= 4) {
			this.list.shift();
		}
		this.list.push(newItem);
		localStorage.setItem('WhisprPeerList', JSON.stringify(this.list));
	},
	
	clear() {
		this.list = [];
		localStorage.removeItem('WhisprPeerList');
	}
};

// State Management
const AppState = {
	baseUrl: window.location.origin + window.location.pathname,
	peer: new Peer(),
	localStream: null,
	currentCall: null,
	lastBytesSent: 0,
	lastTimeStamp: 0,
	connCheckupInterval: null,
	rtcObject: null,
	audioEnabled: true,
	videoEnabled: true,
	prefFacingMode: 'user'
};

// DOM Elements
const DOM = {
	mainSections: document.querySelector('main').children,
	localVideo: document.getElementById('video-local'),
	remoteAudio: document.getElementById('audio-remote'),
	remoteVideo: document.getElementById('video-remote'),
	fullscreenBtn: document.getElementById('btn-toggle-fullscreen'),
	maskBtn: document.getElementById('btn-mask'),
	muteBtn: document.getElementById('btn-mute'),
	switchFacingBtn: document.getElementById('btn-switch-facing'),
	callBtn: document.getElementById('btn-call'),
	endCallBtn: document.getElementById('btn-end-call'),
	profileBtn: document.getElementById('btn-profile'),
	shareIdBtn: document.getElementById('btn-share-id'),
	shareUrlBtn: document.getElementById('btn-share-url'),
	qualityInd: document.getElementById('ind-quality'),
	rttInd: document.getElementById('ind-rtt'),
	bitrateInd: document.getElementById('ind-bitrate'),
	packetsInd: document.getElementById('ind-packets'),
	cameraInd: document.getElementById('ind-camera'),
	toastContainer: document.getElementById('toast-container')
};

// UI Functions
function showToast(message, type = 'info') {
	const duration = message.split(' ').length * 800;
	
	const toast = document.createElement('div');
	toast.className = `flex items-center gap-3 w-fit px-6 py-3 rounded-3xl text-white text-sm shadow-lg ${
    type === 'error' ? 'bg-red-500' : 'bg-gray-800'
  }`;
	toast.style.animation = `fadeInOut ${duration - 100}ms ease forwards`;
	toast.innerHTML = message + `<button class="flex-shrink-0 size-8 rounded-3xl flex items-center justify-center text-white bg-white/10">
    <i class="ri-close-line"></i>
  </button>`;
	
	DOM.toastContainer.appendChild(toast);
	
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

// Media Functions
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

function toggleMute() {
	if (!AppState.localStream) {
		showToast('You are not in a call.');
		return;
	};
	AppState.audioEnabled = !AppState.audioEnabled;
	AppState.localStream.getAudioTracks().forEach(track => track.enabled = AppState.audioEnabled);
	muteBtn.querySelector('i').className = AppState.audioEnabled ? 'ri-mic-line' : 'ri-mic-off-line';
	showToast(AppState.audioEnabled ? 'Microphone unmuted' : 'Microphone muted');
}

function toggleMask() {
	if (!AppState.localStream) {
		showToast('You are not in a call.');
		return;
	};
	AppState.videoEnabled = !AppState.videoEnabled;
	AppState.localStream.getVideoTracks().forEach(track => track.enabled = AppState.videoEnabled);
	DOM.maskBtn.querySelector('i').className = AppState.videoEnabled ? 'ri-camera-line' : 'ri-camera-off-line';
	showToast(AppState.videoEnabled ? 'Camera on' : 'Camera off');
}

function switchFacing() {
	const switchTo = AppState.prefFacingMode === 'user' ? 'environment' : 'user';
	showToast(`Camera Switched (${switchTo === 'user' ? 'Front' : 'Back'}). Reconnection needed to apply changes.`);
	AppState.prefFacingMode = switchTo;
	updateIndicator(DOM.cameraInd, null, switchTo === 'user' ? 'Front' : 'Back')
}

function switchSection(sectionIndex = 0) {
	if (DOM.mainSections[sectionIndex].classList.contains('hidden')) {
		DOM.mainSections[sectionIndex].classList.remove('hidden');
		[...DOM.mainSections].forEach((section, i) => {
			if (i == sectionIndex) return;
			if (section.classList.contains('hidden')) return;
			section.classList.add('hidden');
		})
	}
}

function setInCallInteraction(state) {
	switchFacingBtn.disabled = !state;
	maskBtn.disabled = state;
	muteBtn.disabled = state;
	endCallBtn.disabled = state;
}

// Call Management
function setupCallEvents(call) {
	if (AppState.currentCall) AppState.currentCall.close();
	AppState.currentCall = call;
	
	call.on('stream', remoteStream => {
		const videoTrack = remoteStream.getVideoTracks()[0];
		const videoStream = new MediaStream([videoTrack]);
		
		const audioTrack = remoteStream.getAudioTracks()[0];
		const audioStream = new MediaStream([audioTrack]);
		
		DOM.remoteVideo.srcObject = videoStream;
		DOM.remoteAudio.srcObject = audioStream;
	});
	
	call.on('close', () => {
		endCall();
		showToast('Call ended.');
	});
	
	call.on('error', err => {
		showToast('An error occurred during the call.', 'error');
		endCall();
	});
	
	AppState.rtcObject = call.peerConnection;
	if (AppState.connCheckupInterval) clearInterval(AppState.connCheckupInterval);
	AppState.connCheckupInterval = setInterval(updateConnectionQuality, 2000);
	
	AppState.rtcObject.oniceconnectionstatechange = () => {
		if (AppState.rtcObject.iceConnectionState === 'disconnected' ||
			AppState.rtcObject.iceConnectionState === 'failed') {
			endCall();
			showToast('Connection lost with peer.');
		}
	};
	
	switchSection(1);
	setInCallInteraction(true);
}

function callPeer(peerId) {
	const remoteId = !peerId ? prompt('Enter peer ID to call:') : peerId;
	if (!remoteId) {
		showToast('Failed to call', 'error');
		return;
	};
	
	getMediaStream(AppState.prefFacingMode).then(stream => {
		AppState.localStream = stream;
		DOM.localVideo.srcObject = stream;
		
		const call = AppState.peer.call(remoteId, stream);
		setupCallEvents(call);
	}).catch(err => {
		showToast('Error accessing media devices.', 'error');
	});
}

function endCall() {
	if (AppState.connCheckupInterval) {
		clearInterval(AppState.connCheckupInterval);
		AppState.connCheckupInterval = null;
	}
	
	if (AppState.localStream) {
		AppState.localStream.getTracks().forEach(track => track.stop());
		AppState.localStream = null;
		showToast('Media devices released');
	}
	
	DOM.localVideo.srcObject = null;
	DOM.remoteVideo.srcObject = null;
	DOM.remoteAudio.srcObject = null;
	
	if (AppState.currentCall) {
		try {
			AppState.currentCall.close();
		} catch (e) {
			console.warn('Error while closing call:', e);
		}
		AppState.currentCall = null;
		showToast('Call ended!');
	}
	
	AppState.lastBytesSent = 0;
	AppState.lastTimeStamp = 0;
	AppState.rtcObject = null;
	
	updateIndicator(DOM.qualityInd, 'w-3 h-3 rounded-full bg-green-500 shadow-md animate-pulse', 'Excellent');
	updateIndicator(DOM.rttInd, null, 'null');
	updateIndicator(DOM.bitrateInd, null, 'null');
	updateIndicator(DOM.packetsInd, null, 'null');
	
	switchSection(0);
	setInCallInteraction(false);
}

// Connection Quality Monitoring
function updateConnectionQuality() {
	AppState.rtcObject.getStats(null).then(stats => {
		stats.forEach(report => {
			if (report.type === 'candidate-pair' && report.state === 'succeeded') {
				const rtt = report.currentRoundTripTime * 1000; // convert to ms
				
				if (rtt < 100) {
					updateIndicator(DOM.qualityInd, 'w-3 h-3 rounded-full bg-green-500 shadow-md animate-pulse', 'Excellent');
				} else if (rtt < 250) {
					updateIndicator(DOM.qualityInd, 'w-3 h-3 rounded-full bg-yellow-500 shadow-md animate-pulse', 'Good');
				} else if (rtt < 500) {
					updateIndicator(DOM.qualityInd, 'w-3 h-3 rounded-full bg-orange-500 shadow-md animate-pulse', 'Poor');
				} else {
					updateIndicator(DOM.qualityInd, 'w-3 h-3 rounded-full bg-red-500 shadow-md animate-pulse', 'Very Poor');
				}
				
				updateIndicator(DOM.rttInd, null, `${rtt.toFixed(2)} ms`)
			}
			
			if (report.type === 'outbound-rtp' && report.kind === 'video') {
				const bytesSent = report.bytesSent;
				const now = report.timestamp;
				
				if (AppState.lastTimeStamp) {
					const bitrate = 8 * (bytesSent - AppState.lastBytesSent) / ((now - AppState.lastTimeStamp) / 1000); // bits/sec
					const kbps = (bitrate / 1000).toFixed(2);
					updateIndicator(DOM.bitrateInd, null, `${kbps} kbps`);
				}
				
				AppState.lastBytesSent = bytesSent;
				AppState.lastTimeStamp = now;
			}
			
			if (report.type === 'inbound-rtp' && report.kind === 'video') {
				updateIndicator(DOM.packetsInd, null, report.packetsLost)
			}
		});
	});
}

// Utility Functions
function toggleFullScreen() {
	if (!document.fullscreenElement) {
		DOM.mainSections[1].requestFullscreen();
		DOM.fullscreenBtn.querySelector('i').className = 'ri-fullscreen-exit-line';
	} else {
		document.exitFullscreen?.();
		DOM.fullscreenBtn.querySelector('i').className = 'ri-fullscreen-line';
	}
}

function shareUrl(type = 'url') {
	if (type === 'url') {
		navigator.share({
			title: 'Join my Whispr call!',
			text: 'Click to connect with me:',
			url: `${AppState.baseUrl}?peer=${AppState.peer.id}`
		}).then(() => {
			showToast('Link shared successfully!');
		}).catch(err => {
			console.error('Sharing failed:', err);
			showToast('Share failed. Try copying the link.', 'error');
		});
	} else {
		navigator.clipboard.writeText(AppState.peer.id)
			.then(() => showToast('Link copied to clipboard!'))
			.catch(() => showToast('Failed to copy link.', 'error'));
	}
}

// Initialization
function initApp() {
	const urlParams = new URLSearchParams(window.location.search);
	const peerIdToJoin = urlParams.get('peer');
	
	if (peerIdToJoin) {
		showToast(`Connecting to peer: ${peerIdToJoin}`);
		callPeer(peerIdToJoin);
		return;
	}
}

// Event Listeners
function setupPeerEventListeners() {
	AppState.peer.on('open', id => {
		initApp();
	});
	
	AppState.peer.on('call', call => {
		getMediaStream(AppState.prefFacingMode).then(stream => {
			AppState.localStream = stream;
			DOM.localVideo.srcObject = stream;
			
			switchSection(1);
			
			call.answer(stream);
			setupCallEvents(call);
			showToast('Incoming call.');
		}).catch(err => {
			showToast('Error accessing media devices.', 'error');
		});
	});
	
	AppState.peer.on('disconnected', () => {
		showToast('Connection lost. Trying to reconnect...');
		AppState.peer.reconnect();
	});
	
	AppState.peer.on('close', () => {
		showToast('Connection closed.');
		endCall();
	});
	
	AppState.peer.on('error', err => {
		console.error('Peer error:', err);
		showToast('A peer error occurred.', 'error');
	});
}

// Startup
window.addEventListener('DOMContentLoaded', () => {
	WhisprStorage.init();
	setupPeerEventListeners();
	
	DOM.toastContainer.addEventListener('click', (e) => {
		if (e.target.closest('button')) {
			e.target.closest('div').remove();
		}
	});
	
	DOM.fullscreenBtn.addEventListener('click', () => toggleFullScreen());
	DOM.maskBtn.addEventListener('click', () => toggleMask());
	DOM.muteBtn.addEventListener('click', () => toggleMute());
	// DOM.callBtn.addEventListener('click', () => callPeer());
	DOM.switchFacingBtn.addEventListener('click', () => switchFacing());
	DOM.endCallBtn.addEventListener('click', () => endCall());
	DOM.profileBtn.addEventListener('click', () => switchSection(2));
	DOM.shareUrlBtn.addEventListener('click', () => shareUrl());
	DOM.shareIdBtn.addEventListener('click', () => shareUrl('id'));
	
	showToast('Warning: This service is under development, some features may break. Please avoid long sessions and use it responsibly!', 'error');
});

window.addEventListener('beforeunload', () => {
	if (AppState.localStream) {
		AppState.localStream.getTracks().forEach(track => track.stop());
		AppState.localStream = null;
		showToast('Media devices released');
	}
	
	if (AppState.currentCall) {
		try {
			AppState.currentCall.close();
		} catch (e) {
			console.warn('Error while closing call:', e);
		}
		AppState.currentCall = null;
		showToast('Call ended');
	}
	
	if (AppState.peer) {
		AppState.peer.destroy();
		showToast('Peer.js Instance destroyed');
	}
});