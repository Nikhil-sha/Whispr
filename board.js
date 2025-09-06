const board = document.getElementById('canvas');
const container = board.parentElement;
const ctx = board.getContext('2d');
const colorEl = document.getElementById('strokeColor');
const alphaEl = document.getElementById('strokeAlpha');
const sizeEl = document.getElementById('strokeWidth');
const toolEl = document.getElementById('tool');
const clearBtn = document.getElementById('clearCanvas');
const undoBtn = document.getElementById('undoStroke');
const downloadBtn = document.getElementById('downloadCanvas');

let drawing = false,
  last = null,
  strokes = [],
  currentStroke = null,
  alphaVal = 255,
  currentTool = 'pen',
  canvasTranslate = {
    x: 0,
    y: 0,
    scale: 1
  };

// let lastSentTime = 0;
// const SEND_INTERVAL_MS = 33; // ~30fps
const MIN_MOVE_DIFF = 2; // px — minimum distance to send a point

function transformCanvas(transformType, transformValue) {
  switch (transformType) {
    case 'translateX':
      canvasTranslate.x += transformValue;
      board.style.left = canvasTranslate.x + 'px';
      break;
      
    case 'translateY':
      canvasTranslate.y += transformValue;
      board.style.top = canvasTranslate.y + 'px';
      break;
      
    case 'scale':
      // board.width = transformValue;
      // board.height = transformValue;
      ctx.scale(transformValue, transformValue)
      redrawAll()
      // resizeCanvas();
      break;
      
    default:
      console.log('Eat FiveStar! Do nothing!');
  }
}

function resizeCanvas() {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const w = Math.max(1, Math.floor(container.clientWidth));
  const h = Math.max(1, Math.floor(container.clientHeight));
  board.width = Math.floor(w * ratio);
  board.height = Math.floor(h * ratio);
  board.style.width = w + 'px';
  board.style.height = h + 'px';
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0); // drawing in CSS pixels
  // fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, board.width / ratio, board.height / ratio);
  redrawAll();
}
window.addEventListener('resize', resizeCanvas);

/* ========================
   DRAWING (with smoothing)
   - uses midpoint quadratic smoothing for rendering
   - compresses sent points by distance+throttle
   ======================== */
function setStyle(tool, color, size) {
  if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = size;
    ctx.strokeStyle = color;
  }
  else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = size;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
}

function setTool(newTool) {
  currentTool = newTool;
}

function redrawAll() {
  ctx.clearRect(0, 0, board.width / devicePixelRatio, board.height / devicePixelRatio);
  for (const s of strokes) {
    if (!s || s.length < 1) continue;
    drawSmoothedStroke(s);
  }
}

function drawSmoothedStroke(points) {
  if (!points || points.length === 0) return;
  const meta = points.meta || { tool: 'pen', color: 'rgba(0, 0, 0, 0.25)', size: 4 };
  setStyle(meta.tool, meta.color, meta.size);
  ctx.beginPath();
  if (points.length === 1) {
    const p = points[0];
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.01, p.y + 0.01); // tiny dot
    ctx.stroke();
    return;
  }
  // midpoint smoothing: p0 -> p1 -> p2, draw quadratic curve
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1],
      p1 = points[i],
      p2 = points[i + 1];
    const cx = p1.x;
    const cy = p1.y;
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    ctx.quadraticCurveTo(cx, cy, mx, my);
  }
  // final line to last
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

/* canvas events — send compressed point stream to host only */
function toCanvasCoords(e) {
  const rect = container.getBoundingClientRect(); // transformed rect in screen coords
  // point within transformed container in screen pixels
  const px = e.clientX - rect.left - canvasTranslate.x;
  const py = e.clientY - rect.top - canvasTranslate.y;
  // invert scale: canvas logical (CSS) pixel = px / scale
  const x = px / canvasTranslate.scale;
  const y = py / canvasTranslate.scale;
  return { x, y };
}

function startDraw(e) {
  console.log(colorEl.value, alphaEl.value)
  drawing = true;
  last = toCanvasCoords(e);
  alphaVal = parseInt(alphaEl.value);
  currentStroke = [];
  currentStroke.meta = {
    tool: currentTool,
    color: colorEl.value.concat(alphaVal.toString(16)),
    size: parseInt(sizeEl.value, 10)
  };
  currentStroke.push(last);
  
  // ✅ draw first dot immediately
  redrawAll();
  drawSmoothedStroke(currentStroke);
  
  // notify host
  // sendToHost({ type: 'draw_begin', meta: currentStroke.meta, point: last, from: myPeerId });
}

