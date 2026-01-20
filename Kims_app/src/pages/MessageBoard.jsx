
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Message } from "@/api/entities";
import { Notification } from "@/api/entities";
import { User } from "@/api/entities";
import { Machine } from "@/api/entities"; // Import Machine entity
import { UploadFile, SendEmail, InvokeLLM } from "@/api/integrations";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, Clock, MessageSquare, User as UserIcon, Camera, X, Loader2, Video, Play, Paperclip, File as FileIcon, Mic, Square } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/components/ui/useToast";

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

const getUserColor = (authorName) => {
  const colors = [
    { bg: 'bg-blue-500', text: 'text-white', avatar: 'bg-blue-100 text-blue-800' },
    { bg: 'bg-green-500', text: 'text-white', avatar: 'bg-green-100 text-green-800' },
    { bg: 'bg-purple-500', text: 'text-white', avatar: 'bg-purple-100 text-purple-800' },
    { bg: 'bg-pink-500', text: 'text-white', avatar: 'bg-pink-100 text-pink-800' },
    { bg: 'bg-indigo-500', text: 'text-white', avatar: 'bg-indigo-100 text-indigo-800' },
    { bg: 'bg-teal-500', text: 'text-white', avatar: 'bg-teal-100 text-teal-800' },
    { bg: 'bg-orange-500', text: 'text-white', avatar: 'bg-orange-100 text-orange-800' },
    { bg: 'bg-red-500', text: 'text-white', avatar: 'bg-red-100 text-red-800' },
    { bg: 'bg-cyan-500', text: 'text-white', avatar: 'bg-cyan-100 text-cyan-800' },
    { bg: 'bg-emerald-500', text: 'text-white', avatar: 'bg-emerald-100 text-emerald-800' },
  ];

  // Create a simple hash from the author name
  let hash = 0;
  if (!authorName) return colors[0]; // Default for undefined author
  for (let i = 0; i < authorName.length; i++) {
    const char = authorName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const MessageItem = ({ message, isCurrentUser }) => {
  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const imageToDisplay = message.image_url || message.pending_image_base66;
  const videoToDisplay = message.video_url || message.pending_video_base66;
  
  // Get consistent color for this user
  const userColors = getUserColor(message.author_name || 'Unknown');
  const messageClasses = `${userColors.bg} ${userColors.text}`;

  const contentWithMentions = (message.content || '').split(/(@\w+\s\w+|@[A-Z0-9-]+)/g).map((part, index) => {
    if (part.startsWith('@')) {
      return <strong key={index} className="font-bold opacity-90">{part}</strong>;
    }
    return part;
  });

  return (
    <div className={`flex items-end gap-3 my-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <Avatar className="w-8 h-8">
          <AvatarFallback className={`text-xs ${userColors.avatar}`}>
            {getInitials(message.author_name)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-md p-3 rounded-lg ${messageClasses}`}>
        <p className={`text-xs font-bold mb-1 opacity-80`}>
          {message.author_name}
        </p>
        {message.content && <p className="text-sm whitespace-pre-wrap">{contentWithMentions}</p>}
        {imageToDisplay && (
            <img 
                src={imageToDisplay} 
                alt="Message attachment" 
                className="mt-2 rounded-lg max-w-full h-auto" 
            />
        )}
        {videoToDisplay && (
            <video 
                src={videoToDisplay} 
                controls
                className="mt-2 rounded-lg max-w-full h-auto"
                preload="metadata"
            >
                Your browser does not support the video tag.
            </video>
        )}
        {message.file_url ? (
            <a 
                href={message.file_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 p-2 mt-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
                <FileIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{message.file_name}</span>
            </a>
        ) : message.file_name && (
            <div className="flex items-center gap-2 p-2 mt-2 bg-black/20 rounded-lg cursor-not-allowed">
                <FileIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{message.file_name} (pending)</span>
            </div>
        )}
        <div className={`flex items-center gap-2 mt-2 opacity-70`}>
          <p className="text-xs">
            {message.created_at ? format(parseISO(message.created_at), 'MMM d, h:mm a') : 'Sending...'}
          </p>
          {message.isPending && <Clock className="w-3 h-3" title="Pending sync" />}
        </div>
      </div>
      {isCurrentUser && (
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-slate-800 text-white text-xs">
            {getInitials(message.author_name)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default function MessageBoard() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allMachines, setAllMachines] = useState([]); // State for machines
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const scrollAreaRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const serverMessages = await Message.list('-created_at', 200);
      const pendingMessages = JSON.parse(localStorage.getItem('pendingMessages') || '[]');
      
      const combined = [...pendingMessages, ...serverMessages];
      const uniqueMessages = Array.from(new Set(combined.map(m => m.id || m.localId)))
          .map(id => combined.find(m => (m.id || m.localId) === id));

      const sorted = uniqueMessages.sort((a, b) => {
        const dateA = a.created_at ? parseISO(a.created_at) : new Date(0); // Use epoch for unsent messages for sorting
        const dateB = b.created_at ? parseISO(b.created_at) : new Date(0);
        return dateA.getTime() - dateB.getTime();
      });
      
      setMessages(sorted);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({ title: "Error", description: "Could not load messages.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast]);

  const markNotificationsAsRead = useCallback(async (userEmail) => {
    if (!userEmail) return;
    try {
        const unreadNotifs = await Notification.filter({ notified_user_email: userEmail, is_read: false });
        if (unreadNotifs.length > 0) {
            const updates = unreadNotifs.map(notif => Notification.update(notif.id, { is_read: true }));
            await Promise.all(updates);
            window.dispatchEvent(new CustomEvent('notifications-read'));
        }
    } catch (error) {
        console.error("Failed to mark notifications as read:", error);
    }
  }, []);

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const [machines] = await Promise.all([
            Machine.list() // Fetch machines here
        ]);
        setCurrentUser(user);
        setAllMachines(machines); // Set machines state
        if (user) {
            markNotificationsAsRead(user.email);
        }
      } catch (e) {
        console.error("User not logged in or failed to fetch users/machines:", e);
      }
      await loadMessages();
    };

    fetchUserAndMessages();
    
    window.addEventListener('messages-saved-offline', loadMessages);
    window.addEventListener('messages-synced', loadMessages);

    return () => {
      window.removeEventListener('messages-saved-offline', loadMessages);
      window.removeEventListener('messages-synced', loadMessages);
    };
  }, [loadMessages, markNotificationsAsRead]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        // A bit of a hack to scroll to bottom after render
        setTimeout(() => {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  }, [messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        handleRemoveVideo();
        handleRemoveFile();
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }
    e.target.value = null; // Reset file input
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
        handleRemoveImage();
        handleRemoveFile();
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
    }
    e.target.value = null; // Reset file input
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        handleRemoveImage();
        handleRemoveVideo();
        setAttachmentFile(file);
    }
    e.target.value = null; // Reset file input
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if(imagePreview) {
        URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    if(videoPreview) {
        URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);
  };

  const handleRemoveFile = () => {
    setAttachmentFile(null);
  };

  const handleMentionSelect = (user) => {
    const mentionText = `@${user.full_name} `;
    const currentText = newMessage;
    const startIndex = currentText.lastIndexOf('@');
    
    if (startIndex !== -1) {
        const newText = currentText.substring(0, startIndex) + mentionText;
        setNewMessage(newText);
    } else {
        setNewMessage(currentText + mentionText);
    }
    
    setMentionedUsers(prev => [...prev, user]);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const handleNewMessageChange = (e) => {
    const text = e.target.value;
    setNewMessage(text);

    // Match @ followed by any characters that are not a space for machine plant #s
    // Or match @ followed by words, optionally with a space, then more word characters for user mentions
    const mentionMatch = text.match(/@([^\s]+)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1].toLowerCase()); // The first capturing group is the actual query
    } else {
      setMentionQuery(null);
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
        // Stop recording
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        // The 'stop' event handler will do the transcription
    } else {
        // Start recording
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast({ title: "Unsupported", description: "Your browser does not support voice recording.", variant: "destructive" });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Force the MIME type to audio/webm as it's the most standard for web recording
            const mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                 toast({ title: "Unsupported Browser", description: "Your browser does not support the required audio format for recording.", variant: "destructive" });
                 stream.getTracks().forEach(track => track.stop());
                 return;
            }

            setIsRecording(true);
            toast({ title: "Recording Started", description: "Click the square to stop.", variant: "info" });
            audioChunksRef.current = [];
            
            const recorder = new MediaRecorder(stream, { mimeType: mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                setIsTranscribing(true);
                toast({ title: "Transcribing...", description: "Please wait while we process your audio.", variant: "info" });
                
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                
                const audioFile = new File([audioBlob], `voice-message.webm`, { type: mimeType });

                try {
                    // 1. Upload the audio file
                    const { file_url } = await UploadFile({ file: audioFile });

                    // 2. Transcribe using InvokeLLM
                    const transcription = await InvokeLLM({
                        prompt: "Transcribe the following audio file accurately. Output only the transcribed text.",
                        file_urls: [file_url],
                    });
                    
                    // Append transcription to existing message
                    setNewMessage(prev => prev ? `${prev} ${transcription}` : transcription);

                    toast({ title: "Transcription Complete", description: "Your voice message has been converted to text.", variant: "success" });

                } catch (error) {
                    console.error("Transcription failed:", error);
                    toast({ title: "Transcription Error", description: "Could not transcribe the audio. Please try again.", variant: "destructive" });
                } finally {
                    setIsTranscribing(false);
                    // Stop all tracks on the stream to turn off the microphone indicator
                    stream.getTracks().forEach(track => track.stop());
                }
            };
            
            recorder.start();
        } catch (err) {
            console.error("Microphone access denied:", err);
            toast({ title: "Permission Denied", description: "Please allow microphone access to record a voice message.", variant: "destructive" });
            setIsRecording(false);
        }
    }
  };

  const handlePostMessage = async () => {
    if ((!newMessage.trim() && !imageFile && !videoFile && !attachmentFile) || !currentUser || isUploading || isRecording || isTranscribing) return;

    setIsUploading(true);

    const messageData = {
      content: newMessage.trim(),
      author_name: currentUser.full_name,
      created_by: currentUser.email,
      created_date: new Date().toISOString(),
    };

    // Attempt to upload files only if online
    if (navigator.onLine && (imageFile || videoFile || attachmentFile)) {
      try {
        if (imageFile) {
          const { file_url } = await UploadFile({ file: imageFile });
          messageData.image_url = file_url;
        }
        if (videoFile) {
          const { file_url } = await UploadFile({ file: videoFile });
          messageData.video_url = file_url;
        }
        if (attachmentFile) {
          const { file_url } = await UploadFile({ file: attachmentFile });
          messageData.file_url = file_url;
          messageData.file_name = attachmentFile.name; // Store original file name
        }
      } catch (uploadError) {
        console.error("File upload failed:", uploadError);
        toast({ title: "Upload Error", description: "Could not upload file. Please try again.", variant: "destructive" });
        setIsUploading(false);
        return; // Prevent sending message if file upload fails while online
      }
    }

    setNewMessage("");
    handleRemoveImage();
    handleRemoveVideo();
    handleRemoveFile();

    if (navigator.onLine) {
      try {
        const newMsg = await Message.create(messageData);
        setMessages(prev => [...prev, newMsg]);

        // Handle @plant_id mentions
        const plantIdRegex = /@([A-Z0-9-]+)/g;
        const mentionedPlantIds = [...newMessage.matchAll(plantIdRegex)].map(match => match[1]);

        if (mentionedPlantIds.length > 0) {
            const uniquePlantIds = [...new Set(mentionedPlantIds)];
            for (const plantId of uniquePlantIds) {
                const machineToUpdate = allMachines.find(m => m.plant_id === plantId);
                if (machineToUpdate) {
                    try {
                        const noteContent = `[Message Board by ${currentUser.full_name}] ${messageData.content}`;
                        const newNote = { note: noteContent, date: new Date().toISOString() };
                        
                        const existingNotes = Array.isArray(machineToUpdate.notes) ? machineToUpdate.notes : [];
                        const updatedNotes = [...existingNotes, newNote];

                        await Machine.update(machineToUpdate.id, { notes: updatedNotes });
                        toast({ title: "Machine Note Added", description: `Note successfully added to machine ${plantId}.` });
                    } catch (noteError) {
                        console.error(`Failed to add note to machine ${plantId}:`, noteError);
                        toast({ title: "Note Error", description: `Could not add note to machine ${plantId}.`, variant: "destructive" });
                    }
                } else {
                    console.warn(`Mentioned Plant # "${plantId}" not found in machines list.`);
                    toast({ title: "Invalid Mention", description: `Machine with Plant # "${plantId}" not found.`, variant: "warning" });
                }
            }
        }

        // Send mention emails and create notifications
        if (mentionedUsers.length > 0) {
            const uniqueMentions = [...new Map(mentionedUsers.map(item => [item['email'], item])).values()];
            
            const notificationsToCreate = uniqueMentions
                .filter(user => user.email !== currentUser.email)
                .map(user => ({
                    notified_user_email: user.email,
                    source_message_id: newMsg.id,
                    source_author_name: currentUser.full_name,
                }));

            if (notificationsToCreate.length > 0) {
                await Notification.bulkCreate(notificationsToCreate);
                window.dispatchEvent(new CustomEvent('new-mention'));
            }
            
            for (const user of uniqueMentions) {
                if (user.email === currentUser.email) continue; // Don't notify self
                try {
                    await SendEmail({
                        to: user.email,
                        subject: `${currentUser.full_name} mentioned you on the Message Board`,
                        body: `
                            <p>Hi ${user.full_name},</p>
                            <p>${currentUser.full_name} mentioned you in a message:</p>
                            <div style="border-left: 3px solid #ccc; padding-left: 10px; margin: 10px 0;">
                                <p>${messageData.content}</p>
                            </div>
                            <p>You can view the conversation on the message board.</p>
                            <a href="${window.location.href}">Go to Message Board</a>
                        `
                    });
                } catch (emailError) {
                    console.error(`Failed to send email notification to ${user.email}`, emailError);
                    toast({
                        title: "Email Error",
                        description: `Failed to notify ${user.full_name}.`,
                        variant: "destructive",
                    });
                }
            }
        }

      } catch (error) {
        console.error("Failed to post message online, saving offline:", error);
        // If message creation fails, fall back to offline storage
        await saveMessageOffline(messageData, imageFile, videoFile, attachmentFile);
      }
    } else {
      // If offline, save immediately to offline storage
      await saveMessageOffline(messageData, imageFile, videoFile, attachmentFile);
    }
    setMentionedUsers([]);
    setIsUploading(false);
  };

  const saveMessageOffline = async (messageData, imageFile, videoFile, attachmentFile) => {
    const pendingMessages = JSON.parse(localStorage.getItem('pendingMessages') || '[]');
    const messageWithLocalId = { ...messageData, localId: crypto.randomUUID(), isPending: true };

    if(imageFile){
        messageWithLocalId.pending_image_base64 = await fileToBase64(imageFile);
    }
    if(videoFile){
        messageWithLocalId.pending_video_base64 = await fileToBase64(videoFile);
    }
    if(attachmentFile){
        messageWithLocalId.pending_file_base64 = await fileToBase64(attachmentFile);
        messageWithLocalId.file_name = attachmentFile.name; // Store original file name for offline display
    }
    
    pendingMessages.push(messageWithLocalId);
    localStorage.setItem('pendingMessages', JSON.stringify(pendingMessages));
    setMessages(prev => [...prev, messageWithLocalId]);
    window.dispatchEvent(new CustomEvent('messages-saved-offline'));
    toast({
        title: "Message Saved Offline",
        description: "It will be sent when you're back online.",
        variant: "info",
    });
  };

  const filteredMentionUsers = mentionQuery !== null 
    ? allUsers.filter(user => 
        user.full_name.toLowerCase().includes(mentionQuery) && user.id !== currentUser?.id
      ) 
    : [];

  const filteredMentionMachines = mentionQuery !== null
    ? allMachines.filter(machine => 
        machine.plant_id.toLowerCase().includes(mentionQuery) || 
        (machine.model && machine.model.toLowerCase().includes(mentionQuery))
      )
    : [];

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-8 h-8 text-slate-800" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Message Board</h1>
          <p className="text-slate-600">Team communication and updates</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col shadow-sm border-slate-200 bg-white">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {isLoading && <p className="text-center text-slate-500">Loading messages...</p>}
          {!isLoading && messages.length === 0 && (
            <div className="text-center text-slate-500 py-20">
              <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="font-semibold">No messages yet</p>
              <p className="text-sm">Be the first to post a message.</p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageItem 
              key={msg.id || msg.localId} 
              message={msg} 
              isCurrentUser={currentUser?.email === msg.created_by} 
            />
          ))}
        </ScrollArea>
        <CardContent className="p-4 border-t bg-slate-50">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-slate-200 text-slate-700">
                {currentUser ? currentUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : <UserIcon size={20} />}
              </AvatarFallback>
            </Avatar>
            <Popover open={mentionQuery !== null && (filteredMentionUsers.length > 0 || filteredMentionMachines.length > 0)} onOpenChange={(open) => { if (!open) setMentionQuery(null); }}>
              <PopoverTrigger asChild>
                <div className="flex-1 relative">
                    {imagePreview && (
                        <div className="relative w-24 h-24 mb-2">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                            <Button
                                size="icon"
                                variant="destructive"
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                                onClick={handleRemoveImage}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                    {videoPreview && (
                        <div className="relative w-32 h-24 mb-2">
                            <video src={videoPreview} className="w-full h-full object-cover rounded-md" muted />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-md">
                                <Play className="w-8 h-8 text-white" />
                            </div>
                            <Button
                                size="icon"
                                variant="destructive"
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                                onClick={handleRemoveVideo}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                    {attachmentFile && (
                        <div className="relative flex items-center gap-2 p-2 mb-2 bg-slate-100 border rounded-lg">
                            <FileIcon className="w-5 h-5 text-slate-600 flex-shrink-0" />
                            <span className="text-sm text-slate-700 truncate">{attachmentFile.name}</span>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                                onClick={handleRemoveFile}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type, @mention, or record a voice message..."
                    value={newMessage}
                    onChange={handleNewMessageChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePostMessage();
                      }
                    }}
                    className="pr-40 bg-white"
                    rows={1}
                    disabled={!currentUser || isUploading || isRecording || isTranscribing}
                  />
                  <input 
                    type="file"
                    ref={imageInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                  <input 
                    type="file"
                    ref={videoInputRef}
                    className="hidden"
                    accept="video/*"
                    onChange={handleVideoSelect}
                  />
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="absolute right-14 bottom-2 flex items-center">
                      <Button 
                        size="icon"
                        variant="ghost"
                        onClick={handleToggleRecording}
                        disabled={isUploading || isTranscribing}
                        title={isRecording ? "Stop Recording" : "Record Voice Message"}
                        className={isRecording ? 'text-red-500 animate-pulse' : ''}
                      >
                          {isTranscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />)}
                      </Button>
                      <Button 
                        size="icon"
                        variant="ghost"
                        onClick={() => imageInputRef.current.click()}
                        disabled={isUploading || isRecording || isTranscribing}
                        title="Add Photo"
                      >
                          <Camera className="w-5 h-5" />
                      </Button>
                      <Button 
                        size="icon"
                        variant="ghost"
                        onClick={() => videoInputRef.current.click()}
                        disabled={isUploading || isRecording || isTranscribing}
                        title="Add Video"
                      >
                          <Video className="w-5 h-5" />
                      </Button>
                      <Button 
                        size="icon"
                        variant="ghost"
                        onClick={() => fileInputRef.current.click()}
                        disabled={isUploading || isRecording || isTranscribing}
                        title="Add File"
                      >
                          <Paperclip className="w-5 h-5" />
                      </Button>
                  </div>
                  <Button
                    onClick={handlePostMessage}
                    disabled={(!newMessage.trim() && !imageFile && !videoFile && !attachmentFile) || !currentUser || isUploading || isRecording || isTranscribing}
                    className="absolute right-2 bottom-2 bg-slate-800 hover:bg-slate-700 w-12 h-9"
                    size="icon"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-1" align="start">
                <p className="text-xs text-slate-500 p-2 font-semibold">Mention someone or a machine</p>
                <div className="max-h-48 overflow-y-auto">
                    {filteredMentionUsers.length > 0 && (
                        <>
                            <p className="text-xs text-slate-400 p-2 pt-0">Users</p>
                            {filteredMentionUsers.map(user => (
                                <div 
                                    key={`user-${user.id}`} 
                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer"
                                    onClick={() => handleMentionSelect(user)}
                                >
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                                            {user.full_name.split(' ').map(n=>n[0]).join('').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-sm text-slate-800">{user.full_name}</span>
                                </div>
                            ))}
                        </>
                    )}
                    {filteredMentionMachines.length > 0 && (
                        <>
                            <p className={`text-xs text-slate-400 p-2 ${filteredMentionUsers.length > 0 ? 'pt-0' : 'pt-2'}`}>Machines</p>
                            {filteredMentionMachines.map(machine => (
                                <div 
                                    key={`machine-${machine.id}`} 
                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer"
                                    onClick={() => {
                                        const mentionText = `@${machine.plant_id} `;
                                        const currentText = newMessage;
                                        const startIndex = currentText.lastIndexOf('@');
                                        
                                        if (startIndex !== -1) {
                                            const newText = currentText.substring(0, startIndex) + mentionText;
                                            setNewMessage(newText);
                                        } else {
                                            setNewMessage(currentText + mentionText);
                                        }
                                        setMentionQuery(null);
                                        textareaRef.current?.focus();
                                    }}
                                >
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                                            M
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-sm text-slate-800">{machine.plant_id} {machine.model ? `(${machine.model})` : ''}</span>
                                </div>
                            ))}
                        </>
                    )}
                    {filteredMentionUsers.length === 0 && filteredMentionMachines.length === 0 && (
                        <p className="text-sm text-slate-500 p-2">No users or machines found matching "{mentionQuery}"</p>
                    )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
