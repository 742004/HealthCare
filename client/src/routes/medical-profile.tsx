import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { HeartPulse, Download, Save, Pencil, IdCard } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/medical-profile")({
  head: () => ({
    meta: [
      { title: "Medical Profile — Emergency Healthcare Connector" },
      { name: "description", content: "Create a digital medical ID with blood group, allergies, and conditions for emergency responders." },
      { property: "og:title", content: "Medical Profile" },
      { property: "og:description", content: "Your emergency medical ID card." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const [editing, setEditing] = useState(true);
  const [form, setForm] = useState({
    name: "Alex Rodriguez",
    age: "34",
    gender: "Male",
    blood: "O+",
    height: "178 cm",
    weight: "76 kg",
    allergies: "Penicillin, peanuts",
    diseases: "Type 2 diabetes, mild asthma",
    meds: "Metformin 500mg, Albuterol inhaler",
    contacts: "Michael Rodriguez — +1 (555) 812-4477",
    organ: true,
  });

  const set = (k: keyof typeof form, v: string | boolean) => setForm({ ...form, [k]: v });

  const save = () => {
    setEditing(false);
    toast.success("Medical profile saved");
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Medical Profile</h1>
              <p className="text-muted-foreground mt-1">Shared with responders during an emergency.</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-6 grid gap-4 sm:grid-cols-2">
              {[
                ["name", "Full Name"],
                ["age", "Age"],
                ["gender", "Gender"],
                ["blood", "Blood Group"],
                ["height", "Height"],
                ["weight", "Weight"],
              ].map(([k, label]) => (
                <div key={k}>
                  <Label className="mb-1.5 block">{label}</Label>
                  <Input
                    disabled={!editing}
                    value={form[k as keyof typeof form] as string}
                    onChange={(e) => set(k as keyof typeof form, e.target.value)}
                  />
                </div>
              ))}
              {[
                ["allergies", "Allergies"],
                ["diseases", "Existing Diseases"],
                ["meds", "Current Medications"],
                ["contacts", "Emergency Contacts"],
              ].map(([k, label]) => (
                <div key={k} className="sm:col-span-2">
                  <Label className="mb-1.5 block">{label}</Label>
                  <Textarea
                    disabled={!editing}
                    value={form[k as keyof typeof form] as string}
                    onChange={(e) => set(k as keyof typeof form, e.target.value)}
                    rows={2}
                  />
                </div>
              ))}
              <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <Label className="text-base">Organ Donor</Label>
                  <p className="text-xs text-muted-foreground">Registered as an organ donor</p>
                </div>
                <Switch
                  disabled={!editing}
                  checked={form.organ}
                  onCheckedChange={(v) => set("organ", v)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            {editing ? (
              <Button onClick={save} className="gap-2"><Save className="w-4 h-4" /> Save Profile</Button>
            ) : (
              <Button onClick={() => setEditing(true)} variant="outline" className="gap-2"><Pencil className="w-4 h-4" /> Edit</Button>
            )}
            <Button variant="outline" className="gap-2" onClick={() => toast.success("Emergency card downloaded")}>
              <Download className="w-4 h-4" /> Download Emergency Card
            </Button>
          </div>
        </div>

        {/* ID Card */}
        <div>
          <div className="sticky top-24">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <IdCard className="w-3.5 h-3.5" /> Digital Emergency ID
            </div>
            <div className="rounded-3xl gradient-primary text-primary-foreground p-6 shadow-elegant space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 grid place-items-center">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs opacity-80">MEDICAL ID</div>
                    <div className="font-semibold text-sm">HealthcareAI</div>
                  </div>
                </div>
                <div className="text-2xl font-black bg-white/20 rounded-lg px-2.5 py-1">{form.blood}</div>
              </div>
              <div>
                <div className="text-xs opacity-80">Name</div>
                <div className="font-bold text-lg">{form.name}</div>
                <div className="text-xs opacity-80">Age {form.age} · {form.gender}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="opacity-80">Allergies</div>
                  <div className="font-medium">{form.allergies || "—"}</div>
                </div>
                <div>
                  <div className="opacity-80">Conditions</div>
                  <div className="font-medium">{form.diseases || "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="opacity-80">Medications</div>
                  <div className="font-medium">{form.meds || "—"}</div>
                </div>
              </div>
              <div className="border-t border-white/20 pt-3 flex items-center justify-between text-xs">
                <span>Organ Donor: {form.organ ? "Yes" : "No"}</span>
                <span className="opacity-80">Scan on lock screen</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
