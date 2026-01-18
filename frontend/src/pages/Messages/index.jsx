import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Check,
  CheckCheck,
  ChevronDown,
  User as UserIcon,
  Shield,
  GraduationCap,
  Book,
  Loader2
} from 'lucide-react';
import api from '../../utils/api';

// --- Utils ---
const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- Components ---

const ConversationItem = ({ conversation, isActive, onClick, currentUserId }) => {
  const lastMsg = conversation.lastMessage;
  
  return (
    <div 
      onClick={() => onClick(conversation)}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50 border-l-4 border-transparent'
      }`}
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
          {conversation.name.charAt(0)}
        </div>
        {/* Online indicator placeholder - can be implemented with socket.io later */}
        {/* <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span> */}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="font-semibold text-gray-800 truncate flex items-center gap-1">
            {conversation.name}
          </h4>
          <span className="text-xs text-gray-400 whitespace-nowrap">{lastMsg ? formatTime(lastMsg.sentAt) : ''}</span>
        </div>
        <div className="flex justify-between items-end">
            <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
            {lastMsg ? lastMsg.content : 'No messages yet'}
            </p>
            {conversation.unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {conversation.unreadCount}
                </span>
            )}
        </div>
      </div>
    </div>
  );
};

const ChatMessage = ({ message, isOwn, participants, currentUserId, currentUserRole }) => {
  // Determine read status
  // A message is read if AT LEAST ONE other participant has read it (since 1:1 focus)
  // Logic: Exists a participant P where P.userId != currentUserId AND P.lastReadAt >= message.sentAt
  
  const isRead = isOwn && participants?.some(p => 
    p.userId !== currentUserId && 
    p.lastReadAt && 
    new Date(p.lastReadAt) >= new Date(message.sentAt)
  );

  const displayName = (() => {
    if (!message.sender) return '';
    if (currentUserRole === 'admin' && message.sender.role === 'school_admin') {
      return message.sender.school?.name || message.sender.firstName;
    }
    return message.sender.firstName;
  })();

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
        isOwn 
          ? 'bg-blue-600 text-white rounded-tr-none' 
          : 'bg-gray-100 text-gray-800 rounded-tl-none'
      }`}>
        {!isOwn && <p className="text-xs font-bold mb-1 text-gray-500">{displayName}</p>}
        <p className="text-sm">{message.content}</p>
        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
          {formatTime(message.sentAt)}
          {isOwn && (
             isRead ? <CheckCheck size={14} /> : <Check size={14} />
          )}
        </div>
      </div>
    </div>
  );
};

