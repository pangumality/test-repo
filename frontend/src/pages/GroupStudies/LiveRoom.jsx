import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import api from '../../utils/api';
import * as process from 'process';
import { Buffer } from 'buffer';

// Polyfill for simple-peer in Vite
if (typeof window !== 'undefined') {
    window.global = window;
    window.process = process;
    window.Buffer = Buffer;
}

const Video = ({ peer }) => {
    const ref = useRef();

    useEffect(() => {
        peer.on('stream', stream => {
            if (ref.current) {
                ref.current.srcObject = stream;
            }
        });
    }, [peer]);

    return (
        <video playsInline autoPlay ref={ref} className="w-full h-full object-cover rounded-lg bg-gray-900" />
    );
};

const LiveRoom = () => {
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

    // Fetch User & Room Status
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const userRes = await api.get('/me');
                setUser(userRes.data);

                const statusRes = await api.get(`/group-studies/${roomId}/status`);
                const isCreator = statusRes.data.creatorId === userRes.data.id;
                setIsHost(isCreator);

                if (isCreator) {
                    // Creator starts the room
                    if (!statusRes.data.isLive) {
                        await api.post(`/group-studies/${roomId}/live`, { isLive: true });
                    }
                    setWaiting(false);
                } else {
                    // Guests wait for room to be live
                    if (statusRes.data.isLive) {
                        setWaiting(false);
                    } else {
                        // Poll for status
                        const interval = setInterval(async () => {
                            try {
                                const res = await api.get(`/group-studies/${roomId}/status`);
                                if (res.data.isLive) {
                                    setWaiting(false);
                                    clearInterval(interval);
                                }
                            } catch (e) { console.error(e); }
                        }, 3000);
                        return () => clearInterval(interval);
                    }
                }
            } catch (err) {
                console.error('Failed to init:', err);
                setError('Failed to load room configuration.');
            }
        };
        checkStatus();
    }, [roomId]);

    // Initialize WebRTC
    useEffect(() => {
        if (waiting || !user) return;

        // Connect to Socket.io (Relative path, handled by Vite Proxy)
        socketRef.current = io('/', {
            path: '/socket.io'
        });

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            setStream(stream);
            if (userVideo.current) {
                userVideo.current.srcObject = stream;
            }

            socketRef.current.emit('join-room', roomId, user.id);

            socketRef.current.on('user-connected', ({ userId, socketId }) => {
                const peer = createPeer(socketId, socketRef.current.id, stream);
                peersRef.current.push({
                    peerID: socketId,
                    peer,
                });
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
                
                // If offer comes from someone we don't have a peer for yet (should be rare with this logic but possible)
                // Actually, the logic below handles 'receiving returned signal'.
                // Wait, standard simple-peer mesh logic:
                // 1. A joins.
                // 2. A gets 'all users'. A initiates to B, C.
                // 3. B receives signal from A. B adds peer A (non-initiator).
                
                // My socket logic in index.js was:
                // join-room -> emit user-connected.
                // A joins. Emits join-room.
                // B receives user-connected(A). B creates Peer(initiator: true) to A.
                // A receives offer from B. A creates Peer(initiator: false).
                
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                });
                setPeers(users => [...users, { peerID: payload.callerID, peer }]);
            });

            socketRef.current.on('answer', payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                if(item) {
                    item.peer.signal(payload.signal);
                }
            });
            
            socketRef.current.on('ice-candidate', payload => {
                 const item = peersRef.current.find(p => p.peerID === payload.id);
                 if(item) {
                     item.peer.signal(payload.candidate);
                 }
            });
        });
        
        return () => {
             if(socketRef.current) socketRef.current.disconnect();
             if(stream) stream.getTracks().forEach(track => track.stop());
        }

    }, [waiting, user, roomId]);

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
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
        navigate('/group-studies');
    };

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (waiting) {
        return (
             <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                    <h2 className="text-2xl font-bold mb-4">Waiting for Host</h2>
                    <p className="text-gray-600">The host has not started the meeting yet.</p>
                    <p className="text-sm text-gray-500 mt-2">Please wait...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900 p-4">
             {/* Header */}
             <div className="flex justify-between items-center mb-4 text-white">
                <h1 className="text-xl font-bold">Live Study Room</h1>
                <button 
                    onClick={leaveRoom}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                    Leave Room
                </button>
             </div>

             {/* Video Grid */}
             <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {/* Local User */}
                <div className="relative bg-black rounded-lg overflow-hidden">
                    <video muted ref={userVideo} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                        You
                    </div>
                </div>

                {/* Remote Peers */}
                {peers.map((peer) => (
                    <div key={peer.peerID} className="relative bg-black rounded-lg overflow-hidden">
                        <Video peer={peer.peer} />
                    </div>
                ))}
             </div>
        </div>
    );
};

export default LiveRoom;
