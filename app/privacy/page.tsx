import Link from "next/link";
import { Mountain } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-t-bg text-white">
      <nav className="border-b border-white/[0.04] py-4 px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center">
            <Mountain className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-black text-white">Himalaya</span>
        </Link>
      </nav>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose prose-invert prose-sm">
        <h1 className="text-2xl font-black">Privacy Policy</h1>
        <p className="text-white/40">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        <h2>What We Collect</h2>
        <p>We collect the information you provide when signing up (name, email) and usage data to improve your experience.</p>
        <h2>How We Use It</h2>
        <p>To provide our service, communicate with you, and improve the platform. We never sell your personal data.</p>
        <h2>Third Parties</h2>
        <p>We use Clerk (authentication), Stripe (payments), Supabase (database), and AI providers (content generation). Each has their own privacy policy.</p>
        <h2>Your Rights</h2>
        <p>You can export all your data, request deletion, or unsubscribe from marketing at any time. Email us at support@himalaya.app.</p>
        <h2>Contact</h2>
        <p>Questions? Email support@himalaya.app</p>
      </div>
    </div>
  );
}
