import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import api from '../../utils/api';
import * as process from 'process';
import { Buffer } from 'buffer';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Maximize2, Minimize2 } from 'lucide-react';

// Polyfill for simple-peer in Vite
if (typeof window !== 'undefined') {
    window.global = window;
    window.process = process;
    window.Buffer = Buffer;
}

const RemoteTile = ({ peer, name }) => {
    const ref = useRef();
    const [hasStream, setHasStream] = useState(false);
    const [isFs, setIsFs] = useState(false);
    const boxRef = useRef();
    useEffect(() => {
        peer.on('stream', s => {
            setHasStream(true);
            if (ref.current) ref.current.srcObject = s;
        });
    }, [peer]);
    const toggleFs = () => {
        const el = boxRef.current;
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen?.();
            setIsFs(true);
        } else {
            document.exitFullscreen?.();
            setIsFs(false);
        }
    };
    return (
        <div ref={boxRef} className="relative bg-black rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-800 h-64 md:h-72 lg:h-80">
            <video playsInline autoPlay ref={ref} className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/40" />
            <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-black/60 text-white">{name || 'Participant'}</div>
            <button onClick={toggleFs} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded hover:bg-black/70">
                {isFs ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            {!hasStream && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-300 text-sm bg-black/50 px-3 py-2 rounded">Connecting...</div>
                </div>
            )}
        </div>
    );
};

