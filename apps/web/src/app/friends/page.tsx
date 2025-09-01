"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Mail, 
  Users, 
  Search, 
  Send, 
  MoreVertical,
  UserX,
  Flag,
  LogOut
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  timestamp?: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export default function FriendsPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "mail" | "club">("friends");

  // Mock data
  const friends: Friend[] = [
    {
      id: "1",
      name: "Captain Blackbeard",
      lastMessage: "Ready for the next battle!",
      timestamp: "2m ago",
      isOnline: true
    },
    {
      id: "2", 
      name: "Admiral Storm",
      lastMessage: "Great duel yesterday",
      timestamp: "1h ago",
      isOnline: false
    },
    {
      id: "3",
      name: "Pirate Jenny",
      lastMessage: "Check out my new deck!",
      timestamp: "3h ago",
      isOnline: true
    }
  ];

  const messages: Message[] = [
    {
      id: "1",
      senderId: "1",
      senderName: "Captain Blackbeard",
      content: "Ahoy! Ready for another epic card battle?",
      timestamp: "10:30 AM"
    },
    {
      id: "2",
      senderId: "me",
      senderName: "You",
      content: "Aye! My deck is stronger than ever!",
      timestamp: "10:32 AM"
    },
    {
      id: "3",
      senderId: "1",
      senderName: "Captain Blackbeard",
      content: "Ready for the next battle!",
      timestamp: "10:35 AM"
    }
  ];

  const systemMails = [
    {
      id: "mail1",
      subject: "Welcome to Cards of Power!",
      preview: "Your pirate adventure begins...",
      timestamp: "1d ago"
    },
    {
      id: "mail2", 
      subject: "Daily Rewards Available",
      preview: "Claim your treasure chest...",
      timestamp: "6h ago"
    }
  ];

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle sending message
      setNewMessage("");
    }
  };

  const getSelectedFriend = () => {
    return friends.find(f => f.id === selectedConversation);
  };

  return (
    <div 
      style={{ backgroundImage: "url('/assets/backgrounds/friend.png')" }}
      className="h-screen w-screen bg-cover bg-center flex text-black"
    >
      <div className="flex w-full h-full">
        {/* LEFT SIDEBAR */}
        <div className="w-1/3 bg-[rgba(125,75,26,0.9)] backdrop-blur-sm border-r border-[rgba(69,26,3,0.5)] flex flex-col">
          <div className="p-4 border-b border-[rgba(69,26,3,0.3)]">
            {/* Back button */}
            <Link href="/" className="block mb-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-black/60 text-white border-white/40 hover:bg-black/80 transition-colors"
              >
                ← Back to Home
              </Button>
            </Link>
            <h1 className="text-xl font-[var(--font-pirata-one)] text-black mb-4">
              Pirate Communications
            </h1>
            
            {/* Tab buttons */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === "friends" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("friends")}
                className={`flex items-center gap-2 ${
                  activeTab === "friends" 
                    ? "bg-[rgb(69,26,3)] text-white" 
                    : "bg-transparent border-black text-black hover:bg-black/10"
                }`}
              >
                <Users size={16} />
                Friends
              </Button>
              
              <Button
                variant={activeTab === "mail" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("mail")}
                className={`flex items-center gap-2 ${
                  activeTab === "mail" 
                    ? "bg-[rgb(69,26,3)] text-white" 
                    : "bg-transparent border-black text-black hover:bg-black/10"
                }`}
              >
                <Mail size={16} />
                Mail
              </Button>
              
              <Button
                variant={activeTab === "club" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("club")}
                className={`flex items-center gap-2 ${
                  activeTab === "club" 
                    ? "bg-[rgb(69,26,3)] text-white" 
                    : "bg-transparent border-black text-black hover:bg-black/10"
                }`}
              >
                <Users size={16} />
                Club
              </Button>
            </div>

            {/* Search bar */}
            {activeTab === "friends" && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60" size={16} />
                <Input
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-transparent border-black text-black placeholder:text-black/60 font-[var(--font-pirata-one)]"
                />
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "mail" && (
              <div className="p-2">
                {systemMails.map((mail) => (
                  <div
                    key={mail.id}
                    className="p-3 mb-2 bg-[rgba(69,26,3,0.2)] rounded-lg cursor-pointer hover:bg-[rgba(69,26,3,0.3)] transition-colors"
                    onClick={() => setSelectedConversation(mail.id)}
                  >
                    <div className="font-[var(--font-pirata-one)] text-black font-semibold text-sm">
                      {mail.subject}
                    </div>
                    <div className="text-black/70 text-xs mt-1">
                      {mail.preview}
                    </div>
                    <div className="text-black/50 text-xs mt-1">
                      {mail.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "club" && (
              <div className="p-4 text-center">
                <Users size={48} className="mx-auto text-black/50 mb-2" />
                <p className="text-black/70 font-[var(--font-pirata-one)]">
                  Club feature coming soon!
                </p>
              </div>
            )}

            {activeTab === "friends" && (
              <div className="p-2">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === friend.id
                        ? "bg-[rgba(69,26,3,0.4)]"
                        : "bg-[rgba(69,26,3,0.2)] hover:bg-[rgba(69,26,3,0.3)]"
                    }`}
                    onClick={() => setSelectedConversation(friend.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-[rgb(69,26,3)] rounded-full flex items-center justify-center">
                          <span className="text-white font-[var(--font-pirata-one)] text-sm">
                            {friend.name.charAt(0)}
                          </span>
                        </div>
                        {friend.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-[var(--font-pirata-one)] text-black font-semibold text-sm">
                          {friend.name}
                        </div>
                        <div className="text-black/70 text-xs truncate">
                          {friend.lastMessage}
                        </div>
                      </div>
                      <div className="text-black/50 text-xs">
                        {friend.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CONVERSATION AREA */}
        <div className="flex-1 bg-[rgba(125,75,26,0.7)] backdrop-blur-m flex flex-col">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-[rgba(69,26,3,0.3)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activeTab === "friends" && (
                    <>
                      <div className="w-10 h-10 bg-[rgb(69,26,3)] rounded-full flex items-center justify-center">
                        <span className="text-white font-[var(--font-pirata-one)] text-sm">
                          {getSelectedFriend()?.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h2 className="font-[var(--font-pirata-one)] text-black font-semibold">
                          {getSelectedFriend()?.name}
                        </h2>
                        <p className="text-black/60 text-xs">
                          {getSelectedFriend()?.isOnline ? "Online" : "Last seen 1h ago"}
                        </p>
                      </div>
                    </>
                  )}
                  
                  {activeTab === "mail" && (
                    <div className="flex items-center gap-3">
                      <Mail className="text-black" size={24} />
                      <h2 className="font-[var(--font-pirata-one)] text-black font-semibold">
                        System Mail
                      </h2>
                    </div>
                  )}

                  {activeTab === "club" && (
                    <div className="flex items-center gap-3">
                      <Users className="text-black" size={24} />
                      <h2 className="font-[var(--font-pirata-one)] text-black font-semibold">
                        Pirate Club
                      </h2>
                    </div>
                  )}
                </div>

                {/* Three dot menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-black hover:bg-black/10">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[rgba(125,75,26,0.95)] border-[rgba(69,26,3,0.5)]">
                    <DropdownMenuItem className="text-black hover:bg-black/10 cursor-pointer">
                      <Flag size={14} className="mr-2" />
                      Report
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-black hover:bg-black/10 cursor-pointer">
                      {activeTab === "club" ? (
                        <>
                          <LogOut size={14} className="mr-2" />
                          Leave
                        </>
                      ) : (
                        <>
                          <UserX size={14} className="mr-2" />
                          Unfollow
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === "friends" && messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.senderId === "me"
                          ? "bg-[rgb(69,26,3)] text-white"
                          : "bg-[rgba(255,255,255,0.8)] text-black"
                      }`}
                    >
                      <p className="font-[var(--font-pirata-one)] text-sm">
                        {message.content}
                      </p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === "me" ? "text-white/70" : "text-black/60"
                      }`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}

                {activeTab === "mail" && (
                  <div className="bg-[rgba(255,255,255,0.9)] rounded-lg p-6">
                    <h3 className="font-[var(--font-pirata-one)] text-black text-lg mb-4">
                      Welcome to Cards of Power!
                    </h3>
                    <p className="font-[var(--font-pirata-one)] text-black/80 mb-4">
                      Ahoy, brave pirate! Welcome aboard the most legendary card game on the seven seas. 
                      Your journey to become the ultimate pirate captain starts now!
                    </p>
                    <p className="font-[var(--font-pirata-one)] text-black/80 mb-4">
                      Here's what awaits you:
                    </p>
                    <ul className="font-[var(--font-pirata-one)] text-black/80 space-y-2 ml-4">
                      <li>• Build your legendary deck in the Workshop</li>
                      <li>• Battle other pirates on the Battlefield</li>
                      <li>• Discover rare treasures in the Shop</li>
                      <li>• Connect with fellow pirates</li>
                    </ul>
                    <p className="font-[var(--font-pirata-one)] text-black/80 mt-4">
                      May the winds be at your back and your cards be ever in your favor!
                    </p>
                    <p className="font-[var(--font-pirata-one)] text-black/60 text-sm mt-4">
                      - The Cards of Power Dev Team
                    </p>
                  </div>
                )}

                {activeTab === "club" && (
                  <div className="text-center py-8">
                    <Users size={64} className="mx-auto text-black/30 mb-4" />
                    <p className="font-[var(--font-pirata-one)] text-black/60">
                      Club conversations will appear here
                    </p>
                  </div>
                )}
              </div>

              {/* Message Input (only for friends and club) */}
              {(activeTab === "friends" || activeTab === "club") && (
                <div className="p-4 border-t border-[rgba(69,26,3,0.3)]">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 bg-[rgba(255,255,255,0.8)] border-black text-black placeholder:text-black/60 font-[var(--font-pirata-one)]"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-[rgb(69,26,3)] text-white hover:bg-[rgb(89,36,13)] disabled:opacity-50"
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users size={64} className="mx-auto text-black/30 mb-4" />
                <p className="font-[var(--font-pirata-one)] text-black/60 text-lg">
                  Select a conversation to start chatting
                </p>
                <p className="font-[var(--font-pirata-one)] text-black/50 text-sm mt-2">
                  Choose from mail, club, or friends
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}