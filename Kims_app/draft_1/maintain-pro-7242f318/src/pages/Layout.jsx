

import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MaintenanceRecord, ServiceCard } from "@/api/entities"; // Updated import
import { Message } from "@/api/entities";
import { Notification } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile, InvokeLLM } from "@/api/integrations"; // Updated import
import { useAuth } from "@/context/AuthContext";
import {
  Settings,
  ClipboardCheck,
  History,
  Cloud,
  Wifi,
  WifiOff,
  Wrench,
  MessageSquare,
  ShieldCheck,
  DollarSign,
  Users,
  FileText,
  ClipboardList,
  Boxes,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ToastProvider, useToast } from "@/components/ui/useToast";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Plant",
    url: createPageUrl("Plant"),
    icon: Settings,
  },
  {
    title: "Operator Checklist", // Changed from "Machinery Checklist"
    url: createPageUrl("Checklists"),
    icon: ClipboardCheck,
  },
  {
    title: "Services", // Changed from "Servicing Sheets"
    url: createPageUrl("Services"), // Changed from "ServicingSheets"
    icon: FileText,
  },
  {
    title: "Maintenance Hub", // Replaced "Maintenance"
    url: createPageUrl("MaintenanceHub"),
    icon: Wrench,
  },
  {
    title: "Workshop Job Card",
    url: createPageUrl("WorkshopJobCard"),
    icon: ClipboardList,
  },
  {
    title: "Workshop Inventory",
    url: createPageUrl("WorkshopInventory"),
    icon: Boxes,
  },
  {
    title: "Machine Costs",
    url: createPageUrl("MachineCosts"),
    icon: DollarSign,
  },
  {
    title: "Employees", // New navigation item added
    url: createPageUrl("Employees"),
    icon: Users,
  },
  {
    title: "Message Board",
    url: createPageUrl("MessageBoard"),
    icon: MessageSquare,
  },
  {
    title: "History",
    url: createPageUrl("History"),
    icon: History,
  },
  {
    title: "Take 5",
    url: createPageUrl("Take5"),
    icon: ShieldCheck,
  },
];

const base64ToBlob = (base64, contentType = '', sliceSize = 512) => {
    if (!base64 || typeof base64 !== 'string') return null;
    
    // Remove data URI prefix if present
    const base64WithoutPrefix = base64.split(',')[1] || base64;

    try {
        const byteCharacters = atob(base64WithoutPrefix);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: contentType });
        return blob.size > 0 ? blob : null;
    } catch (e) {
        console.error("Failed to decode base64 string:", e);
        return null;
    }
};

// LogoutButton component
const LogoutButton = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
          <span className="text-slate-700 font-semibold text-sm">{user?.email?.[0]?.toUpperCase() || 'T'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{user?.email || 'Technician'}</p>
          <p className="text-xs text-slate-500 truncate">Maintenance Team</p>
        </div>
      </div>
      <Button
        onClick={handleLogout}
        disabled={loading}
        variant="outline"
        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4 mr-2" />
        {loading ? 'Logging out...' : 'Logout'}
      </Button>
    </div>
  );
};

