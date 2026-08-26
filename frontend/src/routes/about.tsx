import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Target, Sparkles, ShieldCheck, HeartPulse, Bot, Hospital } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Emergency Healthcare Connector AI" },
      { name: "description", content: "Learn about our mission to make emergency healthcare accessible, fast, and AI-powered for everyone." },
      { property: "og:title", content: "About HealthcareAI" },
      { property: "og:description", content: "Our mission, technology, and commitment to privacy." },
    ],
  }),
  component: About,
});

const faqs = [
  { q: "Is HealthcareAI a replacement for a doctor?", a: "No. HealthcareAI provides educational guidance and helps you find care. It is not a diagnostic tool and does not replace professional medical advice." },
  { q: "How does the AI understand my symptoms?", a: "We use large medical language models fine-tuned on peer-reviewed clinical guidelines to provide safe, generalized guidance." },
  { q: "Is my medical data secure?", a: "Yes. All personal health data is encrypted at rest and in transit. We follow HIPAA-aware design principles and never sell your data." },
  { q: "Does the SOS feature actually call emergency services?", a: "In the full production version, SOS integrates with local emergency dispatch APIs where available. This prototype demonstrates the flow." },
  { q: "Can I use this offline?", a: "Core first-aid guides work offline. AI chat and hospital lookup require a data connection." },
];

function About() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <HeartPulse className="w-4 h-4" /> About Us
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold">
            Making emergency care<br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">accessible to everyone</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            HealthcareAI is a companion for the most critical moments — combining AI triage, first-aid knowledge, and instant access to nearby care.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6 space-y-3">
              <Target className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Our Mission</h2>
              <p className="text-muted-foreground">
                Every minute matters in an emergency. We built HealthcareAI to shorten the distance between "something is wrong" and "help is on the way." No app should replace a doctor — but a smart companion can help you make the right call in seconds.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <Sparkles className="w-8 h-8 text-secondary" />
              <h2 className="text-2xl font-bold">Features</h2>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                <li>Conversational AI symptom triage</li>
                <li>Interactive first-aid guides</li>
                <li>Hospital finder with ER availability</li>
                <li>Digital medical ID card</li>
                <li>One-tap SOS with location sharing</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <Bot className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">AI Technology</h2>
              <p className="text-muted-foreground">
                We use large medical language models with retrieval-augmented generation over peer-reviewed clinical protocols. Every response is generated with explicit safety guardrails and points to when you must seek professional care.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <ShieldCheck className="w-8 h-8 text-secondary" />
              <h2 className="text-2xl font-bold">Privacy & Security</h2>
              <p className="text-muted-foreground">
                Your medical profile stays encrypted end-to-end. We never sell or share your data. You control what emergency responders can see, and can wipe your profile at any time.
              </p>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <Hospital className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Card>
            <CardContent className="p-2">
              <Accordion type="single" collapsible>
                {faqs.map((f, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="px-4 text-left">{f.q}</AccordionTrigger>
                    <AccordionContent className="px-4 text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