const LiveRoom = () => {
    // Debug logging requested by user
    console.log('authToken:', localStorage.getItem('authToken')); 
    console.log('token:', localStorage.getItem('token')); 
    console.log('All localStorage:', {...localStorage});

    console.log('LIVE ROOM DEBUG', {
        user: localStorage.getItem('user'),
        currentUser: localStorage.getItem('currentUser'),
        token: localStorage.getItem('authToken'),
    });
    const { id: roomId } = useParams();
    const navigate = useNavigate();
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const [user, setUser] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [waiting, setWaiting] = useState(true);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [roomName, setRoomName] = useState(null);
    const pollRef = useRef(null);
    const [approved, setApproved] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const localBoxRef = useRef();
    const [localFs, setLocalFs] = useState(false);

    // Fetch User & Room Status
    useEffect(() => {
        let cancelled = false;

        const stopPolling = () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };

        const checkStatus = async () => {
            try {
                const userRes = await api.get('/me');
                console.log('📥 User data received:', userRes.data);
                if (cancelled) return;
                setUser(userRes.data);
                console.log('✅ User state set:', userRes.data);

                const statusRes = await api.get(`/group-studies/${roomId}/status`);
                if (cancelled) return;
                const isCreator = statusRes.data.creatorId === userRes.data.id;
                setIsHost(isCreator);

                if (statusRes.data.meetingLink) {
                    setRoomName(statusRes.data.meetingLink);
                } else if (statusRes.data.isLive) {
                    setRoomName(roomId);
                }

                if (isCreator) {
                    // Creator starts the room
                    if (!statusRes.data.isLive) {
                        const started = await api.post(`/group-studies/${roomId}/live`, { isLive: true });
                        if (!cancelled && started?.data?.roomName) {
                            setRoomName(started.data.roomName);
                        } else if (!cancelled) {
                            setRoomName(roomId);
                        }
                    }
                    stopPolling();
                    setWaiting(false);
                } else {
                    // Guests wait for room to be live
                    if (statusRes.data.isLive) {
                        stopPolling();
                        setWaiting(false);
                    } else {
                        // Poll for status
                        stopPolling();
                        pollRef.current = setInterval(async () => {
                            try {
                                const res = await api.get(`/group-studies/${roomId}/status`);
                                if (cancelled) return;
                                if (res.data.meetingLink) {
                                    setRoomName(res.data.meetingLink);
                                }
                                if (res.data.isLive) {
                                    setWaiting(false);
                                    stopPolling();
                                }
                            } catch (e) { console.error(e); }
                        }, 3000);
                    }
                }
            } catch (err) {
                console.error('Failed to init:', err);
                stopPolling();
                setError('Failed to load room configuration.');
            }
        };
        checkStatus();

        return () => {
            cancelled = true;
            stopPolling();
        };
    }, [roomId]);

    useEffect(() => {
        if (waiting || !user) return;
        if (!roomName) return;

        console.log('🔌 Connecting to Socket.IO...', { roomName, userId: user.id, isHost });

        socketRef.current = io('/', { path: '/socket.io' });

        socketRef.current.on('connect', () => {
            console.log('✅ Socket connected:', socketRef.current.id);

            if (isHost) {
                console.log('👑 Emitting join-room as HOST');
                socketRef.current.emit('join-room', roomName, user.id);
            }
        });

        if (isHost) {
            socketRef.current.on('join-request', (req) => {
                console.log('📨 Join request received:', req);
                setPendingRequests(prev => [...prev, req]);
            });
        } else {
            console.log('👤 Joining as GUEST');
            socketRef.current.on('join-approved', () => {
                console.log('✅ Join approved!');
                setApproved(true);
            });
            socketRef.current.on('join-rejected', (payload) => {
                console.log('❌ Join rejected:', payload);
                setRequestSent(false);
                setError(payload?.reason || 'Join request rejected');
            });
        }

        return () => {
            if (socketRef.current) {
                console.log('🔌 Disconnecting socket');
                socketRef.current.disconnect();
            }
        };
    }, [waiting, user, roomId, roomName, isHost]);

    useEffect(() => {
        if (waiting || !user) return;
        if (!roomName) return;
        if (!isHost && !approved) return;

        (async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(s);
                if (userVideo.current) {
                    userVideo.current.srcObject = s;
                }
                if (!isHost) socketRef.current.emit('join-room', roomName, user.id);
                socketRef.current.on('user-connected', ({ userId, socketId }) => {
                    const peer = createPeer(socketId, socketRef.current.id, s);
                    peersRef.current.push({ peerID: socketId, peer });
                    setPeers(users => [...users, { peerID: socketId, peer }]);
                });
                socketRef.current.on('user-disconnected', socketId => {
                    const peerObj = peersRef.current.find(p => p.peerID === socketId);
                    if (peerObj) {
                        peerObj.peer.destroy();
                    }
                    const peers = peersRef.current.filter(p => p.peerID !== socketId);
                    peersRef.current = peers;
                    setPeers(peers);
                });
                socketRef.current.on('offer', payload => {
                    const item = peersRef.current.find(p => p.peerID === payload.callerID);
                    if (item) {
                        item.peer.signal(payload.signal);
                        return;
                    }
                    const peer = addPeer(payload.signal, payload.callerID, s);
                    peersRef.current.push({ peerID: payload.callerID, peer });
                    setPeers(users => [...users, { peerID: payload.callerID, peer }]);
                });
                socketRef.current.on('answer', payload => {
                    const item = peersRef.current.find(p => p.peerID === payload.id);
                    if (item) {
                        item.peer.signal(payload.signal);
                    }
                });
                socketRef.current.on('ice-candidate', payload => {
                    const item = peersRef.current.find(p => p.peerID === payload.id);
                    if (item) {
                        item.peer.signal(payload.candidate);
                    }
                });
            } catch (e) {
                setError('Unable to access camera/microphone. Check permissions and HTTPS.');
            }
        })();

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [approved, waiting, user, roomId, roomName, isHost]);

    const sendJoinRequest = () => {
        console.log('🚀 SENDING JOIN REQUEST', {
            roomName,
            groupId: roomId,
            userId: user?.id,
            name: user ? `${user.firstName} ${user.lastName}` : null,
            socketConnected: !!socketRef.current?.connected
        });

        if (!socketRef.current?.connected) {
            console.error('❌ Socket not connected!');
            return;
        }

        if (!user) {
            console.error('❌ Cannot send join request: user is null');
            setError('Unable to identify user. Please re-login and try again.');
            return;
        }

        if (requestSent) {
            console.log('ℹ️ Join request already sent, ignoring duplicate click');
            return;
        }

        setError(null);
        socketRef.current.emit('join-request', {
            roomName,
            groupId: roomId,
            userId: user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Guest'
        });
        console.log('✅ Join request emitted');
        setRequestSent(true);
    };

    const approveReq = (socketId) => {
        if (!socketRef.current) return;
        setPendingRequests(prev => prev.filter(r => r.socketId !== socketId));
        socketRef.current.emit('approve-request', { targetSocketId: socketId, roomName });
    };

    const rejectReq = (socketId) => {
        if (!socketRef.current) return;
        setPendingRequests(prev => prev.filter(r => r.socketId !== socketId));
        socketRef.current.emit('reject-request', { targetSocketId: socketId, roomName });
    };

    const peerConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            // Public TURN server (Open Relay Project) as fallback for testing
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ]
    };

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
            config: peerConfig
        });

        peer.on('signal', signal => {
            socketRef.current.emit('offer', { target: userToSignal, callerID: socketRef.current.id, signal });
        });

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
            config: peerConfig
        });

        peer.on('signal', signal => {
            socketRef.current.emit('answer', { target: callerID, id: socketRef.current.id, signal });
        });

        peer.signal(incomingSignal);

        return peer;
    }

    const leaveRoom = () => {
        if (isHost) {
             api.post(`/group-studies/${roomId}/live`, { isLive: false });
        }
        navigate('/dashboard/group-studies');
    };

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (waiting) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="bg-gray-800 p-8 rounded-xl shadow-lg text-center text-white">
                    <div className="text-2xl font-semibold mb-2">Waiting for Host</div>
                    <div className="text-gray-300">The host has not started the meeting yet.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900">
            <div className="flex-1 flex flex-col p-4">
                <div className="flex justify-between items-center mb-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="text-xl font-bold">Live Study Room</div>
                        <div className="text-xs px-2 py-1 rounded bg-gray-700">{isHost ? 'Host' : approved ? 'Participant' : 'Requesting'}</div>
                    </div>
                    <button onClick={leaveRoom} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Leave Room</button>
                </div>

                {!isHost && !approved && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="bg-gray-800 text-white p-8 rounded-xl w-full max-w-md text-center">
                            <div className="text-lg font-semibold mb-2">Request Access</div>
                            <div className="text-gray-300 mb-6">Only the host can approve your entry.</div>
                            <button onClick={sendJoinRequest} disabled={requestSent} className="w-full py-3 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                                {requestSent ? 'Waiting for approval...' : 'Send Join Request'}
                            </button>
                        </div>
                    </div>
                )}

                {(isHost || approved) && (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div ref={localBoxRef} className="relative bg-black rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-800 h-64 md:h-72 lg:h-80">
                            <video muted ref={userVideo} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/40" />
                            <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-black/60 text-white">You</div>
                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button onClick={() => {
                                        if (!stream) return;
                                        const tracks = stream.getAudioTracks();
                                        const next = !micOn;
                                        tracks.forEach(t => t.enabled = next);
                                        setMicOn(next);
                                    }} className="p-2 rounded bg-black/50 text-white hover:bg-black/70">
                                        {micOn ? <Mic size={16} /> : <MicOff size={16} />}
                                    </button>
                                    <button onClick={() => {
                                        if (!stream) return;
                                        const tracks = stream.getVideoTracks();
                                        const next = !camOn;
                                        tracks.forEach(t => t.enabled = next);
                                        setCamOn(next);
                                    }} className="p-2 rounded bg-black/50 text-white hover:bg-black/70">
                                        {camOn ? <VideoIcon size={16} /> : <VideoOff size={16} />}
                                    </button>
                                </div>
                                <button onClick={() => {
                                    const el = localBoxRef.current;
                                    if (!el) return;
                                    if (!document.fullscreenElement) {
                                        el.requestFullscreen?.();
                                        setLocalFs(true);
                                    } else {
                                        document.exitFullscreen?.();
                                        setLocalFs(false);
                                    }
                                }} className="p-2 rounded bg-black/50 text-white hover:bg-black/70">
                                    {localFs ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>
                            </div>
                        </div>
                        {peers.map((peer) => (
                            <RemoteTile key={peer.peerID} peer={peer.peer} name={peer.userId ? String(peer.userId).slice(0,6) : 'Participant'} />
                        ))}
                    </div>
                )}
            </div>
            <div className="w-80 border-l border-gray-800 bg-gray-850 p-4 hidden md:block">
                {isHost ? (
                    <div>
                        <div className="text-white font-semibold mb-3">Requests</div>
                        {pendingRequests.length === 0 ? (
                            <div className="text-gray-400 text-sm">No requests</div>
                        ) : (
                            <div className="space-y-3">
                                {pendingRequests.map(r => (
                                    <div key={r.socketId} className="bg-gray-800 text-white p-3 rounded flex items-center justify-between">
                                        <div className="text-sm">{r.name || r.userId}</div>
                                        <div className="flex gap-2">
                                            <button onClick={() => approveReq(r.socketId)} className="px-2 py-1 rounded bg-green-600">Approve</button>
                                            <button onClick={() => rejectReq(r.socketId)} className="px-2 py-1 rounded bg-red-600">Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-white">
                        <div className="font-semibold mb-3">Status</div>
                        <div className="text-sm text-gray-300">{approved ? 'Approved' : requestSent ? 'Pending approval' : 'Not requested'}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveRoom;
