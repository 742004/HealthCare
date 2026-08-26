import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Siren, MapPin, Hospital, Users, Ambulance, PhoneCall, Share2, Map } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "SOS Emergency — Get Help Now" },
      { name: "description", content: "Trigger an SOS to alert emergency services and your contacts instantly." },
      { property: "og:title", content: "SOS Emergency" },
      { property: "og:description", content: "One-tap SOS for immediate help." },
    ],
  }),
  component: Sos,
});

function Sos() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-destructive">SOS Emergency</h1>
          <p className="text-muted-foreground">Tap the button to alert emergency services and your contacts.</p>
        </div>

        <div className="flex justify-center py-6">
          <button
            onClick={() => toast.success("SOS activated — help is on the way", { description: "Location and medical info shared with responders." })}
            className="relative w-56 h-56 rounded-full bg-destructive text-destructive-foreground font-black text-3xl grid place-items-center shadow-elegant animate-pulse-ring hover:scale-105 transition-transform"
          >
            <div className="flex flex-col items-center gap-2">
              <Siren className="w-16 h-16" />
              SOS
            </div>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-5 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Current Location</div>
                <div className="font-semibold">45 Riverside Blvd, Downtown</div>
                <div className="text-xs text-muted-foreground">GPS accuracy: 6 m</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-start gap-3">
              <Hospital className="w-5 h-5 text-secondary shrink-0" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Nearest Hospital</div>
                <div className="font-semibold">St. Mary's Medical Center</div>
                <div className="text-xs text-muted-foreground">0.8 mi · 24/7 ER open</div>
              </div>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2">
            <CardContent className="p-5 flex items-start gap-3">
              <Users className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Emergency Contacts to Notify</div>
                <div className="font-semibold">Michael Rodriguez, Dr. Sarah Chen, James Patel</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-2">While you wait</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>Stay calm and remain on the line with the operator if possible.</li>
              <li>Unlock your door if it's safe so responders can enter.</li>
              <li>Move to a visible, well-lit area if you can.</li>
              <li>Do not eat or drink unless instructed.</li>
            </ul>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button className="h-16 gap-2 gradient-primary" onClick={() => toast.success("Calling ambulance...")}>
            <Ambulance className="w-5 h-5" /> Ambulance
          </Button>
          <Button variant="outline" className="h-16 gap-2" onClick={() => toast.success("Calling family...")}>
            <PhoneCall className="w-5 h-5" /> Family
          </Button>
          <Button variant="outline" className="h-16 gap-2" onClick={() => toast.info("Opening maps...")}>
            <Map className="w-5 h-5" /> Maps
          </Button>
          <Button variant="outline" className="h-16 gap-2" onClick={() => toast.success("Live location shared")}>
            <Share2 className="w-5 h-5" /> Share
          </Button>
        </div>
      </div>
    </Layout>
  );
}