function moveDraw(e) {
  if (!drawing) return;
  const p = toCanvasCoords(e);
  // distance filter
  const dx = p.x - last.x,
    dy = p.y - last.y;
  if (Math.hypot(dx, dy) < MIN_MOVE_DIFF) return;
  currentStroke.push(p);
  // incremental draw locally using smoothing (we'll just redraw entire stroke for simplicity)
  redrawAll();
  // drawSmoothedStroke(currentStroke.concat()); // temporary draw
  drawSmoothedStroke(currentStroke);
  last = p;
  
  // throttle send
  // const now = performance.now();
  // if (now - lastSentTime >= SEND_INTERVAL_MS) {
  //   lastSentTime = now;
  //   sendToHost({ type: 'draw_move', point: p, from: myPeerId });
  // }
}

function endDraw() {
  if (!drawing) return;
  drawing = false;
  strokes.push(currentStroke);
  
  // ✅ ensure single-dot strokes render immediately
  redrawAll();
  
  // sendToHost({ type: 'draw_end', from: myPeerId });
  currentStroke = null;
}

board.addEventListener('mousedown', startDraw);
board.addEventListener('mousemove', moveDraw);
window.addEventListener('mouseup', endDraw);
board.addEventListener('touchstart', (e) => {
  e.preventDefault();
  startDraw(e);
}, { passive: false });
board.addEventListener('touchmove', (e) => {
  e.preventDefault();
  moveDraw(e);
}, { passive: false });
board.addEventListener('touchend', (e) => {
  e.preventDefault();
  endDraw(e);
}, { passive: false });

clearBtn.addEventListener('click', () => {
  strokes = [];
  redrawAll();
  // if (isHost) hostBroadcast({ type: 'clear', from: myPeerId });
  // else sendToHost({ type: 'clear', from: myPeerId });
});
undoBtn.addEventListener('click', () => {
  strokes.pop();
  redrawAll();
  // if (isHost) hostBroadcast({ type: 'undo', from: myPeerId });
  // else sendToHost({ type: 'undo', from: myPeerId });
});
downloadBtn.addEventListener('click', () => {
  const a = document.createElement('a');
  a.download = 'whiteboard.png';
  a.href = board.toDataURL();
  a.click();
});

/* send to host helper (peer role) */
// function sendToHost(obj) {
//   if (isHost) {
//     hostBroadcast(obj);
//     return;
//   } else if (dataConn.host && dataConn.host.open) {
//     dataConn.host.send(obj)
//   }
// }

// /* host broadcast helper (host role) */
// function hostBroadcast(originPeerId, obj) {
//   // if originPeerId is actually object (we used two signatures): support both hostBroadcast(obj) and hostBroadcast(origin, obj)
//   if (typeof originPeerId === 'object') {
//     obj = originPeerId;
//     originPeerId = null;
//   }
//   for (const [pid, conn] of hostDataConns) {
//     if (originPeerId && pid === originPeerId) continue;
//     if (conn.open) conn.send(obj);
//   }
// }

// /* ========================
//   PeerJS Core + Host Mixer
//   ======================== */
// function initPeer(customId) {
//   if (peer) {
//     try { peer.destroy(); } catch {} /*cleanup maps*/ hostDataConns.clear();
//     hostForwardCalls.forEach((c) => { try { c.close(); } catch {} });
//     hostForwardCalls.clear();
//     hostIncomingStreams.clear();
//     mixerSources.forEach(s => s.disconnect());
//     mixerSources.clear();
//     if (audioContext) {
//       try { audioContext.close(); } catch {} audioContext = null;
//       mixerDestination = null;
//     }
//   }
//   peer = new Peer();
//   peer.on('open', id => {
//     myPeerId = id;
//     myIdEl.textContent = id;
//     const q = new URLSearchParams(location.search).get('host');
//     if (q && !isHost) {
//       hostInput.value = q;
//       joinHost(q);
//     }
//   });
//   peer.on('error', e => {
//     console.error('Peer error', e);
//     alert('PeerJS error: ' + e);
//   });

