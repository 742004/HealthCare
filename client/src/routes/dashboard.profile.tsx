import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pencil, Save, HeartPulse, Shield, Phone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

export const Route = createFileRoute("/dashboard/profile")({
  component: Profile,
});

function Profile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "Alex Rodriguez",
    email: user?.email || "alex@ehc.app",
    phone: "+1 (555) 812-4477",
    dob: "1991-03-14",
    blood: "O+",
    allergies: "Penicillin, peanuts",
    conditions: "Type 2 diabetes, mild asthma",
    contact1: "Michael Rodriguez — +1 (555) 812-4488",
    contact2: "Dr. Sarah Chen — +1 (555) 234-1980",
    insurance: "BlueCross · Member #BCX-4472-991",
  });

  const set = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });
  const initials = form.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground mt-1">Keep your medical details up to date so responders always have the latest.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-center space-y-3">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold text-lg">{form.name}</div>
              <div className="text-sm text-muted-foreground">{form.email}</div>
            </div>
            <Badge className="gap-1 gradient-primary"><HeartPulse className="w-3 h-3" /> {form.blood}</Badge>
            <Button variant="outline" className="w-full gap-1" onClick={() => setEditing(!editing)}>
              {editing ? <Save className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              {editing ? "Save" : "Edit Profile"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl">
          <CardContent className="p-6 grid gap-4 sm:grid-cols-2">
            {[
              ["name", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["dob", "Date of birth"],
              ["blood", "Blood group"],
            ].map(([k, label]) => (
              <div key={k}>
                <Label>{label}</Label>
                <Input
                  disabled={!editing}
                  value={form[k as keyof typeof form]}
                  onChange={(e) => set(k as keyof typeof form, e.target.value)}
                  className="mt-1.5"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex items-center gap-2 -mb-1">
            <HeartPulse className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Medical Details</h3>
          </div>
          <div className="sm:col-span-2">
            <Label>Allergies</Label>
            <Textarea disabled={!editing} value={form.allergies} onChange={(e) => set("allergies", e.target.value)} rows={2} className="mt-1.5" />
          </div>
          <div className="sm:col-span-2">
            <Label>Existing conditions</Label>
            <Textarea disabled={!editing} value={form.conditions} onChange={(e) => set("conditions", e.target.value)} rows={2} className="mt-1.5" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2 pt-2 -mb-1">
            <Phone className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Emergency Contacts</h3>
          </div>
          <div><Label>Primary contact</Label><Input disabled={!editing} value={form.contact1} onChange={(e) => set("contact1", e.target.value)} className="mt-1.5" /></div>
          <div><Label>Secondary contact</Label><Input disabled={!editing} value={form.contact2} onChange={(e) => set("contact2", e.target.value)} className="mt-1.5" /></div>
          <div className="sm:col-span-2 flex items-center gap-2 pt-2 -mb-1">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Insurance</h3>
          </div>
          <div className="sm:col-span-2"><Input disabled={!editing} value={form.insurance} onChange={(e) => set("insurance", e.target.value)} className="mt-1.5" /></div>
          <div className="sm:col-span-2 pt-2">
            <Button className="gradient-primary" onClick={() => { setEditing(false); toast.success("Profile updated"); }}>
              <Save className="w-4 h-4 mr-2" /> Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