const AppLayout = ({ children, currentPageName }) => {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [mentionCount, setMentionCount] = useState(0);
  const { toast } = useToast();

  const checkPendingItems = useCallback(() => {
    const pendingRecords = JSON.parse(localStorage.getItem('pendingMaintenanceRecords') || '[]');
    const pendingMessages = JSON.parse(localStorage.getItem('pendingMessages') || '[]');
    const totalPending = pendingRecords.length + pendingMessages.length;
    setPendingCount(totalPending);
    return { pendingRecords, pendingMessages };
  }, []);

  const fetchMentionCount = useCallback(async () => {
    try {
        const user = await User.me();
        if (user) {
            const unread = await Notification.filter({ notified_user_email: user.email, is_read: false });
            setMentionCount(unread.length);
        }
    } catch (e) {
        // Not logged in or error, so count is 0
        setMentionCount(0);
    }
  }, []);

  const syncPendingRecords = useCallback(async (pending) => {
    if (pending.length === 0) return 0;

    let successfullySyncedIds = [];
    for (const record of pending) {
      try {
        const { localId, ...recordToSync } = record;
        await MaintenanceRecord.create(recordToSync);
        successfullySyncedIds.push(localId);
      } catch (error) {
        console.error("Failed to sync record:", error);
      }
    }

    if (successfullySyncedIds.length > 0) {
      const remaining = pending.filter(r => !successfullySyncedIds.includes(r.localId));
      localStorage.setItem('pendingMaintenanceRecords', JSON.stringify(remaining));
      window.dispatchEvent(new CustomEvent('records-synced'));
    }
    return successfullySyncedIds.length;
  }, []);

  const syncPendingMessages = useCallback(async (pending) => {
    if (pending.length === 0) return 0;

    let successfullySyncedIds = [];
    for (const message of pending) {
      try {
        const { localId, isPending, pending_image_base64, pending_video_base64, pending_file_base64, ...messageToSync } = message;

        // Handle image upload
        if (pending_image_base64) {
            const imageBlob = base64ToBlob(pending_image_base64, 'image/jpeg');
            if (imageBlob) {
                const { file_url } = await UploadFile({ file: imageBlob });
                messageToSync.image_url = file_url;
            }
        }

        // Handle video upload
        if (pending_video_base64) {
            const videoBlob = base64ToBlob(pending_video_base64, 'video/mp4');
            if (videoBlob) {
                const { file_url } = await UploadFile({ file: videoBlob });
                messageToSync.video_url = file_url;
            }
        }

        // Handle file upload
        if (pending_file_base64) {
            // For a generic file, we don't always know the specific content type upfront from base64
            const fileBlob = base64ToBlob(pending_file_base64);
            if (fileBlob) {
                const { file_url } = await UploadFile({ file: fileBlob });
                messageToSync.file_url = file_url;
            }
        }

        await Message.create(messageToSync);
        successfullySyncedIds.push(localId);
      } catch (error) {
        console.error("Failed to sync message:", error);
      }
    }

    if (successfullySyncedIds.length > 0) {
      const remaining = pending.filter(m => !successfullySyncedIds.includes(m.localId));
      localStorage.setItem('pendingMessages', JSON.stringify(remaining));
      window.dispatchEvent(new CustomEvent('messages-synced'));
    }
    return successfullySyncedIds.length;
  }, []);

  const runSync = useCallback(async () => {
    if (!navigator.onLine) return;
    const { pendingRecords, pendingMessages } = checkPendingItems();
    if (pendingRecords.length === 0 && pendingMessages.length === 0) return;

    toast({ title: "Syncing...", description: `${pendingRecords.length + pendingMessages.length} items are being uploaded.`, variant: 'syncing' });

    const [syncedRecordsCount, syncedMessagesCount] = await Promise.all([
      syncPendingRecords(pendingRecords),
      syncPendingMessages(pendingMessages)
    ]);

    const totalSynced = syncedRecordsCount + syncedMessagesCount;
    const { pendingRecords: remainingRecords, pendingMessages: remainingMessages } = checkPendingItems();
    const totalRemaining = remainingRecords.length + remainingMessages.length;

    if (totalSynced > 0) {
      if (totalRemaining === 0) {
        toast({ title: "Sync Complete", description: "All offline items have been uploaded.", variant: 'success' });
      } else {
        toast({ title: "Partial Sync", description: `${totalSynced} items synced. ${totalRemaining} remain.`, variant: 'warning' });
      }
    }
    checkPendingItems();
  }, [toast, checkPendingItems, syncPendingRecords, syncPendingMessages]);

  useEffect(() => {
    const runAutoServiceCardCreation = async () => {
      // This check ensures the logic runs only once per session to avoid excessive checks.
      if (sessionStorage.getItem('hasRunAutoServiceCheck')) {
        return;
      }
      sessionStorage.setItem('hasRunAutoServiceCheck', 'true');

      try {
        const response = await InvokeLLM({
          prompt: `
            Analyze all 'Machine' and 'ServiceCard' entities. Your task is to identify machines that require a new service card to be generated.

            A machine is considered for a new service card if it meets these two conditions:
            1. It is approaching its next service interval. The condition for this is: (machine.last_service_hours + machine.service_interval_hours) - machine.current_operating_hours <= 100 AND > 0.
            2. There is NO existing 'ServiceCard' for this machine with a 'status' of "open".

            Return a JSON object with a single key "machines_to_create_cards_for", which should be an array of objects. Each object must contain the 'machineId' and 'plantId' of a machine that meets both conditions.
            If no machines meet the criteria, return an empty array.
          `,
          response_json_schema: {
            type: "object",
            properties: {
              machines_to_create_cards_for: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    machineId: { type: "string" },
                    plantId: { type: "string" }
                  },
                  required: ["machineId", "plantId"],
                },
              },
            },
            required: ["machines_to_create_cards_for"],
          },
        });

        if (response && response.machines_to_create_cards_for && response.machines_to_create_cards_for.length > 0) {
          const cardsToCreate = response.machines_to_create_cards_for.map(m => ({
            machine_id: m.machineId,
            plant_id: m.plantId, // Changed from unitNumber
            status: 'open',
            service_type: 'scheduled'
          }));
          
          await ServiceCard.bulkCreate(cardsToCreate);

          toast({
            title: "Service Cards Generated",
            description: `${cardsToCreate.length} new service cards were automatically created for machines approaching their service interval.`,
            variant: "info",
          });
          // Dispatch event to notify other components like the Services page
          window.dispatchEvent(new CustomEvent('service-cards-created'));
        }
      } catch (error) {
        console.error("Failed to run automatic service card creation:", error);
        // Do not show a toast for background errors to avoid interrupting the user.
      }
    };
    
    runAutoServiceCardCreation();
  }, [toast]);


  useEffect(() => {
    checkPendingItems();
    fetchMentionCount();

    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: 'Back Online', description: 'Your internet connection was restored.', variant: 'online' });
      runSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({ title: 'You are offline', description: 'Data will be saved locally and synced later.', variant: 'offline' });
    };

    const handleNotificationsRead = () => fetchMentionCount();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('records-saved-offline', checkPendingItems);
    window.addEventListener('messages-saved-offline', checkPendingItems);
    window.addEventListener('notifications-read', handleNotificationsRead);
    window.addEventListener('new-mention', handleNotificationsRead);

    // Initial sync attempt
    runSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('records-saved-offline', checkPendingItems);
      window.removeEventListener('messages-saved-offline', checkPendingItems);
      window.removeEventListener('notifications-read', handleNotificationsRead);
      window.removeEventListener('new-mention', handleNotificationsRead);
    };
  }, [runSync, toast, checkPendingItems, fetchMentionCount]);

  return (
    <SidebarProvider>
      <Toaster />
      <div className="min-h-screen flex w-full bg-slate-50">
        <style>
          {`
            :root {
              --primary: 30 41 59;
              --primary-foreground: 248 250 252;
              --secondary: 59 130 246;
              --secondary-foreground: 255 255 255;
              --accent: 16 185 129;
              --accent-foreground: 255 255 255;
              --warning: 245 158 11;
              --warning-foreground: 255 255 255;
            }
          `}
        </style>

        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-16 h-12 flex items-center justify-center bg-slate-100 rounded">
                <Wrench className="w-8 h-8 text-slate-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Bryant Logging</h2>
                <p className="text-sm text-slate-500">Maintenance</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 rounded-lg ${
                          location.pathname === item.url
                            ? 'bg-slate-800 text-white hover:bg-slate-700'
                            : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center justify-between gap-3 px-3 py-3">
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.title}</span>
                            </div>
                            {item.title === 'Message Board' && mentionCount > 0 && (
                                <Badge className="bg-red-500 text-white w-6 h-6 flex items-center justify-center p-0 rounded-full">{mentionCount}</Badge>
                            )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4 space-y-3">
             <div className="flex items-center gap-2 px-3 py-2 text-sm">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <span className={`font-medium ${isOnline ? 'text-slate-700' : 'text-red-700'}`}>
                {isOnline ? "Online" : "Offline"}
              </span>
              {pendingCount > 0 && (
                <div className="flex items-center gap-1 ml-auto">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">{pendingCount}</Badge>
                </div>
              )}
            </div>
            <LogoutButton />
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-screen">
          <header className="bg-white border-b border-slate-200 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-slate-200 flex items-center justify-center rounded">
                  <Wrench className="w-5 h-5 text-slate-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">Bryant Logging</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function LayoutWrapper(props) {
  return (
    <ToastProvider>
      <AppLayout {...props} />
    </ToastProvider>
  )
}

