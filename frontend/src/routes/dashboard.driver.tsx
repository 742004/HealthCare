import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ambulance, MapPin, Check, X, Navigation, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

import { db } from "@/config/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";

export const Route = createFileRoute("/dashboard/driver")({
  component: DriverDashboard,
});

type Status = "online" | "busy" | "offline";

function DriverDashboard() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("online");
  const badge = { online: "bg-secondary text-secondary-foreground", busy: "bg-orange-500 text-white", offline: "bg-muted text-muted-foreground" };

  const [availableRequests, setAvailableRequests] = useState<any[]>([]);
  const [activeEmergency, setActiveEmergency] = useState<any | null>(null);

  // Mock ambulance location for simulation
  const [currentLocation, setCurrentLocation] = useState({ lat: 18.5204, lng: 73.8567 });

  useEffect(() => {
    // Listen for available requests (accepted by hospital but not yet assigned to an ambulance)
    const qAvailable = query(collection(db, "emergencyRequests"), where("status", "==", "HOSPITAL_ACCEPTED"));
    const unsubAvailable = onSnapshot(qAvailable, (snapshot) => {
      const emergencies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvailableRequests(emergencies);
    });

    // Listen for my assigned active request
    if (user?.id) {
      const qActive = query(collection(db, "emergencyRequests"), where("ambulanceDriverId", "==", user.id), where("status", "in", ["AMBULANCE_ASSIGNED", "ON_THE_WAY", "REACHED_HOSPITAL"]));
      const unsubActive = onSnapshot(qActive, (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setActiveEmergency({ id: docSnap.id, ...docSnap.data() });
        } else {
          setActiveEmergency(null);
        }
      });
      return () => {
        unsubAvailable();
        unsubActive();
      };
    }

    return () => unsubAvailable();
  }, [user?.id]);

  // Simulate movement when ON_THE_WAY
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeEmergency?.status === "ON_THE_WAY" && activeEmergency.latitude && activeEmergency.longitude) {
      interval = setInterval(async () => {
        const targetLat = activeEmergency.latitude;
        const targetLng = activeEmergency.longitude;
        
        // Move 10% closer to the target every second for simulation
        const newLat = currentLocation.lat + (targetLat - currentLocation.lat) * 0.1;
        const newLng = currentLocation.lng + (targetLng - currentLocation.lng) * 0.1;
        
        setCurrentLocation({ lat: newLat, lng: newLng });

        try {
          await updateDoc(doc(db, "emergencyRequests", activeEmergency.id), {
            ambulanceLatitude: newLat,
            ambulanceLongitude: newLng,
            ambulanceUpdatedAt: serverTimestamp()
          });
        } catch (e) {
          console.error("Failed to update location", e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeEmergency?.status, activeEmergency?.latitude, activeEmergency?.longitude, currentLocation, activeEmergency?.id]);


  const acceptAssignment = async (id: string) => {
    try {
      const docRef = doc(db, "emergencyRequests", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().status === "HOSPITAL_ACCEPTED") {
        await updateDoc(docRef, {
          status: "AMBULANCE_ASSIGNED",
          ambulanceId: "AMB-104",
          ambulanceDriverId: user?.id || "driver-1",
          ambulanceAssignedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success("Assignment accepted.");
        setStatus("busy");
      } else {
        toast.error("Request already assigned.");
      }
    } catch (e) {
      toast.error("Failed to accept assignment.");
    }
  };

  const startJourney = async () => {
    if (!activeEmergency) return;
    try {
      await updateDoc(doc(db, "emergencyRequests", activeEmergency.id), {
        status: "ON_THE_WAY",
        updatedAt: serverTimestamp()
      });
      toast.success("Journey started. Location sharing active.");
    } catch (e) {
      toast.error("Failed to start journey.");
    }
  };

  const markReached = async () => {
    if (!activeEmergency) return;
    try {
      await updateDoc(doc(db, "emergencyRequests", activeEmergency.id), {
        status: "REACHED_HOSPITAL",
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Reached destination.");
    } catch (e) {
      toast.error("Failed to mark reached.");
    }
  };

  const completeEmergency = async () => {
    if (!activeEmergency) return;
    try {
      await updateDoc(doc(db, "emergencyRequests", activeEmergency.id), {
        status: "COMPLETED",
        updatedAt: serverTimestamp()
      });
      toast.success("Emergency completed.");
      setStatus("online");
    } catch (e) {
      toast.error("Failed to complete emergency.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Ambulance Driver</h1>
          <p className="text-muted-foreground mt-1">AMB-104 · {user?.name || "Driver"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <div className="flex rounded-xl border border-border p-1 bg-card">
            {(["online", "busy", "offline"] as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${status === s ? badge[s] : "text-muted-foreground hover:bg-accent"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live map (simulated) */}
      <Card className="rounded-2xl overflow-hidden">
        <div className="h-72 relative bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_40%,var(--color-primary)_0,transparent_20%),radial-gradient(circle_at_70%_60%,var(--color-secondary)_0,transparent_20%),radial-gradient(circle_at_50%_20%,var(--color-destructive)_0,transparent_15%)]" />
          {activeEmergency && activeEmergency.status === "ON_THE_WAY" && (
            <div className="absolute top-4 left-4 rounded-xl bg-card/80 backdrop-blur p-3 shadow-soft border border-primary/20">
              <div className="text-xs text-muted-foreground">Live Tracking Active</div>
              <div className="text-xs text-primary flex items-center gap-1 mt-1">
                <Navigation className="w-3 h-3 animate-pulse" /> Sharing location to Patient
              </div>
            </div>
          )}
          <div className="absolute bottom-4 right-4 rounded-xl bg-card/80 backdrop-blur p-3 shadow-soft">
            <div className="text-xs text-muted-foreground">Simulated GPS</div>
            <div className="font-mono text-xs">{currentLocation.lat.toFixed(4)}° N, {currentLocation.lng.toFixed(4)}° E</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <h3 className="font-semibold">Active Assignment</h3>
            {activeEmergency ? (
              <>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full gradient-primary grid place-items-center text-primary-foreground font-semibold">
                       {activeEmergency.patientName?.[0] || "?"}
                     </div>
                     <div>
                       <div className="font-semibold">{activeEmergency.patientName || "Unknown"}</div>
                       <Badge variant="outline">{activeEmergency.status}</Badge>
                     </div>
                   </div>
                </div>
                <div className="space-y-2 text-sm border-t border-border pt-3">
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Destination: Patient Location ({activeEmergency.latitude?.toFixed(4)}, {activeEmergency.longitude?.toFixed(4)})</div>
                  <div className="flex items-center gap-2"><Ambulance className="w-4 h-4 text-secondary" /> Requesting Hospital: {activeEmergency.hospitalName}</div>
                </div>
                <div className="pt-2 space-y-2">
                  {activeEmergency.status === "AMBULANCE_ASSIGNED" && (
                    <Button className="w-full gradient-primary" onClick={startJourney}>Start Journey</Button>
                  )}
                  {activeEmergency.status === "ON_THE_WAY" && (
                    <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={markReached}>Mark Reached</Button>
                  )}
                  {activeEmergency.status === "REACHED_HOSPITAL" && (
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={completeEmergency}>Complete Emergency</Button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <Ambulance className="w-12 h-12 mx-auto mb-3 opacity-20" />
                No active assignment.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Available Requests (Hospital Accepted)</h3>
            <div className="space-y-3">
              {availableRequests.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No available requests at the moment.</div>
              ) : (
                availableRequests.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl border border-border hover:border-primary/50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{r.patientName}</div>
                        <div className="text-xs text-muted-foreground">To: {r.hospitalName}</div>
                      </div>
                      <Badge variant="outline" className="shrink-0">Demo ETA: 6 min</Badge>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" className="flex-1 gap-1" onClick={() => acceptAssignment(r.id)}>
                        <Check className="w-3.5 h-3.5" /> Accept Assignment
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
