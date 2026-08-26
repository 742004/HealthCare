import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Ambulance, Stethoscope, Hospital as HospitalIcon, Bell } from "lucide-react";

export const Route = createFileRoute("/dashboard/notifications")({
  component: Notifications,
});

const notifs = [
  { icon: CheckCircle2, color: "text-secondary", title: "Emergency Accepted", body: "St. Mary's Medical Center accepted your request.", time: "just now" },
  { icon: Ambulance, color: "text-primary", title: "Ambulance Assigned", body: "AMB-104 has been dispatched. ETA 6 minutes.", time: "1 min ago" },
  { icon: Stethoscope, color: "text-violet-500", title: "Doctor Ready", body: "Dr. Sarah Chen is standing by at the ER.", time: "3 min ago" },
  { icon: HospitalIcon, color: "text-emerald-500", title: "Hospital Confirmed", body: "ICU bed reserved in your name.", time: "5 min ago" },
  { icon: Bell, color: "text-orange-500", title: "Reminder", body: "Take your evening dose of Metformin at 8:00 pm.", time: "1 hr ago" },
];

function Notifications() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">Real-time updates about your emergencies and care.</p>
        </div>
        <Button variant="outline" size="sm">Mark all read</Button>
      </div>
      <div className="space-y-3">
        {notifs.map((n, i) => (
          <Card key={i} className="rounded-2xl hover:shadow-soft transition">
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl bg-accent grid place-items-center ${n.color}`}>
                <n.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold">{n.title}</div>
                  <Badge variant="outline" className="text-xs">{n.time}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
