import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Navigation, Search, Star, Hospital as HospitalIcon, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hospitals")({
  head: () => ({
    meta: [
      { title: "Nearby Hospitals — Emergency Healthcare Connector" },
      { name: "description", content: "Find hospitals near you with real-time emergency room availability, ratings, and directions." },
      { property: "og:title", content: "Nearby Hospitals" },
      { property: "og:description", content: "Find the closest hospital with ER availability." },
    ],
  }),
  component: Hospitals,
});

const hospitals = [
  { name: "St. Mary's Medical Center", address: "1200 Elm Street, Downtown", distance: "0.8 mi", rating: 4.7, er: true, phone: "+1 (555) 010-4200", tag: "Trauma Level I" },
  { name: "Riverside General Hospital", address: "45 Riverside Blvd", distance: "1.4 mi", rating: 4.5, er: true, phone: "+1 (555) 010-8899", tag: "Cardiac Care" },
  { name: "Northside Community Hospital", address: "678 North Ave", distance: "2.1 mi", rating: 4.3, er: true, phone: "+1 (555) 010-2211", tag: "Pediatric ER" },
  { name: "Lakeside Urgent Care", address: "22 Lakeside Dr", distance: "3.0 mi", rating: 4.2, er: false, phone: "+1 (555) 010-5551", tag: "Walk-in" },
  { name: "Metropolitan Heart Institute", address: "801 Central Pkwy", distance: "3.6 mi", rating: 4.8, er: true, phone: "+1 (555) 010-6600", tag: "Cardiology" },
  { name: "Greenfield Regional Hospital", address: "300 Greenfield Rd", distance: "4.2 mi", rating: 4.4, er: true, phone: "+1 (555) 010-7788", tag: "Full-Service ER" },
];

const filters = ["All", "24/7 ER", "Trauma", "Pediatric", "Cardiac", "Under 2 mi"];

function Hospitals() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");

  const list = hospitals.filter((h) =>
    h.name.toLowerCase().includes(query.toLowerCase()) ||
    h.address.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Nearby Hospitals</h1>
          <p className="text-muted-foreground mt-1">Emergency rooms and urgent care near your location.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by hospital name or address..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`text-xs px-3 py-1.5 rounded-full transition ${active === f ? "gradient-primary text-primary-foreground shadow-soft" : "bg-accent hover:bg-primary/10"}`}
            >
              {f}
            </button>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="h-64 relative bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 grid place-items-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Interactive map — showing {list.length} hospitals nearby</p>
            </div>
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_40%,var(--color-primary)_0,transparent_20%),radial-gradient(circle_at_70%_60%,var(--color-secondary)_0,transparent_20%)]" />
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {list.map((h, i) => (
            <Card
              key={h.name}
              className="hover:shadow-soft transition-all hover:-translate-y-0.5 animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl gradient-primary grid place-items-center shrink-0">
                    <HospitalIcon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold truncate">{h.name}</h3>
                      <div className="flex items-center gap-1 text-sm shrink-0">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {h.rating}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" /> {h.address} · {h.distance}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">{h.tag}</Badge>
                      {h.er ? (
                        <Badge className="bg-secondary text-secondary-foreground text-xs gap-1">
                          <Clock className="w-3 h-3" /> 24/7 ER Open
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Urgent Care</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Button size="sm" className="gap-1" onClick={() => toast.success(`Calling ${h.name}`)}>
                    <Phone className="w-3.5 h-3.5" /> Call
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.info("Opening maps...")}>
                    <Navigation className="w-3.5 h-3.5" /> Navigate
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toast.info(`Viewing ${h.name}`)}>
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
