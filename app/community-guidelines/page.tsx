import type { Metadata } from "next";
import LegalDocPage from "../components/LegalDocPage";
import { communityGuidelines } from "../legal-content";

export const metadata: Metadata = {
  title: "Community Guidelines — Repflow",
  description:
    "What is and isn't allowed on Repflow, and how reporting and blocking work.",
};

export default function CommunityGuidelinesPage() {
  return <LegalDocPage doc={communityGuidelines} />;
}
