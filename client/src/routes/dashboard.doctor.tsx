import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Stethoscope, MessageSquare, FileText, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/doctor")({
  component: DoctorDashboard,
});

const patients = [
  { id: "p1", name: "Alex Rodriguez", age: 34, reason: "Chest pain evaluation", severity: "critical" },
  { id: "p2", name: "Emma Wilson", age: 27, reason: "Post-op check", severity: "low" },
  { id: "p3", name: "Linda Park", age: 58, reason: "Suspected TIA", severity: "high" },
  { id: "p4", name: "Mohammed Ali", age: 12, reason: "Asthma exacerbation", severity: "medium" },
];

const severityColor: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-secondary text-secondary-foreground",
};

function DoctorDashboard() {
  const [chat, setChat] = useState([{ from: "patient", text: "Doctor, my chest still feels tight." }]);
  const [msg, setMsg] = useState("");

  const send = () => {
    if (!msg.trim()) return;
    setChat([...chat, { from: "doctor", text: msg }]);
    setMsg("");
    setTimeout(() => setChat((c) => [...c, { from: "patient", text: "Thank you doctor, I'll try that." }]), 800);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Doctor's Console</h1>
        <p className="text-muted-foreground mt-1">Today's queue, patient records, and quick prescriptions.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { icon: User, label: "Today's Patients", value: 12 },
          { icon: Stethoscope, label: "Emergency Queue", value: 3 },
          { icon: FileText, label: "Prescriptions", value: 8 },
          { icon: MessageSquare, label: "Unread Messages", value: 5 },
        ].map((k) => (
          <Card key={k.label} className="rounded-2xl">
            <CardContent className="p-5">
              <k.icon className="w-6 h-6 text-primary" />
              <div className="text-3xl font-bold mt-3">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl">
          <CardContent className="p-6">
            <Tabs defaultValue="queue">
              <TabsList>
                <TabsTrigger value="queue">Emergency Queue</TabsTrigger>
                <TabsTrigger value="records">Patient Records</TabsTrigger>
                <TabsTrigger value="rx">Prescription</TabsTrigger>
              </TabsList>

              <TabsContent value="queue" className="mt-4 space-y-2">
                {patients.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition">
                    <div className="w-10 h-10 rounded-full gradient-primary grid place-items-center text-primary-foreground font-semibold">
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{p.name} <span className="text-muted-foreground text-xs">· {p.age}y</span></div>
                      <div className="text-xs text-muted-foreground truncate">{p.reason}</div>
                    </div>
                    <Badge className={severityColor[p.severity]}>{p.severity}</Badge>
                    <Button size="sm" variant="outline" onClick={() => toast.success(`Opened ${p.name}'s chart`)}>Open</Button>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="records" className="mt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {patients.map((p) => (
                    <Card key={p.id} className="rounded-xl">
                      <CardContent className="p-4">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">Last visit: 2026-07-12</div>
                        <div className="text-xs text-muted-foreground">Blood: O+ · Allergies: Penicillin</div>
                        <Button size="sm" variant="ghost" className="mt-2 -ml-3 text-primary">View full record →</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="rx" className="mt-4 space-y-3">
                <div><Label>Patient</Label><Input className="mt-1.5" defaultValue="Alex Rodriguez" /></div>
                <div><Label>Medication</Label><Input className="mt-1.5" placeholder="e.g. Amoxicillin 500mg" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Dosage</Label><Input className="mt-1.5" placeholder="1 tab · 3x daily" /></div>
                  <div><Label>Duration</Label><Input className="mt-1.5" placeholder="7 days" /></div>
                </div>
                <div><Label>Notes</Label><Textarea className="mt-1.5" rows={3} placeholder="Take with food..." /></div>
                <Button className="gradient-primary" onClick={() => toast.success("Prescription issued")}>Issue Prescription</Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="rounded-2xl flex flex-col">
          <CardContent className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <div className="font-semibold">Chat with Patient</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Alex Rodriguez</div>
          </CardContent>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-96">
            {chat.map((c, i) => (
              <div key={i} className={`flex ${c.from === "doctor" ? "justify-end" : ""}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${c.from === "doctor" ? "gradient-primary text-primary-foreground" : "bg-muted"}`}>
                  {c.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === "Enter" && send()} />
            <Button size="icon" onClick={send} className="gradient-primary"><Send className="w-4 h-4" /></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