//   /* host receives data connections from peers */
//   peer.on('connection', conn => {
//     if (!isHost) { console.warn('unexpected conn to non-host from', conn.peer); return; }
//     setupHostDataConn(conn);
//   });

//   /* handle incoming calls */
//   peer.on('call', call => {
//     if (isHost) {
//       // inbound: a peer called host with their mic. Answer (with host mic if available), then add their stream to mixer.
//       ensureLocalStream().then(hostMic => {
//         try { call.answer(hostMic); } catch (e) { call.answer(); }
//         call.on('stream', remoteStream => {
//           // add to host mixer
//           addStreamToMixer(call.peer, remoteStream);
//         });
//         call.on('close', () => removeStreamer(call.peer));
//       }).catch(() => {
//         // no host mic — answer without sending
//         try { call.answer(); } catch (e) { call.answer(); }
//         call.on('stream', remoteStream => { addStreamToMixer(call.peer, remoteStream); });
//         call.on('close', () => removeStreamer(call.peer));
//       });
//     } else {
//       // peer receives a call from host (host calls peer with the mixed stream).
//       // answer with our mic (if we have), otherwise answer with nothing. Then play host's mixed stream on 'stream'
//       ensureLocalStream().then(ls => {
//         try { call.answer(ls); } catch (e) { call.answer(); }
//         call.on('stream', s => playMixedStreamForPeer(call.peer + '::' + (s.id || Math.random()), s));
//       }).catch(() => {
//         try { call.answer(); } catch (e) { call.answer(); }
//         call.on('stream', s => playMixedStreamForPeer(call.peer + '::' + (s.id || Math.random()), s));
//       });
//     }
//   });
// }

// /* ========== HOST: data conn setup ========== */
// function setupHostDataConn(conn) {
//   const pid = conn.peer;
//   hostDataConns.set(pid, conn);
//   addParticipant(pid);
//   conn.on('open', () => {
//     console.log('host data open from', pid);
//     // When a peer connects, host should call that peer with the current mixed stream (if exists)
//     if (mixerDestination && mixerDestination.stream) {
//       // create one outgoing call to this peer with the mixed stream and keep it
//       try {
//         const mixed = mixerDestination.stream;
//         const c = peer.call(pid, mixed);
//         hostForwardCalls.set(pid, c);
//         c.on('close', () => hostForwardCalls.delete(pid));
//         c.on('error', e => console.warn('forward call error', e));
//       } catch (e) { console.warn('failed to call new peer with mixed stream', e); }
//     }
//   });

//   conn.on('data', d => {
//     // host receives whiteboard & cursor events -> forward to other peers and apply locally
//     if (!d || !d.type) return;
//     // ensure we tag origin
//     const payload = Object.assign({}, d, { origin: pid });
//     hostBroadcast(pid, payload);
//     applyIncomingEvent(payload); // host mirror
//   });

//   conn.on('close', () => {
//     hostDataConns.delete(pid);
//     removeParticipant(pid);
//     // if we had a forward call to pid, close it
//     if (hostForwardCalls.has(pid)) { try { hostForwardCalls.get(pid).close(); } catch {} hostForwardCalls.delete(pid); }
//     removeStreamer(pid); // remove from mixer
//   });
// }

// /* ========== HOST: mixer helpers ==========
//   - create AudioContext and MediaStreamDestination
//   - add each incoming peer stream as a source node
//   - forward the mixerDestination.stream to peers by calling them (reused)
//   ======================================== */
// function ensureMixer() {
//   if (audioContext && mixerDestination) return;
//   audioContext = new(window.AudioContext || window.webkitAudioContext)();
//   mixerDestination = audioContext.createMediaStreamDestination();
//   // Also add host's own mic to the mixer if host has local mic
//   if (localStream) {
//     const src = audioContext.createMediaStreamSource(localStream);
//     src.connect(mixerDestination); // host hears themselves included in mix
//     mixerSources.set('host-local', src);
//   }
// }