const ClassSelectorModal = ({ open, classes, onClose, onConfirm }) => {
  if (!open) return null;
  const [selected, setSelected] = React.useState([]);
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Select Classes</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
          {classes.map(c => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={(e)=>{
                  if (e.target.checked) setSelected(prev => [...prev, c.id]);
                  else setSelected(prev => prev.filter(id => id!==c.id));
                }}
              />
              <span>{c.name}</span>
            </label>
          ))}
          {classes.length === 0 && (
            <div className="text-sm text-gray-500">No classes available.</div>
          )}
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            disabled={selected.length===0}
            onClick={()=>onConfirm(selected)}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const NewMessageModal = ({ isOpen, onClose, onStartChat, onStartBroadcast, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBroadcastMode, setIsBroadcastMode] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [broadcastChoice, setBroadcastChoice] = useState(null);
  const [classSelectorOpen, setClassSelectorOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRecipients();
      if (currentUser?.role === 'teacher') fetchTeacherClasses();
    }
  }, [isOpen]);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/recipients');
      setRecipients(data);
    } catch (error) {
      console.error('Failed to fetch recipients', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherClasses = async () => {
    try {
      const { data } = await api.get('/teacher/classes');
      setTeacherClasses(data || []);
    } catch (e) {}
  };

  const filteredUsers = recipients.filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800">New Message</h3>
            <p className="text-xs text-gray-500">Select a recipient or use broadcast if available</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or role..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {(currentUser?.role === 'admin' || currentUser?.role === 'school_admin' || currentUser?.role === 'teacher') && (
            <div className="mt-3 flex items-center justify-between">
              <label className="text-sm text-gray-600">Broadcast</label>
              <input type="checkbox" checked={isBroadcastMode} onChange={(e)=>setIsBroadcastMode(e.target.checked)} />
            </div>
          )}
        </div>
        
        {!isBroadcastMode ? (
        <div className="overflow-y-auto p-2 space-y-1 min-h-[200px]">
          {loading ? (
             <div className="flex justify-center items-center h-full">
               <Loader2 className="animate-spin text-blue-500" />
             </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div 
                key={user.id} 
                onClick={() => onStartChat(user)}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  {user.firstName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-800">{user.firstName} {user.lastName}</p>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 group-hover:bg-white transition-colors">
                      {user.role}
                    </span>
                  </div>
                  {user.detail && <p className="text-xs text-gray-400 truncate">{user.detail}</p>}
                </div>
              </div>
            ))
          ) : (
             <div className="p-8 text-center text-gray-400">
               <p>No users found.</p>
             </div>
          )}
        </div>
        ) : (
          <div className="p-4 space-y-3">
            {currentUser?.role === 'admin' && (
              <div className="space-y-2">
                <button
                  onClick={()=>onStartBroadcast({ scope: 'school_admin_all' })}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Broadcast to all school admins
                </button>
                <div className="grid grid-cols-2 gap-2">
                   {['Admission', 'Accounts', 'Transport', 'Hostel', 'Academic'].map(dept => (
                     <button
                       key={dept}
                       onClick={()=>onStartBroadcast({ scope: 'school_admin_department', department: dept })}
                       className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded text-sm"
                     >
                       {dept} Dept
                     </button>
                   ))}
                </div>
              </div>
            )}
            {currentUser?.role === 'school_admin' && (
              <div className="space-y-2">
                <button
                  onClick={()=>onStartBroadcast({ scope: 'teachers_all' })}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Broadcast to all teachers
                </button>
                <button
                  onClick={()=>onStartBroadcast({ scope: 'parents_all' })}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Broadcast to all parents
                </button>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Broadcast to school admin department</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={()=>onStartBroadcast({ scope: 'school_admin_department', department: 'finance' })} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg">Finance</button>
                    <button onClick={()=>onStartBroadcast({ scope: 'school_admin_department', department: 'library' })} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg">Library</button>
                    <button onClick={()=>onStartBroadcast({ scope: 'school_admin_department', department: 'transport' })} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg">Transport</button>
                    <button onClick={()=>onStartBroadcast({ scope: 'school_admin_department', department: 'sports' })} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg">Sports</button>
                    <button onClick={()=>onStartBroadcast({ scope: 'school_admin_department', department: 'exams' })} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg">Exams</button>
                  </div>
                </div>
              </div>
            )}
            {currentUser?.role === 'teacher' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    className={`flex-1 px-3 py-2 rounded-lg ${broadcastChoice==='class_students'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`}
                    onClick={()=>{
                      setBroadcastChoice('class_students');
                      setClassSelectorOpen(true);
                    }}
                  >
                    Class students
                  </button>
                  <button
                    className={`flex-1 px-3 py-2 rounded-lg ${broadcastChoice==='class_parents'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`}
                    onClick={()=>{
                      const classIds = (teacherClasses || []).map(c => c.id);
                      onStartBroadcast({ scope: 'class_parents', classIds });
                    }}
                  >
                    Class parents
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <ClassSelectorModal
        open={classSelectorOpen}
        classes={teacherClasses}
        onClose={()=>setClassSelectorOpen(false)}
        onConfirm={(classIds)=>{
          setClassSelectorOpen(false);
          onStartBroadcast({ scope: broadcastChoice, classIds });
        }}
      />
    </div>
  );
};

export default function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const messagesEndRef = useRef(null);
  const isWindowFocused = useRef(true);

  useEffect(() => {
    const onFocus = () => { isWindowFocused.current = true; };
    const onBlur = () => { isWindowFocused.current = false; };

    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    // Load current user
    const user = JSON.parse(localStorage.getItem('currentUser'));
    setCurrentUser(user);
    if (user) {
        fetchConversations();
    }
  }, []);

  const fetchConversations = async () => {
    setLoadingConvos(true);
    try {
      const { data } = await api.get('/conversations');
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setLoadingConvos(false);
    }
  };

  useEffect(() => {
    if (selectedConversation && selectedConversation.id !== 'new') {
        fetchMessages(selectedConversation.id);
        markAsRead(selectedConversation.id);
        
        // Set up polling for new messages (simple version)
        const interval = setInterval(() => {
            fetchMessages(selectedConversation.id);
            // Mark as read only if window is focused
            if (isWindowFocused.current) {
                markAsRead(selectedConversation.id);
            }
        }, 5000);
        return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const fetchMessages = async (conversationId) => {
    try {
        const { data } = await api.get(`/conversations/${conversationId}/messages`);
        setMessages(data.messages);
        setParticipants(data.participants);
    } catch (error) {
        console.error('Failed to fetch messages', error);
    }
  };

  const markAsRead = async (conversationId) => {
      try {
          await api.post(`/conversations/${conversationId}/read`);
          // Refresh conversations list to update badges
          // But don't trigger full reload logic
          const { data } = await api.get('/conversations');
          setConversations(data);
      } catch (error) {
          console.error('Failed to mark as read', error);
      }
  };

  // Removed auto-scroll on message load

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
        let recipientId;
        
        if (selectedConversation) {
            const otherParticipant = selectedConversation.participants.find(p => p.id !== currentUser.id);
            if (otherParticipant) {
                recipientId = otherParticipant.id;
            } else {
                recipientId = currentUser.id;
            }
        }

        const { data: sentMessage } = await api.post('/messages', {
            recipientId,
            content: newMessage
        });

        fetchMessages(selectedConversation.id);
        setNewMessage('');
        
        // Update conversation list last message
        fetchConversations();
        
    } catch (error) {
        console.error('Failed to send message', error);
        alert('Failed to send message');
    }
  };

  const startNewChat = async (targetUser) => {
    setIsModalOpen(false);
    
    // Check if we already have a conversation with this user locally
    const existing = conversations.find(c => 
        c.participants.length === 1 && c.participants[0].id === targetUser.id
    );

    if (existing) {
        setSelectedConversation(existing);
    } else {
        const tempConvo = {
            id: 'new', // Flag
            name: `${targetUser.firstName} ${targetUser.lastName}`,
            participants: [targetUser], // Simplified
            lastMessage: null,
            tempRecipientId: targetUser.id,
            unreadCount: 0
        };
        setSelectedConversation(tempConvo);
        setMessages([]);
        setParticipants([]);
    }
  };

  // Wrapper for send message to handle "new" conversation
  const onSendClick = async (e) => {
      e.preventDefault();
      if (!newMessage.trim()) return;

      if (selectedConversation?.id === 'new') {
          // First message to new recipient
          try {
              const { data: sentMsg } = await api.post('/messages', {
                  recipientId: selectedConversation.tempRecipientId,
                  content: newMessage
              });
              
              // Now refresh conversations to get the real ID
              const { data: convos } = await api.get('/conversations');
              setConversations(convos);
              setNewMessage('');
              
              // Find the new conversation
              const newConvo = convos.find(c => 
                  c.participants.some(p => p.id === selectedConversation.tempRecipientId)
              );
              if (newConvo) {
                  setSelectedConversation(newConvo);
                  fetchMessages(newConvo.id);
              }
          } catch (error) {
              console.error(error);
          }
      } else if (selectedConversation?.id === 'broadcast') {
          try {
              const body = { content: newMessage, ...(selectedConversation.opts||{}) };
              const { data } = await api.post('/messages/broadcast', body);
              setNewMessage('');
              fetchConversations();
          } catch (error) {
              console.error('Broadcast failed', error);
              alert('Broadcast failed');
          }
      } else {
          handleSendMessage(e);
      }
  };

  if (!currentUser) return (
    <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar */}
      <div className="w-80 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvos ? (
             <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400"/></div>
          ) : conversations.length > 0 ? (
            conversations.map(convo => (
              <ConversationItem 
                key={convo.id} 
                conversation={convo} 
                isActive={selectedConversation?.id === convo.id}
                onClick={setSelectedConversation}
                currentUserId={currentUser.id}
              />
            ))
          ) : (
            <div className="text-center p-8 text-gray-400">
              <p>No conversations.</p>
              <button onClick={() => setIsModalOpen(true)} className="text-blue-500 hover:underline mt-2">Start a chat</button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                  {(selectedConversation.id === 'broadcast' ? 'B' : (selectedConversation.name || 'Chat')[0])}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    {selectedConversation.id === 'broadcast' ? 'Broadcast' : (selectedConversation.name || 'Chat')}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <button className="p-2 hover:bg-gray-50 rounded-full"><Phone size={20} /></button>
                <button className="p-2 hover:bg-gray-50 rounded-full"><Video size={20} /></button>
                <button className="p-2 hover:bg-gray-50 rounded-full"><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 py-12">No messages yet</div>
              )}
              {messages.map(msg => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  isOwn={msg.senderId === currentUser.id}
                  participants={participants}
                  currentUserId={currentUser.id}
                  currentUserRole={currentUser.role}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={onSendClick} className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Send size={32} className="text-gray-300 ml-1" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600">Your Messages</h3>
            <p className="mt-2">Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      <NewMessageModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onStartChat={startNewChat}
        onStartBroadcast={(opts)=>{
          setIsModalOpen(false);
          setSelectedConversation({ id: 'broadcast', opts });
          setMessages([]);
          setParticipants([]);
        }}
        currentUser={currentUser}
      />
    </div>
  );
}
