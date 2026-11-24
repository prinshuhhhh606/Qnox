import React from 'react';
import { Send, MessageSquare } from 'lucide-react';

export default function MessagesTab({
  members,
  activeChatMember,
  setActiveChatMember,
  loadChat,
  chatMessages,
  chatInput,
  setChatInput,
  handleSendChat,
  currentUser,
}) {
  return (
    <div className="max-w-6xl mx-auto h-[680px] trainer-glass-card flex overflow-hidden">
      {/* Member List */}
      <div className="w-1/3 border-r border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <h3 className="font-serif text-sm uppercase tracking-wider text-neutral-300">Athlete Roster</h3>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-900 custom-scrollbar">
          {members.map((m) => (
            <button
              key={m._id}
              onClick={() => {
                setActiveChatMember(m);
                loadChat(m._id);
              }}
              className={`w-full p-3.5 flex items-center gap-3 text-left transition ${
                activeChatMember?._id === m._id ? 'bg-[#c5a880]/10 border-l-2 border-l-[#c5a880]' : 'hover:bg-neutral-900/40'
              }`}
            >
              <img
                src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                alt=""
                className="w-9 h-9 rounded-full object-cover border border-[#c5a880]/30"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-neutral-200 truncate">{m.name}</p>
                <p className="text-[10px] text-neutral-500 truncate">{m.fitnessGoal || 'General Fitness'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat View */}
      <div className="flex-1 flex flex-col justify-between bg-black/40">
        {activeChatMember ? (
          <>
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeChatMember.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-[#c5a880]/30"
                />
                <div>
                  <p className="text-xs font-semibold text-neutral-200">{activeChatMember.name}</p>
                  <p className="text-[10px] text-emerald-400">Direct Athlete Channel</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="text-center py-20 text-xs text-neutral-500">
                  No message history yet. Send a guidance note or workout plan!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.sender?._id === currentUser?._id || msg.sender?.role === 'Trainer';
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs md:max-w-md p-3 rounded-lg text-xs ${
                          isMe
                            ? 'bg-[#c5a880]/20 text-neutral-100 border border-[#c5a880]/40'
                            : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <span className="block text-[9px] text-neutral-500 text-right mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-neutral-800 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type workout instruction, diet advice or feedback..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
              />
              <button
                onClick={handleSendChat}
                className="trainer-btn-primary p-2.5 rounded-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-xs">
            <MessageSquare className="w-8 h-8 text-[#c5a880]/40 mb-2" />
            Select an athlete from the roster to start direct communication.
          </div>
        )}
      </div>
    </div>
  );
}
