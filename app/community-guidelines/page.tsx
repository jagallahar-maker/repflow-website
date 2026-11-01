import type { Metadata } from "next";
import LegalDocPage from "../components/LegalDocPage";
import { communityGuidelines } from "../legal-content";

export const metadata: Metadata = {
  title: "Community Guidelines — Repflow",
  description:
    "What is and isn't allowed on Repflow, and how reporting and blocking work (draft pending legal review).",
};

export default function CommunityGuidelinesPage() {
  return <LegalDocPage doc={communityGuidelines} />;
}
