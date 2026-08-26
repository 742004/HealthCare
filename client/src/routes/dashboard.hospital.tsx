import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { BedDouble, Stethoscope, HeartPulse, Ambulance, Check, X, User } from "lucide-react";
import { toast } from "sonner";
import { doctorService } from "@/services/api";
import { useAuth } from "@/context/auth-context";

import { db } from "@/config/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";

export const Route = createFileRoute("/dashboard/hospital")({
  component: HospitalDashboard,
});

const kpis = [
  { icon: BedDouble, label: "Available Beds", value: 42, color: "text-primary" },
  { icon: Stethoscope, label: "Doctors Available", value: 18, color: "text-secondary" },
  { icon: HeartPulse, label: "ICU Beds", value: 6, color: "text-destructive" },
  { icon: Ambulance, label: "Ambulances", value: 8, color: "text-orange-500" },
];

function HospitalDashboard() {
  const { user } = useAuth();
  const { data: doctors } = useQuery({ queryKey: ["doctors"], queryFn: doctorService.list });
  
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, "emergencyRequests"), where("status", "==", "REQUESTED"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emergencies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(emergencies);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const acceptEmergency = async (id: string, patientName: string) => {
    try {
      // Transaction / race condition check
      const docRef = doc(db, "emergencyRequests", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().status === "REQUESTED") {
        await updateDoc(docRef, {
          status: "HOSPITAL_ACCEPTED",
          hospitalId: user?.id || "hosp-1",
          hospitalName: user?.name || "St. Mary's Medical Center",
          acceptedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success(`Accepted emergency for ${patientName}`);
        if (selected?.id === id) setSelected(null);
      } else {
        toast.error("This emergency has already been accepted.");
      }
    } catch (e) {
      toast.error("Failed to accept emergency.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Hospital Command</h1>
        <p className="text-muted-foreground mt-1">St. Mary's Medical Center · Live operations view</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <k.icon className={`w-6 h-6 ${k.color}`} />
                  <Badge variant="secondary" className="text-xs">Live</Badge>
                </div>
                <div className="text-3xl font-bold mt-3">{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Incoming Emergency Requests</h3>
            <Badge className="gradient-primary">{requests.length} active</Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                    ))
                  : requests.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">No active requests.</TableCell></TableRow>
                  ) : requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.patientName || "Unknown"}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs font-mono">{r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">Just now</TableCell>
                        <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>Details</Button>
                          <Button size="sm" className="gap-1" onClick={() => acceptEmergency(r.id, r.patientName)}>
                            <Check className="w-3.5 h-3.5" /> Accept
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">On-shift Doctors</h3>
            <div className="space-y-2">
              {doctors?.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition">
                  <div className="w-10 h-10 rounded-full gradient-primary grid place-items-center text-primary-foreground font-semibold">
                    {d.name.split(" ")[1]?.[0] ?? "D"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.specialty}</div>
                  </div>
                  <Badge variant={d.available ? "default" : "outline"} className={d.available ? "bg-secondary text-secondary-foreground" : ""}>
                    {d.available ? "Available" : "In surgery"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Hospital Profile</h3>
            <div className="space-y-3 text-sm">
              {[
                ["Name", "St. Mary's Medical Center"],
                ["License", "MED-4472-CA"],
                ["Address", "1200 Elm Street, Downtown"],
                ["Trauma Level", "I"],
                ["Total Beds", "220"],
                ["Contact", "+1 (555) 010-4200"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border/60 pb-2 last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Patient Details</DialogTitle>
            <DialogDescription>Real-time snapshot for triage decisions.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selected.patientName}</span></div>
              <div><span className="text-muted-foreground">ID:</span> <span className="font-medium text-xs font-mono">{selected.patientId}</span></div>
              <div><span className="text-muted-foreground">Location:</span> <span className="font-medium font-mono">{selected.latitude?.toFixed(5)}, {selected.longitude?.toFixed(5)}</span></div>
              <div className="pt-2 flex gap-2">
                <Button className="flex-1" onClick={() => acceptEmergency(selected.id, selected.patientName)}>Accept Emergency</Button>
                <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
