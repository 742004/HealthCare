import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, MessageSquare, MapPin, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/emergency-contacts")({
  head: () => ({
    meta: [
      { title: "Emergency Contacts — Emergency Healthcare Connector" },
      { name: "description", content: "Reach family, friends, and doctors instantly during a medical emergency." },
      { property: "og:title", content: "Emergency Contacts" },
      { property: "og:description", content: "Quick access to your most important people." },
    ],
  }),
  component: Contacts,
});

const contacts = [
  { name: "Dr. Sarah Chen", relation: "Primary Physician", phone: "+1 (555) 234-1980" },
  { name: "Michael Rodriguez", relation: "Spouse", phone: "+1 (555) 812-4477" },
  { name: "Emily Rodriguez", relation: "Daughter", phone: "+1 (555) 812-4488" },
  { name: "James Patel", relation: "Emergency Contact", phone: "+1 (555) 662-0091" },
  { name: "Northside Pharmacy", relation: "Pharmacy", phone: "+1 (555) 908-3320" },
  { name: "Dr. Amara Okoye", relation: "Cardiologist", phone: "+1 (555) 771-6612" },
];

const initials = (n: string) => n.split(" ").map((s) => s[0]).slice(0, 2).join("");

function Contacts() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 relative min-h-[70vh]">
        <div>
          <h1 className="text-3xl font-bold">Emergency Contacts</h1>
          <p className="text-muted-foreground mt-1">Your most important people, one tap away.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c, i) => (
            <Card key={c.name} className="hover:shadow-soft transition-all animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="gradient-primary text-primary-foreground font-semibold">
                      {initials(c.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.relation}</div>
                    <div className="text-sm text-primary mt-0.5">{c.phone}</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Button size="sm" className="gap-1" onClick={() => toast.success(`Calling ${c.name}`)}>
                    <Phone className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info("Opening SMS")}>
                    <MessageSquare className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.success("Location shared")}>
                    <MapPin className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toast.info("Editing contact")}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          onClick={() => toast.success("Add contact form opened")}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full gradient-primary shadow-elegant"
          aria-label="Add contact"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </Layout>
  );
}