// function addStreamToMixer(peerId, mediaStream) {
//   if (!audioContext) ensureMixer();
//   if (mixerSources.has(peerId)) {
//     // replace node: disconnect existing
//     try { mixerSources.get(peerId).disconnect(); } catch {}
//     mixerSources.delete(peerId);
//   }
//   try {
//     const src = audioContext.createMediaStreamSource(mediaStream);
//     src.connect(mixerDestination);
//     mixerSources.set(peerId, src);
//     hostIncomingStreams.set(peerId, mediaStream);
//     // ensure all connected peers are receiving the mixed stream: for any peer we don't have a forward call for, create one
//     for (const [pid, conn] of hostDataConns) {
//       if (pid === peerId) continue; // don't call the source peer? we still call them so they hear the mix; keep calling all
//       if (!hostForwardCalls.has(pid)) {
//         try {
//           const c = peer.call(pid, mixerDestination.stream);
//           hostForwardCalls.set(pid, c);
//           c.on('close', () => hostForwardCalls.delete(pid));
//           c.on('error', e => console.warn('forward error', e));
//         } catch (e) { console.warn('failed to forward mixed to', pid, e); }
//       }
//     }
//     console.log('added mixer source', peerId);
//   } catch (e) {
//     console.warn('error adding stream to mixer', e);
//   }
// }

// function removeStreamer(peerId) {
//   if (mixerSources.has(peerId)) {
//     try { mixerSources.get(peerId).disconnect(); } catch {}
//     mixerSources.delete(peerId);
//   }
//   if (hostIncomingStreams.has(peerId)) hostIncomingStreams.delete(peerId);
//   // remove forward calls that were created because of this peer? (we forward a single mixed stream, so keep calls; but if no sources remain and we want to tear down, optional)
//   if (mixerSources.size === 0) {
//     // optionally close forward calls until new sources come — but keep them open for simplicity
//   }
// }

// /* ========== PEER: join host ========== */
// function joinHost(hId) {
//   if (!peer) initPeer();
//   hostId = hId;
//   const conn = peer.connect(hId);
//   dataConn.host = conn;
//   conn.on('open', async () => {
//     console.log('connected to host', hId);
//     addParticipant(hId, true);
//     // call host with our mic (if available)
//     try {
//       const s = await ensureLocalStream();
//       const call = peer.call(hId, s);
//       call.on('stream', remoteStream => {
//         // remoteStream is mixed stream from host — play it
//         playMixedStreamForPeer('host-mix::' + (remoteStream.id || Math.random()), remoteStream);
//       });
//     } catch (e) { console.warn('mic not available for call to host', e); }
//   });
//   conn.on('data', d => applyIncomingEvent(d));
//   conn.on('close', () => {
//     console.log('disconnected from host');
//     removeParticipant(hId);
//   });
// }

// /* ========== APPLY incoming whiteboard events (host or peer) ==========
//   - payloads include {type, ... , origin}
//   ======================================== */
// function applyIncomingEvent(d) {
//   if (!d || !d.type) return;
//   switch (d.type) {
//     case 'draw_begin': {
//       const s = [];
//       s.meta = d.meta || { tool: 'pen', color: '#000', size: 4 };
//       s.push(d.point);
//       strokes.push(s);
//       redrawAll();
//       break;
//     }
//     case 'draw_move': {
//       const s = strokes[strokes.length - 1];
//       if (s) {
//         s.push(d.point);
//         redrawAll();
//       }
//       break;
//     }
//     case 'draw_end': {
//       redrawAll();
//       break;
//     }
//     case 'clear':
//       strokes = [];
//       redrawAll();
//       break;
//     case 'undo':
//       strokes.pop();
//       redrawAll();
//       break;
//     default:
//       break;
//   }
// }

// /* ========== AUDIO (peer): ensure local mic ================ */
// async function ensureLocalStream() {
//   if (localStream) return localStream;
//   try {
//     localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     micStateEl.textContent = 'on';
//     toggleMicBtn.textContent = 'Mute';
//     // if host and mixer exists, add host mic to mixer
//     if (isHost && audioContext && mixerDestination) {
//       const src = audioContext.createMediaStreamSource(localStream);
//       src.connect(mixerDestination);
//       mixerSources.set('host-local', src);
//     }
//     return localStream;
//   } catch (e) {
//     micStateEl.textContent = 'off';
//     toggleMicBtn.textContent = 'Enable Mic';
//     throw e;
//   }
// }
// toggleMicBtn.addEventListener('click', async () => {
//   if (!localStream) {
//     try { await ensureLocalStream(); } catch (e) { alert('Microphone denied/unavailable'); return; }
//   } else {
//     const t = localStream.getAudioTracks()[0];
//     if (t) {
//       t.enabled = !t.enabled;
//       micStateEl.textContent = t.enabled ? 'on' : 'muted';
//       toggleMicBtn.textContent = t.enabled ? 'Mute' : 'Unmute';
//     }
//   }
// });

