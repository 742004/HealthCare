import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Hospital as HospitalIcon, Ambulance as AmbulanceIcon, Navigation, User, Clock } from "lucide-react";
import { hospitalService, ambulanceService } from "@/services/api";

export const Route = createFileRoute("/dashboard/map")({
  component: MapPage,
});

function MapPage() {
  const [q, setQ] = useState("");
  const { data: hospitals, isLoading } = useQuery({ queryKey: ["hospitals"], queryFn: hospitalService.list });
  const { data: ambs } = useQuery({ queryKey: ["ambulances"], queryFn: ambulanceService.list });

  const list = (hospitals || []).filter((h) => h.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Live Map</h1>
          <p className="text-muted-foreground mt-1">Hospitals, ambulances, and your location — all in one view.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hospitals..." className="pl-9" />
        </div>
      </div>

      <Card className="rounded-2xl overflow-hidden">
        <div className="h-96 relative bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_40%,var(--color-primary)_0,transparent_18%),radial-gradient(circle_at_70%_60%,var(--color-secondary)_0,transparent_18%),radial-gradient(circle_at_50%_20%,var(--color-destructive)_0,transparent_15%),radial-gradient(circle_at_20%_80%,var(--color-primary)_0,transparent_16%)]" />
          {/* Markers */}
          <div className="absolute top-[30%] left-[25%] flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground grid place-items-center shadow-elegant animate-pulse-ring">
              <User className="w-4 h-4" />
            </div>
            <div className="mt-1 text-xs bg-card px-2 py-0.5 rounded-md shadow">You</div>
          </div>
          <div className="absolute top-[55%] left-[45%] flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-soft">
              <HospitalIcon className="w-4 h-4" />
            </div>
            <div className="mt-1 text-xs bg-card px-2 py-0.5 rounded-md shadow">St. Mary's</div>
          </div>
          <div className="absolute top-[40%] left-[70%] flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground grid place-items-center shadow-soft">
              <AmbulanceIcon className="w-4 h-4" />
            </div>
            <div className="mt-1 text-xs bg-card px-2 py-0.5 rounded-md shadow">AMB-104</div>
          </div>

          {/* Route card */}
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-72 rounded-xl bg-card/90 backdrop-blur p-4 shadow-elegant">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4 text-primary" />
              <div className="font-semibold text-sm">Route</div>
            </div>
            <div className="text-xs text-muted-foreground">Your location → St. Mary's Medical</div>
            <div className="flex items-center justify-between mt-2">
              <Badge className="gap-1"><Clock className="w-3 h-3" /> 8 min ETA</Badge>
              <span className="text-xs font-medium">3.2 mi</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-semibold mb-3">Hospitals near you</h3>
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
              : list.map((h) => (
                  <Card key={h.id} className="rounded-2xl hover:border-primary/50 transition">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl gradient-primary grid place-items-center">
                        <HospitalIcon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{h.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {h.distance} · {h.beds} beds
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Route</Button>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Ambulances in the area</h3>
          <div className="space-y-3">
            {ambs?.map((a) => (
              <Card key={a.id} className="rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-secondary grid place-items-center">
                    <AmbulanceIcon className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{a.code} · {a.vehicle}</div>
                    <div className="text-xs text-muted-foreground">{a.driver} · ETA {a.eta}</div>
                  </div>
                  <Badge variant={a.status === "available" ? "default" : "outline"}>{a.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
