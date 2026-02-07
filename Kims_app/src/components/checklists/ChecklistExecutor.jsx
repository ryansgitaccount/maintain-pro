
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import _isEqual from 'lodash/isEqual'; // Import lodash isEqual for deep comparison
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { MaintenanceRecord } from "@/api/entities";
import { MaintenanceIssue } from "@/api/entities";
import { User } from "@/api/entities";
import { useToast } from "@/components/ui/useToast";
import {
  X,
  Save,
  Gauge,
  Users,
  Calendar,
  Shield,
  Check,
  CircleOff,
  Loader2,
  ShieldCheck,
  FireExtinguisher,
  UserCheck,
  Siren,
  Lightbulb,
  Maximize2,
  Footprints,
  DoorOpen,
  Droplets,
  Wrench,
  RefreshCw,
  Filter,
  Wind,
  CircleDashed,
  Bolt,
  Circle,
  Cog,
  Box,
  Settings2,
  MoreHorizontal,
  Maximize,
  AirVent,
  VolumeX,
  Briefcase,
  ClipboardCheck as ClipboardCheckIcon,
  HardHat,
  History,
  AlertCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

const fluidTypes = [
  { key: 'engine_oil', label: 'Engine Oil' },
  { key: 'coolant', label: 'Coolant' },
  { key: 'hydraulic_oil', label: 'Hydraulic Oil' },
  { key: 'slew_oil', label: 'Slew Oil' },
];

const safetyDeviceTypes = [
  { key: 'guards', label: 'Machine Guards in place/not compromised', icon: ShieldCheck },
  { key: 'fire_extinguisher', label: 'Fire Extinguishers/Suppression charged and in date', icon: FireExtinguisher },
  { key: 'seat_belt', label: 'Seat Belt', icon: UserCheck },
  { key: 'horn', label: 'Horn', icon: Siren },
  { key: 'lights', label: 'Lights', icon: Lightbulb },
  { key: 'windows', label: 'Windows', icon: Maximize2 },
  { key: 'steps', label: 'Steps', icon: Footprints },
  { key: 'emergency_exits', label: 'Emergency exits accessible', icon: DoorOpen },
];

const dailyMaintenanceCheckTypes = [
  { key: 'grease_lines', label: 'Grease Lines', icon: Droplets },
  { key: 'pins_greased', label: 'Pins Greased (if any not functional please insert into comments which one(s) are requiring attention)', icon: Wrench },
  { key: 'slew_greased', label: 'Slew Greased', icon: RefreshCw },
  { key: 'pre_cleaner', label: 'Pre Cleaner', icon: Filter },
  { key: 'engine_exhaust', label: 'Engine Exhaust', icon: Wind },
  { key: 'track_motor_guards', label: 'Track Motor Guards', icon: Shield },
  { key: 'tyre_damage', label: 'Tyre Damage', icon: CircleDashed },
  { key: 'slew_and_bolts', label: 'Slew and Bolts', icon: Bolt },
  { key: 'rollers_idlers', label: 'Rollers/Idlers', icon: Circle },
  { key: 'sprockets', label: 'Sprockets', icon: Cog },
  { key: 'dropbox_yarder', label: 'Dropbox Yarder', icon: Box },
  { key: 'stone_guards', label: 'Stone Guards', icon: ShieldCheck },
  { key: 'transmission', label: 'Transmission', icon: Settings2 },
  { key: 'other', label: 'Other items that need attention', icon: MoreHorizontal },
];

const workAreaCheckTypes = [
    { key: 'sufficient_space', label: 'Sufficient space for you to operate in a safe manner (if not then inform your Foreman)', icon: Maximize },
    { key: 'ventilation_adequate', label: 'Is the ventilation adequate (including air con if applicable)', icon: AirVent },
    { key: 'noise_reduction', label: 'Are steps taken to reduce machinery noise (e.g. isolating the plant, mufflers, baffles)', icon: VolumeX },
    { key: 'tools_stored_safely', label: 'Are tools and portable equipment stored safely', icon: Briefcase },
    { key: 'work_plan_adequate', label: 'Is the work plan adequate for the day and fully understood (If not get clarity from Foreman/Supervisor)', icon: ClipboardCheckIcon },
];

const safeOperationCheckTypes = [
    { key: 'trained_to_operate', label: 'Are you trained to operate the machine safely or under supervision for the job task', icon: HardHat },
];

// Helper function to normalize check data for comparison, ignoring photo_url and sorting for consistent order
const normalizeForComparison = (checksArray, typeKey) => {
  if (!checksArray || !Array.isArray(checksArray)) return [];
  return checksArray
    .map(({ photo_url, ...rest }) => ({ ...rest, flagged_user: rest.flagged_user || null })) // Exclude photo_url, ensure flagged_user is null if empty string
    .sort((a, b) => {
        const keyA = a[typeKey] || '';
        const keyB = b[typeKey] || '';
        return keyA.localeCompare(keyB);
    });
};

export default function ChecklistExecutor({ checklist, machines, currentUser, onComplete, onCancel, operatorNames = [], crewNames = [] }) {
  const [selectedMachine, setSelectedMachine] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [crewName, setCrewName] = useState(""); // Add state for crew name
  const [currentHours, setCurrentHours] = useState("");
  const [hoursWarning, setHoursWarning] = useState(""); // State for the hours warning
  const [executionDate, setExecutionDate] = useState(new Date());
  const [isSigned, setIsSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openIssues, setOpenIssues] = useState([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [fluidLevels, setFluidLevels] = useState(
    fluidTypes.reduce((acc, fluid) => {
      acc[fluid.key] = { amount: '', status: null, notes: '', flaggedUser: '' };
      return acc;
    }, {})
  );
  const [safetyDevices, setSafetyDevices] = useState(
    safetyDeviceTypes.reduce((acc, device) => {
      acc[device.key] = { status: null, notes: '', flaggedUser: '' };
      return acc;
    }, {})
  );
  const [dailyMaintenanceChecks, setDailyMaintenanceChecks] = useState(
    dailyMaintenanceCheckTypes.reduce((acc, check) => {
      acc[check.key] = { status: null, notes: '', flaggedUser: '' };
      return acc;
    }, {})
  );
  const [workAreaChecks, setWorkAreaChecks] = useState(
    workAreaCheckTypes.reduce((acc, check) => {
        acc[check.key] = { status: null, notes: '', flaggedUser: '' };
        return acc;
    }, {})
  );
  const [safeOperationChecks, setSafeOperationChecks] = useState(
    safeOperationCheckTypes.reduce((acc, check) => {
        acc[check.key] = { status: null, notes: '', flaggedUser: '' };
        return acc;
    }, {})
  );
  const { toast } = useToast();




  const filteredMachinesForSelection = useMemo(() => {
    return machines
      .filter(machine => checklist.machine_type === 'all' || machine.machine_type === checklist.machine_type)
      .sort((a, b) => (a.unit_number || '').localeCompare(b.unit_number || ''));
  }, [machines, checklist.machine_type]);

  useEffect(() => {
    if (selectedMachine) {
        const machine = machines.find(m => m.id === selectedMachine);
        if (machine) {
            // Convert to string for the input field, handle null/undefined
            const hours = machine.current_operating_hours != null ? String(machine.current_operating_hours) : "";
            setCurrentHours(hours);
            // Clear any previous warning when machine changes
            setHoursWarning("");
        }
        
        const fetchOpenIssues = async () => {
            if (!navigator.onLine) {
                setOpenIssues([]); // Clear issues if offline and can't fetch
                return;
            }
            setIsLoadingIssues(true);
            try {
                const open = await MaintenanceIssue.filter({ machine_id: selectedMachine, status: 'open' });
                const inProgress = await MaintenanceIssue.filter({ machine_id: selectedMachine, status: 'in_progress' });
                setOpenIssues([...open, ...inProgress].sort((a,b) => new Date(b.created_date) - new Date(a.created_date)));
            } catch (error) {
                console.error("Failed to fetch open issues:", error);
                toast({ title: "Error", description: "Could not fetch open issues for this machine.", variant: "destructive" });
            } finally {
                setIsLoadingIssues(false);
            }
        };

        fetchOpenIssues();
    } else {
        setCurrentHours(""); // Reset if machine is deselected
        setHoursWarning(""); // Also clear warning
        setOpenIssues([]);
    }
  }, [selectedMachine, machines, toast]);

  useEffect(() => {
    const lastUsedMachineId = currentUser?.last_used_machine_id;
    if (lastUsedMachineId) {
      const lastMachine = machines.find(m => m.id === lastUsedMachineId);
      if (lastMachine && (checklist.machine_type === 'all' || checklist.machine_type === lastMachine.machine_type)) {
        setSelectedMachine(lastUsedMachineId);
      }
    } else if (checklist?.name) {
      // If no last used machine, find machine by checklist's plant_id (stored in name field)
      const machine = machines.find(m => m.plant_id === checklist.name);
      if (machine) {
        setSelectedMachine(machine.id);
      }
    }
  }, [currentUser, machines, checklist.machine_type, checklist?.name]);

  useEffect(() => {
    if (currentUser?.last_used_operator_name) {
      if (operatorNames.includes(currentUser.last_used_operator_name)) {
        setOperatorName(currentUser.last_used_operator_name);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (checklist?.crew_name) {
        setCrewName(checklist.crew_name);
    }
  }, [checklist]);



  const handleLoadLastAnswers = async () => {
    if (!selectedMachine) {
        toast({ title: "No Machine Selected", description: "Please select a machine first.", variant: "warning" });
        return;
    }

    toast({ title: "Loading...", description: "Finding last record for this machine.", variant: "info" });

    // Ensure online status for fetching previous records
    if (!navigator.onLine) {
      toast({ title: "Offline", description: "Cannot load previous answers while offline.", variant: "destructive" });
      return;
    }

    try {
        const lastRecords = await MaintenanceRecord.filter({ machine_id: selectedMachine }, '-created_date', 1);
        if (!lastRecords || lastRecords.length === 0) {
            toast({ title: "Not Found", description: "No previous records found for this machine.", variant: "info" });
            return;
        }

        const lastRecord = lastRecords[0];

        // Repopulate fluid levels
        const newFluidLevels = fluidTypes.reduce((acc, fluid) => {
            const prevCheck = lastRecord.fluid_checks?.find(c => c.fluid_type === fluid.key);
            acc[fluid.key] = {
                amount: prevCheck?.amount_added != null ? String(prevCheck.amount_added) : '',
                status: prevCheck?.status || null,
                notes: prevCheck?.notes || '',
                photo: null, photoPreview: null, // Photos are not reloaded
                flaggedUser: prevCheck?.flagged_user || '',
            };
            return acc;
        }, {});
        setFluidLevels(newFluidLevels);

        // Repopulate safety devices
        const newSafetyDevices = safetyDeviceTypes.reduce((acc, device) => {
            const prevCheck = lastRecord.safety_checks?.find(c => c.device_type === device.key);
            acc[device.key] = {
                status: prevCheck?.status || null,
                notes: prevCheck?.notes || '',
                photo: null, photoPreview: null,
                flaggedUser: prevCheck?.flagged_user || '',
            };
            return acc;
        }, {});
        setSafetyDevices(newSafetyDevices);

        // Repopulate daily maintenance checks
        const newDailyChecks = dailyMaintenanceCheckTypes.reduce((acc, check) => {
            const prevCheck = lastRecord.daily_maintenance_checks?.find(c => c.check_type === check.key);
            acc[check.key] = {
                status: prevCheck?.status || null,
                notes: prevCheck?.notes || '',
                photo: null, photoPreview: null,
                flaggedUser: prevCheck?.flagged_user || '',
            };
            return acc;
        }, {});
        setDailyMaintenanceChecks(newDailyChecks);
        
        // Repopulate work area checks
        const newWorkAreaChecks = workAreaCheckTypes.reduce((acc, check) => {
            const prevCheck = lastRecord.work_area_checks?.find(c => c.check_type === check.key);
            acc[check.key] = {
                status: prevCheck?.status || null,
                notes: prevCheck?.notes || '',
                photo: null, photoPreview: null,
                flaggedUser: prevCheck?.flagged_user || '',
            };
            return acc;
        }, {});
        setWorkAreaChecks(newWorkAreaChecks);

        // Repopulate safe operation checks
        const newSafeOpChecks = safeOperationCheckTypes.reduce((acc, check) => {
            const prevCheck = lastRecord.safe_operation_checks?.find(c => c.check_type === check.key);
            acc[check.key] = {
                status: prevCheck?.status || null,
                notes: prevCheck?.notes || '',
                photo: null, photoPreview: null,
                flaggedUser: prevCheck?.flagged_user || '',
            };
            return acc;
        }, {});
        setSafeOperationChecks(newSafeOpChecks);

        // Set operator name and current hours if available from last record, but hours should be filled from machine default on select.
        // For consistency, we'll let the user decide if they want to override current hours.
        // However, if the operator name was from the last record, we can suggest it.
        if (lastRecord.operator_name && operatorNames.includes(lastRecord.operator_name)) {
            setOperatorName(lastRecord.operator_name);
        }
        if (lastRecord.crew_name && crewNames.includes(lastRecord.crew_name)) {
            setCrewName(lastRecord.crew_name);
        }

        toast({ title: "Success", description: "Last answers have been loaded into the form.", variant: "success" });

    } catch (error) {
        console.error("Failed to load last answers:", error);
        toast({ title: "Error", description: "Failed to load previous records. Please try again.", variant: "destructive" });
    }
  };

  const handleHoursChange = (value) => {
    setCurrentHours(value);

    if (selectedMachine && value) {
        const machine = machines.find(m => m.id === selectedMachine);
        const lastHours = machine?.current_operating_hours;
        const newHours = parseInt(value, 10);

        if (machine && !isNaN(newHours) && lastHours != null) {
            if (newHours <= lastHours) {
                setHoursWarning(`Hours entered (${newHours}) are not greater than the last recorded hours (${lastHours}). Please verify.`);
            } else {
                setHoursWarning('');
            }
        } else {
            setHoursWarning('');
        }
    } else {
        setHoursWarning('');
    }
  };

  const handleTimeChange = (timeValue) => {
    if (!timeValue) return;
    try {
        const [hours, minutes] = timeValue.split(':');
        const newDate = new Date(executionDate);
        newDate.setHours(parseInt(hours, 10));
        newDate.setMinutes(parseInt(minutes, 10));
        setExecutionDate(newDate);
    } catch (e) {
        console.error("Invalid time value:", timeValue);
    }
  };

  const handleFluidChange = (fluidKey, field, value) => {
    setFluidLevels(prev => ({
      ...prev,
      [fluidKey]: { ...prev[fluidKey], [field]: value }
    }));
  };

  const handleSafetyDeviceChange = (deviceKey, field, value) => {
    setSafetyDevices(prev => ({
      ...prev,
      [deviceKey]: { ...prev[deviceKey], [field]: value }
    }));
  };

  const handleDailyMaintenanceChange = (checkKey, field, value) => {
    setDailyMaintenanceChecks(prev => ({
      ...prev,
      [checkKey]: { ...prev[checkKey], [field]: value }
    }));
  };

  const handleWorkAreaChange = (checkKey, field, value) => {
    setWorkAreaChecks(prev => ({
      ...prev,
      [checkKey]: { ...prev[checkKey], [field]: value }
    }));
  };

  const handleSafeOperationChange = (checkKey, field, value) => {
    setSafeOperationChecks(prev => ({
      ...prev,
      [checkKey]: { ...prev[checkKey], [field]: value }
    }));
  };

  const saveRecordOffline = (recordData) => {
    const pendingRecords = JSON.parse(localStorage.getItem('pendingMaintenanceRecords') || '[]');
    const recordWithLocalId = { ...recordData, localId: crypto.randomUUID() };
    pendingRecords.push(recordWithLocalId);
    localStorage.setItem('pendingMaintenanceRecords', JSON.stringify(pendingRecords));
    window.dispatchEvent(new CustomEvent('records-saved-offline'));
    toast({
        title: "Saved Offline",
        description: "This record has been saved locally and will sync when you're back online.",
        variant: "info",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📤 Form submitted - starting validation...');
    setIsSubmitting(true);

    // Validate required fields
    if (!selectedMachine || !operatorName) {
      toast({
        title: "Validation Error",
        description: "Please select a machine and enter operator name.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // currentHours is now a required field, validate it
    if (currentHours === null || currentHours.trim() === "") {
        toast({
            title: "Validation Error",
            description: "Please enter the current machine operating hours.",
            variant: "destructive",
        });
        setIsSubmitting(false);
        return;
    }

    // --- New Validation: Check if all items have a status ---
    const allFluidStatuses = fluidTypes.map(item => fluidLevels[item.key].status);
    const allSafetyDeviceStatuses = safetyDeviceTypes.map(item => safetyDevices[item.key].status);
    const allDailyMaintenanceStatuses = dailyMaintenanceCheckTypes.map(item => dailyMaintenanceChecks[item.key].status);
    const allWorkAreaStatuses = workAreaCheckTypes.map(item => workAreaChecks[item.key].status);
    const allSafeOperationStatuses = safeOperationCheckTypes.map(item => safeOperationChecks[item.key].status);

    const allAnswered = [
      ...allFluidStatuses,
      ...allSafetyDeviceStatuses,
      ...allDailyMaintenanceStatuses,
      ...allWorkAreaStatuses,
      ...allSafeOperationStatuses,
    ].every(status => status !== null);

    if (!allAnswered) {
        toast({
            title: "Incomplete Checklist",
            description: "Please answer all check items before signing. Every item must have a status selected (OK, Issue, or N/A).",
            variant: "destructive",
        });
        setIsSubmitting(false);
        return;
    }
    // --- End New Validation ---

    // Ensure the record is signed
    if (!isSigned) {
      toast({
        title: "Signature Required",
        description: "Please confirm the details by checking the signature box.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Process fluid level data
    const fluidChecks = [];
    for (const fluid of fluidTypes) {
      const fluidData = fluidLevels[fluid.key];
      if (fluidData.amount || fluidData.status || fluidData.notes || fluidData.flaggedUser) {
        fluidChecks.push({
          fluid_type: fluid.key,
          amount_added: fluidData.amount ? parseFloat(fluidData.amount) : null,
          status: fluidData.status,
          notes: fluidData.notes,
          flagged_user: fluidData.flaggedUser || null
        });
      }
    }

    // Process safety device data
    const safetyChecks = [];
    for (const device of safetyDeviceTypes) {
        const deviceData = safetyDevices[device.key];
        if (deviceData.status || deviceData.notes || deviceData.flaggedUser) {
            safetyChecks.push({
                device_type: device.key,
                status: deviceData.status,
                notes: deviceData.notes,
                flagged_user: deviceData.flaggedUser || null
            });
        }
    }

    // Process daily maintenance checks
    const dailyChecks = [];
    for (const check of dailyMaintenanceCheckTypes) {
        const checkData = dailyMaintenanceChecks[check.key];
        if (checkData.status || checkData.notes || checkData.flaggedUser) {
            dailyChecks.push({
                check_type: check.key,
                status: checkData.status,
                notes: checkData.notes,
                flagged_user: checkData.flaggedUser || null
            });
        }
    }

    // Process work area checks
    const workAreaChecksData = [];
    for (const check of workAreaCheckTypes) {
        const checkData = workAreaChecks[check.key];
        if (checkData.status || checkData.notes || checkData.flaggedUser) {
            workAreaChecksData.push({
                check_type: check.key,
                status: checkData.status,
                notes: checkData.notes,
                flagged_user: checkData.flaggedUser || null
            });
        }
    }

    // Process safe operation checks
    const safeOperationChecksData = [];
    for (const check of safeOperationCheckTypes) {
        const checkData = safeOperationChecks[check.key];
        if (checkData.status || checkData.notes || checkData.flaggedUser) {
            safeOperationChecksData.push({
                check_type: check.key,
                status: checkData.status,
                notes: checkData.notes,
                flagged_user: checkData.flaggedUser || null
            });
        }
    }

    // Create maintenance record payload
    const recordData = {
      machine_id: selectedMachine,
      checklist_id: checklist.id,
      crew_name: crewName,
      operator_name: operatorName,
      maintenance_type: 'routine',
      duration_minutes: null,
      completed_tasks: [],
      completed_at: executionDate.toISOString(),
      is_signed: true,
      fluid_checks: fluidChecks,
      safety_checks: safetyChecks,
      daily_maintenance_checks: dailyChecks,
      work_area_checks: workAreaChecksData,
      safe_operation_checks: safeOperationChecksData,
    };

    console.log('📋 Record payload created:', {
      fluidCount: fluidChecks.length,
      safetyCount: safetyChecks.length,
      dailyCount: dailyChecks.length,
      workAreaCount: workAreaChecksData.length,
      safeOpCount: safeOperationChecksData.length,
    });

    // DUPLICATE CHECK LOGIC
    if (navigator.onLine) {
        console.log('🔄 Checking for duplicate records...');
        const lastRecords = await MaintenanceRecord.filter({ machine_id: selectedMachine }, '-created_date', 1);
        const lastRecord = lastRecords.length > 0 ? lastRecords[0] : null;

        if (lastRecord) {
            console.log('📝 Last record found, comparing...');
            // Prepare current form data for comparison
            const currentComparisonObject = {
                fluid_checks: normalizeForComparison(recordData.fluid_checks, 'fluid_type'),
                safety_checks: normalizeForComparison(recordData.safety_checks, 'device_type'),
                daily_maintenance_checks: normalizeForComparison(recordData.daily_maintenance_checks, 'check_type'),
                work_area_checks: normalizeForComparison(recordData.work_area_checks, 'check_type'),
                safe_operation_checks: normalizeForComparison(recordData.safe_operation_checks, 'check_type'),
            };

            // Prepare last record data for comparison
            const lastComparisonObject = {
                fluid_checks: normalizeForComparison(lastRecord.fluid_checks, 'fluid_type'),
                safety_checks: normalizeForComparison(lastRecord.safety_checks, 'device_type'),
                daily_maintenance_checks: normalizeForComparison(lastRecord.daily_maintenance_checks, 'check_type'),
                work_area_checks: normalizeForComparison(lastRecord.work_area_checks, 'check_type'),
                safe_operation_checks: normalizeForComparison(lastRecord.safe_operation_checks, 'check_type'),
            };

            if (_isEqual(currentComparisonObject, lastComparisonObject)) {
                console.log('⚠️ Checklist is identical to previous one - skipping record creation but updating hours');
                // Answers are the same. Do not create a new record, but update hours and user data.
                try {
                    const { Machine } = await import('@/api/entities');
                    const machineToUpdate = machines.find(m => m.id === selectedMachine);

                    const updatePayload = {
                        current_operating_hours: parseInt(currentHours, 10),
                        last_service_date: executionDate.toISOString().split('T')[0]
                    };
                    
                    if (machineToUpdate && !Array.isArray(machineToUpdate.notes)) {
                        updatePayload.notes = [];
                    }

                    await Machine.update(selectedMachine, updatePayload);
                    // Store in localStorage instead
                    localStorage.setItem('last_used_machine_id', selectedMachine);
                    localStorage.setItem('last_used_operator_name', operatorName);
                    toast({
                        title: "Submission Logged",
                        description: "Checklist is identical to previous one. Machine hours updated, but no duplicate record was created.",
                        variant: "info",
                    });
                    setIsSubmitting(false);
                    onComplete(recordData); // Pass data back to close form
                    return; // Exit handleSubmit
                } catch (error) {
                    console.error('Error updating machine hours for duplicate record:', error);
                    toast({ title: "Error", description: "Could not update machine hours when preventing duplicate. Please try again.", variant: "destructive" });
                    setIsSubmitting(false);
                    return; // Exit handleSubmit
                }
            }
        } else {
            console.log('✅ No previous records found - proceeding with normal creation');
        }
    }


    // Save last used machine and operator to localStorage
    try {
      localStorage.setItem('last_used_machine_id', selectedMachine);
      localStorage.setItem('last_used_operator_name', operatorName);
    } catch (error) {
      console.warn("Could not save last used data:", error);
    }

    // Update machine hours if provided (and now it's always provided as required)
    if (currentHours) {
      recordData.machine_hours_at_service = parseInt(currentHours, 10);

      // Also update the machine's current hours
      try {
        console.log('🔧 Updating machine hours...');
        const machine = machines.find(m => m.id === selectedMachine);
        if (machine && navigator.onLine) { // Only update machine hours if online
          const { Machine } = await import('@/api/entities');
          
          const updatePayload = {
            current_operating_hours: parseInt(currentHours, 10),
            last_service_date: executionDate.toISOString().split('T')[0]
          };

          if (machine && !Array.isArray(machine.notes)) {
              updatePayload.notes = [];
          }

          await Machine.update(selectedMachine, updatePayload);
        }
      } catch (error) {
        console.error('Error updating machine hours:', error);
        // Do not block submission for this specific error, but log it.
        // The main record submission will handle online/offline status.
      }
    }

    if (navigator.onLine) {
      try {
        const newRecord = await MaintenanceRecord.create(recordData);
        console.log('✅ Maintenance record created:', newRecord.id);
        toast({ title: "Success", description: "Maintenance record saved successfully.", variant: "success" });

        // After saving the record, create issues for any flagged items.
        const issuesToCreate = [];
        const unitNo = machines.find(m => m.id === selectedMachine)?.unit_number || '';
        console.log('📋 Starting issue creation process for machine:', unitNo);

        const processCheckForIssue = (checkStateData, recordCheckData, label) => {
            // Create issue if status is 'issue' OR if an operator is flagged
            console.log(`  > Checking "${label}":`, { status: checkStateData.status, flaggedUser: checkStateData.flaggedUser });
            if (checkStateData.status === 'issue' || (checkStateData.flaggedUser && checkStateData.flaggedUser !== 'None')) {
                const issueTitle = `Issue: ${label} - Machine: ${unitNo}`;
                console.log(`  ✓ Creating issue: "${issueTitle}"`);
                // Check if an open or in_progress issue with the same title already exists for this machine.
                const existingIssue = openIssues.find(issue => issue.title === issueTitle && (issue.status === 'open' || issue.status === 'in_progress'));

                if (existingIssue) {
                    console.log(`Skipping creation of duplicate issue: ${issueTitle}`);
                    return; // Don't create a new issue
                }

                issuesToCreate.push({
                    title: issueTitle,
                    description: checkStateData.notes || `Issue identified for ${label}.`,
                    machine_id: selectedMachine,
                    maintenance_record_id: newRecord.id,
                    crew_name: recordData.crew_name,
                    photo_url: recordCheckData?.photo_url || null,
                    priority: 'medium', // Default priority, could be dynamic based on issue criticality
                    status: 'open',
                    assigned_to: checkStateData.flaggedUser && checkStateData.flaggedUser !== 'None' ? checkStateData.flaggedUser : null,
                });
            }
        };

        // Process fluid checks
        console.log('🔍 Processing fluid checks...');
        for (const fluid of fluidTypes) {
            const fluidStateData = fluidLevels[fluid.key];
            const matchingRecordFluidCheck = recordData.fluid_checks.find(fc => fc.fluid_type === fluid.key);
            processCheckForIssue(fluidStateData, matchingRecordFluidCheck, fluid.label);
        }

        // Process safety checks
        console.log('🔍 Processing safety checks...');
        for (const device of safetyDeviceTypes) {
            const deviceStateData = safetyDevices[device.key];
            const matchingRecordDeviceCheck = recordData.safety_checks.find(sc => sc.device_type === device.key);
            processCheckForIssue(deviceStateData, matchingRecordDeviceCheck, device.label);
        }

        // Process daily maintenance checks
        console.log('🔍 Processing daily maintenance checks...');
        for (const check of dailyMaintenanceCheckTypes) {
            const dailyCheckStateData = dailyMaintenanceChecks[check.key];
            const matchingRecordDailyCheck = recordData.daily_maintenance_checks.find(dmc => dmc.check_type === check.key);
            processCheckForIssue(dailyCheckStateData, matchingRecordDailyCheck, check.label);
        }

        // Process work area checks
        console.log('🔍 Processing work area checks...');
        for (const check of workAreaCheckTypes) {
            const workAreaCheckStateData = workAreaChecks[check.key];
            const matchingRecordWorkAreaCheck = recordData.work_area_checks.find(wac => wac.check_type === check.key);
            processCheckForIssue(workAreaCheckStateData, matchingRecordWorkAreaCheck, check.label);
        }
        
        // Process safe operation checks
        console.log('🔍 Processing safe operation checks...');
        for (const check of safeOperationCheckTypes) {
            const safeOpCheckStateData = safeOperationChecks[check.key];
            const matchingRecordSafeOpCheck = recordData.safe_operation_checks.find(soc => soc.check_type === check.key);
            processCheckForIssue(safeOpCheckStateData, matchingRecordSafeOpCheck, check.label);
        }

        console.log(`📊 Total issues to create: ${issuesToCreate.length}`, issuesToCreate);

        if (issuesToCreate.length > 0) {
            console.log('💾 Saving issues to database...');
            await MaintenanceIssue.bulkCreate(issuesToCreate);
            console.log('✅ Issues saved successfully!');
            toast({
                title: "Issues Logged",
                description: `${issuesToCreate.length} issue(s) have been automatically logged in the Maintenance Hub.`,
                variant: 'info'
            });
            // Dispatch event to notify other components like the MaintenanceHub page
            window.dispatchEvent(new CustomEvent('maintenance-issues-created'));
        } else {
            console.warn('⚠️ No issues were created - no items marked as issue or flagged');
        }
        
        onComplete(recordData);
      } catch (error) {
        console.error('❌ Error saving maintenance record online:', error);
        console.error('Error details:', error.message, error.stack);
        toast({ title: "Online Save Failed", description: "Could not save online. Saving offline instead.", variant: "warning" });
        saveRecordOffline(recordData);
        onComplete(recordData);
      }
    } else {
        console.log('🔌 Offline - saving to localStorage');
        saveRecordOffline(recordData);
        onComplete(recordData);
    }
    setIsSubmitting(false);
  };

  const priorityConfig = {
    low: { label: "Low", color: "bg-blue-100 text-blue-800" },
    medium: { label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    high: { label: "High", color: "bg-orange-100 text-orange-800" },
    critical: { label: "Critical", color: "bg-red-100 text-red-800" },
  };

  const statusConfig = {
    open: { label: "Open", color: "bg-gray-200 text-gray-800" },
    in_progress: { label: "In Progress", color: "bg-blue-200 text-blue-800" },
  };

  return (
    <Card className="bg-white shadow-lg border-slate-200 mb-8 max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">
              Execute: {checklist.name}
            </CardTitle>
            <div className="flex items-center gap-4 text-slate-600 mt-1">
              <p>{checklist.description}</p>
              {checklist.crew_name && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{checklist.crew_name}</span>
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Action Bar */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-end">
             <Button 
                type="button" 
                variant="outline"
                className="bg-white"
                onClick={handleLoadLastAnswers}
                disabled={!selectedMachine || isSubmitting}
             >
                <History className="w-4 h-4 mr-2" />
                Load Last Answers
             </Button>
          </div>

          {/* Machine Selection */}

          {selectedMachine && (
              <div className="pt-2">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="open-issues">
                    <AccordionTrigger className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg hover:bg-amber-100 data-[state=open]:rounded-b-none">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <span className="font-semibold text-amber-800">
                          {isLoadingIssues ? 'Loading Issues...' : `${openIssues.length} Open Issue(s) for this Machine`}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
                      {isLoadingIssues && <p className="text-slate-600">Loading...</p>}
                      {!isLoadingIssues && openIssues.length === 0 && <p className="text-slate-600">No open issues found for this machine. Good to go!</p>}
                      <div className="space-y-4">
                        {openIssues.map(issue => (
                          <div key={issue.id} className="p-3 bg-slate-50 rounded-md border border-slate-100">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-slate-800">{issue.title}</h4>
                              <div className="flex gap-2 text-xs">
                                <Badge className={priorityConfig[issue.priority]?.color || "bg-gray-100 text-gray-800"}>{priorityConfig[issue.priority]?.label || issue.priority}</Badge>
                                <Badge className={statusConfig[issue.status]?.color || "bg-gray-100 text-gray-800"}>{statusConfig[issue.status]?.label || issue.status.replace('_', ' ')}</Badge>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{issue.description}</p>
                            {issue.running_notes && (
                              <div className="mt-2 text-xs text-slate-500 bg-white p-2 rounded border">
                                <p className="font-semibold">Latest Note:</p>
                                <p>{issue.running_notes}</p>
                              </div>
                            )}
                            {issue.assigned_to && <p className="text-xs text-slate-500 mt-2"><b>Assigned To:</b> {issue.assigned_to}</p>}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
          )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="operator" className="font-bold text-red-600">Operator Name *</Label>
                  <Select value={operatorName} onValueChange={setOperatorName} required>
                    <SelectTrigger id="operator">
                        <SelectValue placeholder="Select an operator..." />
                    </SelectTrigger>
                    <SelectContent position="popper">
                           <SelectItem value="None">None</SelectItem> {/* Option to clear operator name */}
                        {operatorNames.map(name => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="crew">Crew Name</Label>
                  <Select value={crewName} onValueChange={setCrewName}>
                    <SelectTrigger id="crew">
                        <SelectValue placeholder="Select a crew..." />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        {crewNames.map(name => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <Input
                            id="date"
                            value={format(executionDate, 'PPP')}
                            disabled
                            className="pl-10 bg-slate-50"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <div className="relative">
                        <Clock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <Input
                            id="time"
                            type="time"
                            value={format(executionDate, 'HH:mm')}
                            onChange={(e) => handleTimeChange(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>

          {/* Machine Hours */}
          <div className="space-y-2">
            <Label htmlFor="hours" className="font-bold text-red-600">Current Machine Hours *</Label>
            <div className="relative">
              <Gauge className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                id="hours"
                type="number"
                min="0"
                value={currentHours}
                onChange={(e) => handleHoursChange(e.target.value)}
                placeholder="Enter current operating hours"
                className="pl-10"
                required
              />
            </div>
            {hoursWarning && (
                <p className="text-sm text-amber-600 mt-2 flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {hoursWarning}
                </p>
            )}
            <p className="text-xs text-slate-500 pt-1">
              This will update the machine's operating hours and record when service was performed.
            </p>
          </div>

          {/* Fluid Levels Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-blue-800 border-b pb-2">Fluid Levels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fluidTypes.map((fluid) => (
                <Card key={fluid.key} className="bg-slate-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold text-red-600">{fluid.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor={`fluid-amount-${fluid.key}`}>Amount Added (Litres)</Label>
                      <Input
                        id={`fluid-amount-${fluid.key}`}
                        type="number"
                        placeholder="e.g., 2.5"
                        value={fluidLevels[fluid.key].amount}
                        onChange={(e) => handleFluidChange(fluid.key, 'amount', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Status <span className="text-red-600">*</span></Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={fluidLevels[fluid.key].status === 'ok' ? 'default' : 'outline'}
                          className={`flex-1 ${fluidLevels[fluid.key].status === 'ok' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                          onClick={() => handleFluidChange(fluid.key, 'status', 'ok')}
                        >
                          <Check className="w-4 h-4 mr-1" /> OK
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={fluidLevels[fluid.key].status === 'issue' ? 'destructive' : 'outline'}
                          className="flex-1"
                          onClick={() => handleFluidChange(fluid.key, 'status', 'issue')}
                        >
                          <X className="w-4 h-4 mr-1" /> Issue
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={fluidLevels[fluid.key].status === 'na' ? 'secondary' : 'outline'}
                          className="flex-1"
                          onClick={() => handleFluidChange(fluid.key, 'status', 'na')}
                        >
                          <CircleOff className="w-4 h-4 mr-1" /> N/A
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`fluid-notes-${fluid.key}`}>Notes</Label>
                      <Textarea
                        id={`fluid-notes-${fluid.key}`}
                        placeholder="Add any relevant notes..."
                        rows={2}
                        value={fluidLevels[fluid.key].notes}
                        onChange={(e) => handleFluidChange(fluid.key, 'notes', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Flag Operator</Label>
                       <Select
                        value={fluidLevels[fluid.key].flaggedUser}
                        onValueChange={(value) => handleFluidChange(fluid.key, 'flaggedUser', value)}
                      >
                        <SelectTrigger>
                            <SelectValue placeholder="Select an operator to notify..." />
                        </SelectTrigger>
                        <SelectContent position="popper">
                           <SelectItem value="None">None</SelectItem>
                            {operatorNames.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Safety Devices Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-blue-800 border-b pb-2">Safety Devices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {safetyDeviceTypes.map((device) => (
                <Card key={device.key} className="bg-slate-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 font-bold text-red-600">
                        {device.icon && <device.icon className="w-5 h-5 text-red-600" />}
                        {device.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label>Status <span className="text-red-600">*</span></Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={safetyDevices[device.key].status === 'ok' ? 'default' : 'outline'}
                          className={`flex-1 ${safetyDevices[device.key].status === 'ok' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                          onClick={() => handleSafetyDeviceChange(device.key, 'status', 'ok')}
                        >
                          <Check className="w-4 h-4 mr-1" /> OK
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={safetyDevices[device.key].status === 'issue' ? 'destructive' : 'outline'}
                          className="flex-1"
                          onClick={() => handleSafetyDeviceChange(device.key, 'status', 'issue')}
                        >
                          <X className="w-4 h-4 mr-1" /> Issue
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={safetyDevices[device.key].status === 'na' ? 'secondary' : 'outline'}
                          className="flex-1"
                          onClick={() => handleSafetyDeviceChange(device.key, 'status', 'na')}
                        >
                          <CircleOff className="w-4 h-4 mr-1" /> N/A
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`safety-notes-${device.key}`}>Comment (enter comment as to why)</Label>
                      <Textarea
                        id={`safety-notes-${device.key}`}
                        placeholder="Add comment, especially if there is an issue..."
                        rows={2}
                        value={safetyDevices[device.key].notes}
                        onChange={(e) => handleSafetyDeviceChange(device.key, 'notes', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Flag Operator</Label>
                       <Select
                        value={safetyDevices[device.key].flaggedUser}
                        onValueChange={(value) => handleSafetyDeviceChange(device.key, 'flaggedUser', value)}
                      >
                        <SelectTrigger>
                            <SelectValue placeholder="Select an operator to notify..." />
                        </SelectTrigger>
                        <SelectContent position="popper">
                           <SelectItem value="None">None</SelectItem>
                            {operatorNames.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Daily Maintenance and Check Over Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-blue-800 border-b pb-2">Daily Maintenance and Check Over</h3>
            <p className="text-sm text-slate-600">Please write down any areas of concern and flag.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dailyMaintenanceCheckTypes.map((check) => (
                <Card key={check.key} className="bg-slate-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 font-bold text-red-600">
                        {check.icon && <check.icon className="w-5 h-5 text-red-600" />}
                        {check.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label>Status <span className="text-red-600">*</span></Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={dailyMaintenanceChecks[check.key].status === 'ok' ? 'default' : 'outline'}
                          className={`flex-1 ${dailyMaintenanceChecks[check.key].status === 'ok' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                          onClick={() => handleDailyMaintenanceChange(check.key, 'status', 'ok')}
                        >
                          <Check className="w-4 h-4 mr-1" /> OK
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={dailyMaintenanceChecks[check.key].status === 'issue' ? 'destructive' : 'outline'}
                          className="flex-1"
                          onClick={() => handleDailyMaintenanceChange(check.key, 'status', 'issue')}
                        >
                          <X className="w-4 h-4 mr-1" /> Issue
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={dailyMaintenanceChecks[check.key].status === 'na' ? 'secondary' : 'outline'}
                          className="flex-1"
                          onClick={() => handleDailyMaintenanceChange(check.key, 'status', 'na')}
                        >
                          <CircleOff className="w-4 h-4 mr-1" /> N/A
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`daily-notes-${check.key}`}>Comments</Label>
                      <Textarea
                        id={`daily-notes-${check.key}`}
                        placeholder="Add comment, especially if there is an issue..."
                        rows={2}
                        value={dailyMaintenanceChecks[check.key].notes}
                        onChange={(e) => handleDailyMaintenanceChange(check.key, 'notes', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Flag Operator</Label>
                       <Select
                        value={dailyMaintenanceChecks[check.key].flaggedUser}
                        onValueChange={(value) => handleDailyMaintenanceChange(check.key, 'flaggedUser', value)}
                      >
                        <SelectTrigger>
                            <SelectValue placeholder="Select an operator to notify..." />
                        </SelectTrigger>
                        <SelectContent position="popper">
                           <SelectItem value="None">None</SelectItem>
                            {operatorNames.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Work Areas Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-blue-800 border-b pb-2">Work Areas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workAreaCheckTypes.map((check) => (
                <Card key={check.key} className="bg-slate-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 font-bold text-red-600">
                        {check.icon && <check.icon className="w-5 h-5 text-red-600" />}
                        {check.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label>Status <span className="text-red-600">*</span></Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={workAreaChecks[check.key].status === 'ok' ? 'default' : 'outline'}
                          className={`flex-1 ${workAreaChecks[check.key].status === 'ok' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                          onClick={() => handleWorkAreaChange(check.key, 'status', 'ok')}
                        >
                          <Check className="w-4 h-4 mr-1" /> OK
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={workAreaChecks[check.key].status === 'issue' ? 'destructive' : 'outline'}
                          className="flex-1"
                          onClick={() => handleWorkAreaChange(check.key, 'status', 'issue')}
                        >
                          <X className="w-4 h-4 mr-1" /> Issue
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={workAreaChecks[check.key].status === 'na' ? 'secondary' : 'outline'}
                          className="flex-1"
                          onClick={() => handleWorkAreaChange(check.key, 'status', 'na')}
                        >
                          <CircleOff className="w-4 h-4 mr-1" /> N/A
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`workarea-notes-${check.key}`}>Comments</Label>
                      <Textarea
                        id={`workarea-notes-${check.key}`}
                        placeholder="Add comment, especially if there is an issue..."
                        rows={2}
                        value={workAreaChecks[check.key].notes}
                        onChange={(e) => handleWorkAreaChange(check.key, 'notes', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Flag Operator</Label>
                       <Select
                        value={workAreaChecks[check.key].flaggedUser}
                        onValueChange={(value) => handleWorkAreaChange(check.key, 'flaggedUser', value)}
                      >
                        <SelectTrigger>
                            <SelectValue placeholder="Select an operator to notify..." />
                        </SelectTrigger>
                        <SelectContent position="popper">
                           <SelectItem value="None">None</SelectItem>
                            {operatorNames.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Safe Operation Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-blue-800 border-b pb-2">Safe Operation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {safeOperationCheckTypes.map((check) => (
                <Card key={check.key} className="bg-slate-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 font-bold text-red-600">
                        {check.icon && <check.icon className="w-5 h-5 text-red-600" />}
                        {check.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label>Status <span className="text-red-600">*</span></Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={safeOperationChecks[check.key].status === 'ok' ? 'default' : 'outline'}
                          className={`flex-1 ${safeOperationChecks[check.key].status === 'ok' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                          onClick={() => handleSafeOperationChange(check.key, 'status', 'ok')}
                        >
                          <Check className="w-4 h-4 mr-1" /> OK
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={safeOperationChecks[check.key].status === 'issue' ? 'destructive' : 'outline'}
                          className="flex-1"
                          onClick={() => handleSafeOperationChange(check.key, 'status', 'issue')}
                        >
                          <X className="w-4 h-4 mr-1" /> Issue
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={safeOperationChecks[check.key].status === 'na' ? 'secondary' : 'outline'}
                          className="flex-1"
                          onClick={() => handleSafeOperationChange(check.key, 'status', 'na')}
                        >
                          <CircleOff className="w-4 h-4 mr-1" /> N/A
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`safeop-notes-${check.key}`}>Comments</Label>
                      <Textarea
                        id={`safeop-notes-${check.key}`}
                        placeholder="Add comment..."
                        rows={2}
                        value={safeOperationChecks[check.key].notes}
                        onChange={(e) => handleSafeOperationChange(check.key, 'notes', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Flag Operator</Label>
                       <Select
                        value={safeOperationChecks[check.key].flaggedUser}
                        onValueChange={(value) => handleSafeOperationChange(check.key, 'flaggedUser', value)}
                      >
                        <SelectTrigger>
                            <SelectValue placeholder="Select an operator to notify..." />
                        </SelectTrigger>
                        <SelectContent position="popper">
                           <SelectItem value="None">None</SelectItem>
                            {operatorNames.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </CardContent>
                </Card>
              ))}
            </div>
          </div>


          {/* Safety Requirements */}
          {checklist.safety_requirements && checklist.safety_requirements.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800">Safety Requirements</h3>
              </div>
              <ul className="space-y-1">
                {checklist.safety_requirements.map((requirement, index) => (
                  <li key={index} className="text-sm text-amber-700 flex items-center gap-2">
                    <div className="w-1 h-1 bg-amber-600 rounded-full"></div>
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-4">
          <div className="flex items-center space-x-2 p-4 bg-slate-50 border rounded-lg">
            <Checkbox id="signature" checked={isSigned} onCheckedChange={setIsSigned} />
            <Label htmlFor="signature" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I confirm the details are correct. This serves as my digital signature.
            </Label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isSigned || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSubmitting ? 'Saving...' : 'Sign & Save'}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