// /* ========== playback helpers for peers ========== */
// const playingStreamIds = new Set();

// function playMixedStreamForPeer(key, stream) {
//   const id = stream && stream.id ? stream.id : key;
//   if (playingStreamIds.has(id)) return;
//   playingStreamIds.add(id);
//   const audio = document.createElement('audio');
//   audio.autoplay = true;
//   audio.controls = false;
//   audio.style.display = 'none';
//   audio.srcObject = stream;
//   document.body.appendChild(audio);
// }

/* ========== UI: participant list ========== */
// function addParticipant(pid, isHostFlag = false) {
//   if (document.getElementById('u-' + pid)) return;
//   const div = document.createElement('div');
//   div.id = 'u-' + pid;
//   div.className = 'user';
//   div.innerHTML = `<div style="display:flex;gap:8px;align-items:center"><div style="width:10px;height:10px;border-radius:50%;background:${colorFromId(pid)}"></div><div style="font-size:13px">${isHostFlag?pid+' (host)':pid}</div></div><div><button class="btn" onclick="togglePeerMute('${pid}')">Mute</button></div>`;
//   usersEl.appendChild(div);
// }

// function removeParticipant(pid) {
//   const el = document.getElementById('u-' + pid);
//   if (el) el.remove();
// }
// window.togglePeerMute = function(pid) {
//   // quick global mute toggle for all remote audio tracks (simple)
//   for (const audio of document.querySelectorAll('audio')) audio.muted = !audio.muted;
// }

// /* deterministic color */
// function colorFromId(id) { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360; return `hsl(${h} 70% 55%)`; }

// /* ========== HOST / JOIN / LEAVE UI ========== */
// function initPeerAndUI() {
//   initPeer();
//   resizeCanvas();
// }
// createHostBtn.addEventListener('click', () => {
//   isHost = true;
//   hostId = null;
//   // initPeerAndUI();
//   const wait = setInterval(() => {
//     if (myPeerId) {
//       clearInterval(wait);
//       hostId = myPeerId;
//       addParticipant(hostId, true);
//       hostInput.value = hostId;
//       // alert('Host ready. Share ID or copy link.');
//     }
//   }, 120);
// });
// joinBtn.addEventListener('click', () => {
//   const hid = hostInput.value.trim();
//   if (!hid) return alert('Paste host ID');
//   isHost = false;
//   // initPeerAndUI();
//   const wait = setInterval(() => {
//     if (myPeerId) {
//       clearInterval(wait);
//       joinHost(hid);
//     }
//   }, 120);
// });
// copyLinkBtn.addEventListener('click', () => {
//   if (!myPeerId) return alert('ID not ready yet');
//   const link = location.origin + location.pathname + '?host=' + myPeerId;
//   navigator.clipboard?.writeText(link).then(() => alert('Room link copied')).catch(() => prompt('Room link:', link));
// });
// leaveBtn.addEventListener('click', () => {
//   try { peer.destroy(); } catch (e) {} peer = null;
//   myPeerId = null;
//   isHost = false;
//   hostId = null;
//   hostDataConns.clear();
//   hostForwardCalls.forEach(c => { try { c.close(); } catch {} });
//   hostForwardCalls.clear();
//   hostIncomingStreams.clear();
//   mixerSources.forEach(s => s.disconnect());
//   mixerSources.clear();
//   if (audioContext) {
//     try { audioContext.close(); } catch {} audioContext = null;
//     mixerDestination = null;
//   }
//   usersEl.innerHTML = '';
//   myIdEl.textContent = '—';
//   alert('Left room / reset. Refresh to restart.');
// });

/* auto-init */
// initPeer();
resizeCanvas();

window.addEventListener('volumechange', () => transformCanvas('translateX', -10))