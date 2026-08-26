import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart, Brain, Flame, Bone, Wind, Droplet, Bug, Skull, Zap,
  AlertTriangle, Check, X, PhoneCall, ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/first-aid")({
  head: () => ({
    meta: [
      { title: "First Aid Guide — Emergency Healthcare Connector" },
      { name: "description", content: "Step-by-step first-aid instructions for heart attack, stroke, burns, choking, bleeding, and more." },
      { property: "og:title", content: "First Aid Guide" },
      { property: "og:description", content: "Emergency first-aid step-by-step guides." },
    ],
  }),
  component: FirstAid,
});

const categories = [
  { id: "heart", label: "Heart Attack", icon: Heart, color: "text-destructive",
    dos: ["Call emergency services immediately", "Have the person sit down and rest", "Loosen tight clothing", "Give aspirin (325 mg chewed) if not allergic"],
    donts: ["Don't leave the person alone", "Don't give food or drink", "Don't let them drive themselves"],
    call: "Call immediately if chest pain lasts more than 5 minutes or radiates to arm/jaw." },
  { id: "stroke", label: "Stroke", icon: Brain, color: "text-primary",
    dos: ["Note the time symptoms started", "Call emergency services", "Keep the person calm and lying down", "Turn head to one side if vomiting"],
    donts: ["Don't give food, drink or medication", "Don't wait to see if symptoms pass"],
    call: "Use the FAST test: Face droop, Arm weakness, Speech difficulty, Time to call." },
  { id: "burns", label: "Burns", icon: Flame, color: "text-orange-500",
    dos: ["Cool with running water for 20 minutes", "Remove non-stuck jewelry/clothing", "Cover with cling film or clean cloth"],
    donts: ["Don't use ice, butter or toothpaste", "Don't break blisters", "Don't peel stuck clothing"],
    call: "Call for burns larger than palm size, on face/hands/genitals, or if skin is charred." },
  { id: "fracture", label: "Fracture", icon: Bone, color: "text-amber-600",
    dos: ["Keep the limb still", "Support with a splint or padding", "Apply ice wrapped in cloth"],
    donts: ["Don't try to realign the bone", "Don't move if spinal injury suspected"],
    call: "Call if bone is protruding, limb is deformed, or numbness/paleness occurs." },
  { id: "choking", label: "Choking", icon: Wind, color: "text-secondary",
    dos: ["Encourage coughing", "Give 5 back blows between shoulder blades", "Perform 5 abdominal thrusts (Heimlich)"],
    donts: ["Don't do blind finger sweeps", "Don't hit an infant's back while upright"],
    call: "Call if the person can't cough, speak or breathe after initial attempts." },
  { id: "bleeding", label: "Bleeding", icon: Droplet, color: "text-destructive",
    dos: ["Apply firm direct pressure with clean cloth", "Raise the wound above heart level", "Add layers if blood soaks through"],
    donts: ["Don't remove embedded objects", "Don't peek under the cloth"],
    call: "Call for spurting blood, blood loss > 1 cup, or bleeding that won't stop in 10 min." },
  { id: "snake", label: "Snake Bite", icon: Bug, color: "text-emerald-600",
    dos: ["Keep the person calm and still", "Immobilize the bitten limb below heart level", "Remove tight jewelry/clothing"],
    donts: ["Don't suck the venom", "Don't apply a tourniquet or ice", "Don't cut the wound"],
    call: "Call immediately — note the snake's color and pattern if safe to do so." },
  { id: "poison", label: "Poisoning", icon: Skull, color: "text-purple-600",
    dos: ["Call poison control", "Identify the substance if possible", "Save the container/label"],
    donts: ["Don't induce vomiting unless told to", "Don't give food or drink"],
    call: "Call immediately if unconscious, seizing, or trouble breathing." },
  { id: "shock", label: "Electric Shock", icon: Zap, color: "text-yellow-500",
    dos: ["Turn off the power source first", "Use a wooden/plastic object to separate", "Check breathing and start CPR if needed"],
    donts: ["Don't touch the person until power is off", "Don't move if serious injury suspected"],
    call: "Call for any high-voltage shock, burns, or loss of consciousness." },
] as const;

function FirstAid() {
  const [active, setActive] = useState<string | null>(null);
  const item = categories.find((c) => c.id === active);

  if (item) {
    const Icon = item.icon;
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <Button variant="ghost" onClick={() => setActive(null)} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> All categories
          </Button>

          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
            <div>
              <div className="font-semibold text-destructive">Emergency situation</div>
              <p className="text-sm text-muted-foreground">If life is at risk, call your local emergency number immediately.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-accent grid place-items-center ${item.color}`}>
              <Icon className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold">{item.label}</h1>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-secondary mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5" /> Do's
                </h3>
                <ul className="space-y-2 text-sm">
                  {item.dos.map((d) => (
                    <li key={d} className="flex gap-2"><Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> {d}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                  <X className="w-5 h-5" /> Don'ts
                </h3>
                <ul className="space-y-2 text-sm">
                  {item.donts.map((d) => (
                    <li key={d} className="flex gap-2"><X className="w-4 h-4 text-destructive shrink-0 mt-0.5" /> {d}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="border-destructive/30">
            <CardContent className="p-6 flex items-start gap-4">
              <PhoneCall className="w-6 h-6 text-destructive shrink-0" />
              <div>
                <h3 className="font-semibold">When to call emergency services</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.call}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">First Aid Guide</h1>
          <p className="text-muted-foreground mt-1">Tap a category for step-by-step instructions.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className="text-left animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Card className="hover:shadow-soft transition-all hover:-translate-y-1 h-full">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-accent grid place-items-center ${c.color}`}>
                    <c.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">{c.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Tap for guide →</div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
