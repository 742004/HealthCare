import { Link } from "@tanstack/react-router";
import { HeartPulse, Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center">
              <HeartPulse className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold">HealthcareAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-powered emergency guidance connecting you to lifesaving care, anywhere, anytime.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/ai-assistant" className="hover:text-primary">AI Assistant</Link></li>
            <li><Link to="/hospitals" className="hover:text-primary">Nearby Hospitals</Link></li>
            <li><Link to="/first-aid" className="hover:text-primary">First Aid Guide</Link></li>
            <li><Link to="/sos" className="hover:text-primary">SOS</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link className="hover:text-primary" to="/privacy">Privacy Policy</Link></li>
            <li><Link className="hover:text-primary" to="/terms">Terms of Service</Link></li>
            <li><Link className="hover:text-primary" to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Follow</h4>
          <div className="flex gap-3 text-muted-foreground">
            <a href="#" aria-label="Facebook" className="hover:text-primary"><Facebook className="w-5 h-5" /></a>
            <a href="#" aria-label="Twitter" className="hover:text-primary"><Twitter className="w-5 h-5" /></a>
            <a href="#" aria-label="Instagram" className="hover:text-primary"><Instagram className="w-5 h-5" /></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-primary"><Linkedin className="w-5 h-5" /></a>
            <a href="#" aria-label="GitHub" className="hover:text-primary"><Github className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Emergency Healthcare Connector AI. For educational purposes — always call your local emergency number in real emergencies.
      </div>
    </footer>
  );
}
