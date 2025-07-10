import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, AlertCircle, AtSign, Megaphone, ShieldAlert, Users, Info } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChatUser, Mention, Message } from "@/types/chat";
import { getMessages, postMessage } from "@/lib/chatService";
import { io } from "socket.io-client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import RoleSelector from "./RoleSelector";

// Mock data for mentions - filtered to only have admin and rescue team users
const mockUsers: ChatUser[] = [
  { id: "admin1", name: "Admin", email: "admin@example.com", role: "admin" },
  { id: "rescue1", name: "Rescue Team Alpha", email: "alpha@rescue.com", role: "rescue-team", teamId: "team1" },
  { id: "rescue2", name: "Rescue Team Beta", email: "beta@rescue.com", role: "rescue-team", teamId: "team2" },
];

// Initialize Socket.io with proper configuration
const socket = io("http://localhost:8080", {
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

const CommunityChat: React.FC = () => {
  const { user, userType } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debug user information
  useEffect(() => {
    console.log("Current user:", user);
    console.log("User type:", userType);
    console.log("Role from localStorage:", localStorage.getItem('role'));
    console.log("User from localStorage:", localStorage.getItem('user'));
  }, [user, userType]);
  
  // Check if the current user is authorized to chat (admin or rescue team)
  const canChat = user && (user.role === 'admin' || user.role === 'rescue-team');
  const isAdmin = user?.role === 'admin';
  const isRescueTeam = user?.role === 'rescue-team';
  
  // Create a current user object based on auth context
  const currentUser: ChatUser | null = user ? {
    id: user.email, // Use email as ID since the User interface doesn't have an id
    name: user.name,
    email: user.email,
    role: user.role as 'admin' | 'rescue-team' | 'user',
    // We don't have teamId in the User interface, so we can't set it here
  } : null;
  
  // Set up Socket.io listeners
  useEffect(() => {
    // Socket connection handlers
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setSocketConnected(true);
    });
    
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setSocketConnected(false);
    });
    
    // Listen for new messages
    socket.on("new_message", (newMessage: Message) => {
      console.log("New message received:", newMessage);
      setMessages(prev => [...prev, {
        ...newMessage,
        timestamp: new Date(newMessage.timestamp) // Ensure timestamp is a Date object
      }]);
    });
    
    // Clean up on component unmount
    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("new_message");
    };
  }, []);
  
  // Fetch messages on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await getMessages();
        
        // Convert timestamps to Date objects
        const formattedMessages = response.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, []);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current;
      // Use setTimeout to ensure DOM updates before scrolling
      setTimeout(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }, 100);
    }
  }, [messages]);
  
  // Filtered users for mentions - only admin and rescue team
  const filteredUsers = mockUsers
    .filter(user => user.role === 'admin' || user.role === 'rescue-team') // Only include admin/rescue
    .filter(user => user.name.toLowerCase().includes(mentionSearch.toLowerCase())); // Filter by search term
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Check for @ symbol to trigger mentions
    const lastAtSymbol = value.lastIndexOf('@');
    if (lastAtSymbol !== -1 && lastAtSymbol === value.length - 1) {
      setMentionStartPos(lastAtSymbol + 1);
      setMentionSearch("");
      setShowMentions(true);
    } else if (lastAtSymbol !== -1 && lastAtSymbol < value.length - 1) {
      const searchText = value.slice(lastAtSymbol + 1).split(' ')[0];
      setMentionSearch(searchText);
      setMentionStartPos(lastAtSymbol + 1);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };
  
  const handleSelectMention = (user: ChatUser) => {
    // Replace the current mention text with the selected username
    const beforeMention = newMessage.slice(0, mentionStartPos - 1); // -1 to remove the @ symbol
    const afterMention = newMessage.slice(mentionStartPos + mentionSearch.length);
    const newText = `${beforeMention}@${user.name} ${afterMention}`;
    
    setNewMessage(newText);
    setShowMentions(false);
    
    // Focus back on input
    inputRef.current?.focus();
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !canChat) return;
    
    // Extract mentions
    const mentions: Mention[] = [];
    const regex = /@([a-zA-Z0-9 ]+)/g;
    let match;
    
    while ((match = regex.exec(newMessage)) !== null) {
      const mentionedName = match[1].trim();
      const mentionedUser = mockUsers.find(u => u.name === mentionedName);
      
      if (mentionedUser) {
        mentions.push({
          userId: mentionedUser.id,
          username: mentionedUser.name,
          startPosition: match.index,
          endPosition: match.index + match[0].length
        });
      }
    }
    
    try {
      // Create message data
      const messageData = {
        content: newMessage,
        mentions,
        sender: currentUser,
        isAnnouncement: isAnnouncement && isAdmin // Only admins can make announcements
      };
      
      // Send the message to the server
      const response = await postMessage(messageData);
      
      // Emit via Socket.io directly as well
      if (socketConnected) {
        socket.emit('chat_message', response);
      }
      
      // Reset input and announcement toggle
      setNewMessage("");
      if (isAnnouncement) setIsAnnouncement(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const renderMessageContent = (message: Message) => {
    if (message.mentions.length === 0) {
      return <p className="text-sm">{message.content}</p>;
    }
    
    // Sort mentions by position to properly render them
    const sortedMentions = [...message.mentions].sort((a, b) => a.startPosition - b.startPosition);
    const parts = [];
    let lastIndex = 0;
    
    sortedMentions.forEach((mention, index) => {
      // Add text before mention
      if (mention.startPosition > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {message.content.substring(lastIndex, mention.startPosition)}
          </span>
        );
      }
      
      // Add mention
      parts.push(
        <span key={`mention-${index}`} className="text-primary font-medium">
          @{mention.username}
        </span>
      );
      
      lastIndex = mention.endPosition;
    });
    
    // Add remaining text after last mention
    if (lastIndex < message.content.length) {
      parts.push(
        <span key="text-last">
          {message.content.substring(lastIndex)}
        </span>
      );
    }
    
    return <p className="text-sm">{parts}</p>;
  };
  
  const renderDateDivider = (date: Date, index: number) => {
    if (index === 0) return true;
    
    const prevDate = messages[index - 1].timestamp;
    const currentDate = date;
    
    return prevDate.toDateString() !== currentDate.toDateString();
  };
  
  // Function to determine message styling based on sender role
  const getMessageStyles = (message: Message, isCurrentUser: boolean) => {
    // Base styles
    let containerClasses = "px-3 py-2 rounded-lg";
    let labelClasses = "";
    
    if (isCurrentUser) {
      // Current user's messages always on the right
      containerClasses += " bg-primary text-white rounded-tr-none";
    } else if (message.isAnnouncement) {
      // Announcements (admin only)
      containerClasses += " bg-yellow-500 text-white rounded-tl-none border-l-4 border-yellow-700";
      labelClasses = "flex items-center mb-1 font-bold";
    } else if (message.sender.role === 'admin') {
      // Admin messages
      containerClasses += " bg-destructive text-white rounded-tl-none border-l-4 border-red-800";
      labelClasses = "flex items-center mb-1 font-bold";
    } else if (message.sender.role === 'rescue-team') {
      // Rescue team messages
      containerClasses += " bg-secondary text-white rounded-tl-none";
    } else {
      // Fallback for any other role
      containerClasses += " bg-muted text-foreground rounded-tl-none";
    }
    
    return { containerClasses, labelClasses };
  };
  
  return (
    <Card className="flex flex-col h-[600px] w-full overflow-hidden">
      <div className="bg-primary px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <h3 className="font-medium text-lg">Command & Control Chat</h3>
          </div>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${socketConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-xs">{socketConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <p className="text-sm opacity-90">
          Secure communication channel for Admins and Rescue Teams
        </p>
      </div>
      
      {/* Role Selector for testing - remove in production */}
      <div className="p-4 border-b bg-amber-50">
        <div className="mb-2 flex items-center text-sm text-amber-800">
          <Info className="h-4 w-4 mr-1" />
          <span>For testing: Select a role to use in the chat</span>
        </div>
        <RoleSelector />
      </div>
      
      {/* Message Legend */}
      <div className="bg-gray-50 px-4 py-2 border-b flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <div className="flex items-center">
          <div className="flex items-center">
            <ShieldAlert className="h-3 w-3 text-destructive mr-1" />
            <span>Admin</span>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex items-center">
            <Users className="h-3 w-3 text-secondary mr-1" />
            <span>Rescue Team</span>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex items-center">
            <Megaphone className="h-3 w-3 text-yellow-500 mr-1" />
            <span>Announcement</span>
          </div>
        </div>
      </div>
      
      {/* Only show access restriction alert for non-admin, non-rescue team users */}
      {user && !canChat && (
        <Alert className="m-4 bg-amber-50 border-amber-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Only administrators and rescue team members can participate in this chat.
            Current role: <strong>{user.role}</strong>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Show a message if no user is logged in */}
      {!user && (
        <Alert className="m-4 bg-amber-50 border-amber-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Login Required</AlertTitle>
          <AlertDescription>
            Please use the role selector above to login and access the chat.
          </AlertDescription>
        </Alert>
      )}
      
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4" ref={scrollAreaRef}>
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <React.Fragment key={message.id}>
                  {renderDateDivider(message.timestamp, index) && (
                    <div className="flex justify-center my-4">
                      <div className="px-2 py-1 bg-muted rounded-full text-xs">
                        {formatDate(message.timestamp)}
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex ${currentUser && message.sender.id === currentUser.id ? "justify-end" : "justify-start"}`}>
                    <div className={`flex max-w-[80%] ${currentUser && message.sender.id === currentUser.id ? "flex-row-reverse" : "flex-row"}`}>
                      <Avatar className={`h-8 w-8 ${currentUser && message.sender.id === currentUser.id ? "ml-2" : "mr-2"}`}>
                        {message.sender.avatar ? (
                          <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
                        ) : (
                          <AvatarFallback className={
                            message.sender.role === 'admin' ? "bg-destructive text-white" : 
                            message.sender.role === 'rescue-team' ? "bg-secondary text-white" : 
                            "bg-primary text-white"
                          }>
                            {message.sender.name.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      <div>
                        {/* User name above message bubble */}
                        {(!currentUser || message.sender.id !== currentUser.id) && (
                          <div className="text-xs font-medium mb-1 ml-1 flex items-center">
                            {message.sender.name}
                            {message.sender.role === 'admin' && (
                              <span className="ml-1 text-destructive font-bold flex items-center">
                                <ShieldAlert className="w-3 h-3 mr-0.5" />
                                ADMIN
                              </span>
                            )}
                            {message.sender.role === 'rescue-team' && (
                              <span className="ml-1 text-secondary font-bold flex items-center">
                                <Users className="w-3 h-3 mr-0.5" />
                                RESCUE
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className={getMessageStyles(message, currentUser !== null && message.sender.id === currentUser.id).containerClasses}>
                          {message.isAnnouncement && (
                            <div className={getMessageStyles(message, currentUser !== null && message.sender.id === currentUser.id).labelClasses}>
                              <Megaphone className="h-4 w-4 mr-1" /> ANNOUNCEMENT
                            </div>
                          )}
                          {message.sender.role === 'admin' && !message.isAnnouncement && !(currentUser?.role === 'admin') && (
                            <div className={getMessageStyles(message, currentUser !== null && message.sender.id === currentUser.id).labelClasses}>
                              <ShieldAlert className="w-4 h-4 mr-1" />
                              ADMIN MESSAGE
                            </div>
                          )}
                          {renderMessageContent(message)}
                        </div>
                        
                        <div className={`text-xs text-muted-foreground mt-1 ${currentUser && message.sender.id === currentUser.id ? "text-right" : "text-left"}`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
              
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No messages yet. Start the command channel!</p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
      
      <div className="border-t p-3 bg-card">
        {isAdmin && (
          <div className="flex items-center space-x-2 mb-2">
            <Switch
              checked={isAnnouncement}
              onCheckedChange={setIsAnnouncement}
              id="announcement-mode"
            />
            <Label htmlFor="announcement-mode" className="text-sm font-medium flex items-center cursor-pointer">
              <Megaphone className="h-4 w-4 mr-1 text-yellow-500" />
              Announcement Mode
            </Label>
          </div>
        )}
        
        {canChat ? (
          <Popover open={showMentions && filteredUsers.length > 0}>
            <PopoverTrigger asChild>
              <div className="flex items-center space-x-2">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Type your message... Use @ to mention someone"
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className={`flex-1 ${isAnnouncement ? "border-yellow-500 border-2" : ""}`}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!newMessage.trim() || !currentUser}
                  size="icon"
                  variant={isAnnouncement ? "destructive" : "secondary"}
                >
                  {isAnnouncement ? <Megaphone size={16} /> : <Send size={16} />}
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <div className="max-h-56 overflow-auto py-1">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id}
                    className="px-2 py-1.5 hover:bg-muted cursor-pointer flex items-center"
                    onClick={() => handleSelectMention(user)}
                  >
                    <AtSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{user.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {user.role === 'admin' ? 'Admin' : 'Rescue Team'}
                    </span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-500">
              {user ? 
                "Only administrators and rescue teams can send messages." : 
                "Please log in to access the chat."}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CommunityChat; 