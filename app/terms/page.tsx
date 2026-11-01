import type { Metadata } from "next";
import LegalDocPage from "../components/LegalDocPage";
import { termsOfService } from "../legal-content";

export const metadata: Metadata = {
  title: "Terms of Service — Repflow",
  description: "The terms for using Repflow (draft pending legal review).",
};

export default function TermsPage() {
  return <LegalDocPage doc={termsOfService} />;
}
