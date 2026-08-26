import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Siren, MapPin, Hospital as HospitalIcon, Ambulance as AmbulanceIcon, Bot, Phone,
  CheckCircle2, Circle, Star, Clock, Activity, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { hospitalService, ambulanceService, patientService } from "@/services/api";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { lazy, Suspense } from "react";
const PatientMap = lazy(() => import("@/components/PatientMap"));

export const Route = createFileRoute("/dashboard/patient")({
  component: PatientDashboard,
});

type EmergencyState = "IDLE" | "REQUESTED" | "HOSPITAL_ACCEPTED" | "AMBULANCE_ASSIGNED" | "ON_THE_WAY" | "REACHED_HOSPITAL" | "COMPLETED" | "CANCELLED";

const timelineConfig = [
  { key: "REQUESTED", label: "Requested" },
  { key: "HOSPITAL_ACCEPTED", label: "Hospital Accepted" },
  { key: "AMBULANCE_ASSIGNED", label: "Ambulance Assigned" },
  { key: "ON_THE_WAY", label: "On the Way" },
  { key: "REACHED_HOSPITAL", label: "Reached Hospital" },
];

import { db } from "@/config/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";



function PatientDashboard() {
  const { user } = useAuth();
  const { data: hospitals, isLoading: hLoading } = useQuery({ queryKey: ["hospitals"], queryFn: hospitalService.list });
  const { data: ambs, isLoading: aLoading } = useQuery({ queryKey: ["ambulances"], queryFn: ambulanceService.list });
  const { data: history, isLoading: histLoading } = useQuery({ queryKey: ["history"], queryFn: patientService.history });

  // State
  const [activeEmergency, setActiveEmergency] = useState<EmergencyState>("IDLE");
  const [activeEmergencyId, setActiveEmergencyId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string; isError?: boolean } | null>(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hospitalLocation, setHospitalLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sosLocation, setSosLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [sosConfirmOpen, setSosConfirmOpen] = useState(false);
  const [isSendingEmergency, setIsSendingEmergency] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Firestore Real-Time Listener
  useEffect(() => {
    if (!user?.id) return;
    const q = query(collection(db, "emergencyRequests"), where("patientId", "==", user.id), where("status", "in", ["REQUESTED", "HOSPITAL_ACCEPTED", "AMBULANCE_ASSIGNED", "ON_THE_WAY", "REACHED_HOSPITAL"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        
        // Handle Toast Notifications on status change
        if (activeEmergency !== data.status && activeEmergency !== "IDLE") {
           if (data.status === "HOSPITAL_ACCEPTED") toast.success("Hospital accepted your emergency request.");
           if (data.status === "AMBULANCE_ASSIGNED") toast.success("Ambulance has been assigned.");
           if (data.status === "ON_THE_WAY") toast.success("Ambulance is on the way.");
           if (data.status === "REACHED_HOSPITAL") toast.success("Ambulance has reached the hospital.");
        }
        
        setActiveEmergency(data.status as EmergencyState);
        setActiveEmergencyId(docSnap.id);
        
        if (data.sosLatitude && data.sosLongitude) {
          setSosLocation({ lat: data.sosLatitude, lng: data.sosLongitude, accuracy: data.sosAccuracy });
        }

        if (data.ambulanceLatitude && data.ambulanceLongitude) {
          setAmbulanceLocation({ lat: data.ambulanceLatitude, lng: data.ambulanceLongitude });
        }
        
        if (data.hospitalId && hospitals) {
          const matchedHospital = hospitals.find((h: any) => h.id === data.hospitalId || h._id === data.hospitalId);
          if (matchedHospital && matchedHospital.latitude && matchedHospital.longitude) {
            setHospitalLocation({ lat: matchedHospital.latitude, lng: matchedHospital.longitude });
          }
        }
      } else {
        if (activeEmergency !== "COMPLETED" && activeEmergency !== "CANCELLED") {
          setActiveEmergency("IDLE");
          setActiveEmergencyId(null);
          setAmbulanceLocation(null);
          setHospitalLocation(null);
          setSosLocation(null);
        }
      }
    });

    return () => unsubscribe();
  }, [user?.id, activeEmergency, hospitals]);

  const updateLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        let address = undefined;
        let isError = false;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          if (res.ok) {
            const data = await res.json();
            address = data.display_name;
          } else {
            isError = true;
          }
        } catch (e) {
          isError = true;
        }
        
        setLocation({ lat, lng, address, isError });
        toast.success("Location updated successfully");
        setLocationLoading(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission was denied. Please enable location access in your browser settings.");
        } else {
          toast.error("Unable to determine your current location. Please try again.");
        }
        setLocationLoading(false);
      }
    );
  };

  // Helper for Haversine Distance
  const getDistanceMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8; // Radius of earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Compute sorted hospitals
  const sortedHospitals = hospitals ? [...hospitals].map(h => {
    if (location && h.latitude && h.longitude) {
      const miles = getDistanceMiles(location.lat, location.lng, h.latitude, h.longitude);
      return { ...h, dynamicDistance: miles };
    }
    return { ...h, dynamicDistance: Infinity };
  }).sort((a, b) => {
    if (a.dynamicDistance === Infinity && b.dynamicDistance === Infinity) return 0;
    return a.dynamicDistance - b.dynamicDistance;
  }) : [];


  const handleSosClick = () => {
    if (activeEmergency !== "IDLE" && activeEmergency !== "COMPLETED" && activeEmergency !== "CANCELLED") {
      toast.error("You already have an active emergency request.");
      return;
    }
    // We no longer block SOS purely on whether `location` state exists, 
    // because we fetch it synchronously on confirm. But we keep the check 
    // to ensure they have granted permissions previously or we can just let it attempt.
    setSosConfirmOpen(true);
  };

  const confirmSos = async () => {
    if (isSendingEmergency) return;
    setSosConfirmOpen(false);
    setIsSendingEmergency(true);
    
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsSendingEmergency(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      await addDoc(collection(db, "emergencyRequests"), {
        patientId: user?.id,
        patientName: user?.name,
        patientEmail: user?.email,
        status: "REQUESTED",
        sosLatitude: lat,
        sosLongitude: lng,
        sosAccuracy: accuracy,
        sosLocationTimestamp: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Emergency request sent successfully.");
    } catch (err: any) {
      if (err.code === 1) { // PERMISSION_DENIED
        toast.error("Location permission denied. Please enable location access to send an SOS.");
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        toast.error("Unable to determine your precise location. Please try again or move outdoors.");
      } else if (err.code === 3) { // TIMEOUT
        toast.error("Location request timed out. Please try again.");
      } else {
        toast.error("Unable to send emergency request. Please check your connection and try again.");
      }
      console.error(err);
    } finally {
      setIsSendingEmergency(false);
    }
  };

  const cancelEmergency = async () => {
    if (!activeEmergencyId) return;
    try {
      await updateDoc(doc(db, "emergencyRequests", activeEmergencyId), {
        status: "CANCELLED",
        updatedAt: serverTimestamp()
      });
      setActiveEmergency("CANCELLED");
      toast("Emergency Cancelled");
      setTimeout(() => setActiveEmergency("IDLE"), 2000);
    } catch (e) {
      toast.error("Failed to cancel emergency.");
    }
  };

  const getTimelineState = (stepIndex: number) => {
    const states = ["REQUESTED", "HOSPITAL_ACCEPTED", "AMBULANCE_ASSIGNED", "ON_THE_WAY", "REACHED_HOSPITAL"];
    const currentIndex = states.indexOf(activeEmergency);
    if (currentIndex === -1) return { done: false, active: false }; // Not in timeline states
    if (stepIndex < currentIndex) return { done: true, active: false };
    if (stepIndex === currentIndex) return { done: false, active: true };
    return { done: false, active: false };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold">Good day, {user?.name.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">Here's your emergency-ready command center.</p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl overflow-hidden border-destructive/40">
          <CardContent className="p-8 bg-gradient-to-br from-destructive/10 via-transparent to-transparent">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <button
                onClick={handleSosClick}
                disabled={isSendingEmergency || (activeEmergency !== "IDLE" && activeEmergency !== "COMPLETED" && activeEmergency !== "CANCELLED")}
                className={`w-40 h-40 rounded-full bg-destructive text-destructive-foreground grid place-items-center shadow-elegant transition-transform ${(isSendingEmergency || (activeEmergency !== "IDLE" && activeEmergency !== "COMPLETED" && activeEmergency !== "CANCELLED")) ? 'opacity-70 cursor-not-allowed' : 'animate-pulse-ring hover:scale-105'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  {isSendingEmergency ? (
                    <>
                      <Loader2 className="w-12 h-12 animate-spin" />
                      <span className="font-black text-xl">SENDING</span>
                    </>
                  ) : activeEmergency === "REQUESTED" ? (
                    <>
                      <CheckCircle2 className="w-12 h-12" />
                      <span className="font-black text-lg text-center leading-tight mt-1">REQUESTED</span>
                    </>
                  ) : (activeEmergency === "HOSPITAL_ACCEPTED" || activeEmergency === "AMBULANCE_ASSIGNED" || activeEmergency === "ON_THE_WAY" || activeEmergency === "REACHED_HOSPITAL") ? (
                    <>
                      <Activity className="w-12 h-12" />
                      <span className="font-black text-lg text-center leading-tight mt-1">EMERGENCY<br/>ACTIVE</span>
                    </>
                  ) : (
                    <>
                      <Siren className="w-12 h-12" />
                      <span className="font-black text-2xl">SOS</span>
                    </>
                  )}
                </div>
              </button>
              <div className="flex-1 text-center sm:text-left">
                {isSendingEmergency ? (
                  <>
                    <h3 className="text-xl font-bold">Sending Request</h3>
                    <p className="text-sm text-muted-foreground mt-1">Sending emergency request...</p>
                  </>
                ) : activeEmergency === "REQUESTED" ? (
                  <>
                    <h3 className="text-xl font-bold">Request Sent</h3>
                    <p className="text-sm text-muted-foreground mt-1">Waiting for hospital acceptance.</p>
                  </>
                ) : (activeEmergency === "HOSPITAL_ACCEPTED" || activeEmergency === "AMBULANCE_ASSIGNED" || activeEmergency === "ON_THE_WAY" || activeEmergency === "REACHED_HOSPITAL") ? (
                  <>
                    <h3 className="text-xl font-bold">Help is on the way</h3>
                    <p className="text-sm text-muted-foreground mt-1">Emergency workflow started.</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold">One-tap Emergency</h3>
                    <p className="text-sm text-muted-foreground mt-1">Alerts the nearest ambulance, hospital, and your emergency contacts simultaneously.</p>
                  </>
                )}
                <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Badge variant="secondary" className="gap-1"><MapPin className="w-3 h-3" /> Location shared</Badge>
                  <Badge variant="secondary" className="gap-1"><Activity className="w-3 h-3" /> Vitals ready</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          {(activeEmergency !== "IDLE" && activeEmergency !== "COMPLETED" && activeEmergency !== "CANCELLED" && sosLocation) && (
            <Card className="rounded-2xl border-destructive shadow-sm">
              <CardContent className="p-6 space-y-3">
                <div className="text-xs uppercase tracking-wider text-destructive font-bold">Emergency Pickup Location</div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-destructive" />
                  <div className="font-semibold text-sm">Location captured at SOS</div>
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  Lat: {sosLocation.lat.toFixed(6)}, Lng: {sosLocation.lng.toFixed(6)}
                  {sosLocation.accuracy && ` (±${Math.round(sosLocation.accuracy)}m)`}
                </div>
                {isMounted ? (
                  <Suspense fallback={<div className="h-32 rounded-xl bg-card border border-border flex items-center justify-center text-sm text-muted-foreground">Loading map...</div>}>
                    <PatientMap location={sosLocation} ambulanceLocation={ambulanceLocation} hospitalLocation={hospitalLocation} />
                  </Suspense>
                ) : (
                  <div className="h-32 rounded-xl bg-card border border-border" />
                )}
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full mt-2" 
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${sosLocation.lat},${sosLocation.lng}`, "_blank")}
                >
                  Open SOS Location in Google Maps
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl">
            <CardContent className="p-6 space-y-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Current Location</div>
              
              {location ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-primary" />
                    <div className="font-semibold text-sm">Location detected</div>
                  </div>
                  
                  {location.address ? (
                    <div className="text-sm font-medium mb-1 line-clamp-2">{location.address}</div>
                  ) : location.isError ? (
                    <div className="text-sm font-medium mb-1 text-destructive">Address unavailable</div>
                  ) : null}

                  <div className="text-xs text-muted-foreground mb-3">
                    Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                  </div>
                  {/* Only show the current location map if there isn't an active emergency map to save space, or show it always? User didn't specify to hide it. I will keep it. */}
                  {isMounted ? (
                    <Suspense fallback={<div className="h-32 rounded-xl bg-card border border-border flex items-center justify-center text-sm text-muted-foreground">Loading map...</div>}>
                      <PatientMap location={location} ambulanceLocation={null} hospitalLocation={null} />
                    </Suspense>
                  ) : (
                    <div className="h-32 rounded-xl bg-card border border-border" />
                  )}
                  
                  <div className="flex flex-col gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full" 
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`, "_blank")}
                    >
                      Open in Google Maps
                    </Button>
                    <Button variant="secondary" size="sm" className="w-full" onClick={updateLocation} disabled={locationLoading}>
                      {locationLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Update location
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="h-32 rounded-xl bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 grid place-items-center p-4 text-center">
                    <span className="text-sm text-muted-foreground">Location not available<br/>Click "Update location" to detect your current location.</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" disabled>Open in Google Maps</Button>
                  <Button variant="secondary" size="sm" className="w-full" onClick={updateLocation} disabled={locationLoading}>
                    {locationLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Update location
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Emergency status timeline */}
      {(activeEmergency !== "IDLE" && activeEmergency !== "COMPLETED" && activeEmergency !== "CANCELLED") ? (
        <Card className="rounded-2xl border-primary shadow-elegant">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-primary">Active Emergency Status</h3>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={cancelEmergency}>Cancel</Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:items-center">
              {timelineConfig.map((t, i) => {
                const { done, active } = getTimelineState(i);
                return (
                  <div key={t.key} className="flex-1 flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      {done ? (
                        <CheckCircle2 className="w-7 h-7 text-secondary" />
                      ) : active ? (
                        <div className="w-7 h-7 rounded-full bg-primary animate-pulse grid place-items-center">
                          <Circle className="w-3 h-3 fill-primary-foreground text-primary-foreground" />
                        </div>
                      ) : (
                        <Circle className="w-7 h-7 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${done || active ? "" : "text-muted-foreground"}`}>{t.label}</div>
                      {i < timelineConfig.length - 1 && (
                        <div className={`hidden sm:block h-0.5 mt-3 ${done ? "bg-secondary" : "bg-border"}`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-center text-muted-foreground py-10">
            <Siren className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold text-lg">No Active Emergency</h3>
            <p className="text-sm">Press SOS to request emergency assistance.</p>
          </CardContent>
        </Card>
      )}

      {/* Nearby hospitals */}
      <div>
        <h3 className="font-semibold mb-3">Nearby Hospitals <span className="text-xs font-normal text-muted-foreground ml-2">(Informational)</span></h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="rounded-2xl"><CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-8 w-full" />
                </CardContent></Card>
              ))
            : sortedHospitals.slice(0, 3).map((h) => (
                <Card key={h.id} className="rounded-2xl hover:shadow-soft transition-all hover:-translate-y-0.5 cursor-pointer">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <HospitalIcon className="w-5 h-5 text-primary" />
                        <div className="font-semibold">{h.name}</div>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {h.rating}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> 
                      {h.dynamicDistance !== Infinity ? `${h.dynamicDistance.toFixed(1)} mi` : h.distance} · {h.beds} beds
                    </div>
                    <Badge className="bg-secondary text-secondary-foreground gap-1 text-xs"><Clock className="w-3 h-3" /> ER Open</Badge>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" className="gap-1"><Phone className="w-3.5 h-3.5" /> Call</Button>
                      <Button size="sm" variant="outline">Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>

      {/* Ambulances + AI Widget */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="font-semibold mb-3">Available Ambulances</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {aLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
              : ambs?.map((a) => (
                  <Card key={a.id} className="rounded-2xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl gradient-primary grid place-items-center">
                        <AmbulanceIcon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{a.code}</span>
                          <Badge variant={a.status === "available" ? "default" : a.status === "busy" ? "secondary" : "outline"} className="text-[10px]">
                            {a.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{a.driver} · ETA {a.eta}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </div>

        <Card className="rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary grid place-items-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold">AI Assistant</div>
                <div className="text-xs text-muted-foreground">Ready to triage</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Ask about symptoms, medications, or next steps — 24/7.</p>
            <Button asChild className="w-full gradient-primary rounded-xl">
              <Link to="/dashboard/chatbot">Open chat</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Medical history */}
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Medical History</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {histLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                    ))
                  : history?.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>{h.date}</TableCell>
                        <TableCell>{h.type}</TableCell>
                        <TableCell>{h.hospital}</TableCell>
                        <TableCell><Badge variant="secondary">{h.outcome}</Badge></TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* SOS Confirmation Dialog */}
      <AlertDialog open={sosConfirmOpen} onOpenChange={setSosConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive text-xl flex items-center gap-2">
              <Siren className="w-6 h-6" /> Emergency Assistance
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to request emergency assistance?<br/><br/>
              Your current location will be shared with the emergency response system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSos} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm Emergency
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

