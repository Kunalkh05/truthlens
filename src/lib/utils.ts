import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "N/A";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return isoString;
  }
}

export interface AssessmentStyling {
  bg: string;
  text: string;
  border: string;
  dot: string;
  badge: string;
  label: string;
}

export function getAssessmentColor(assessment: string): AssessmentStyling {
  switch (assessment) {
    case "Supported":
      return {
        bg: "bg-status-supported/10 dark:bg-status-supported/15",
        text: "text-status-supported",
        border: "border-status-supported/40",
        dot: "bg-status-supported",
        badge: "bg-status-supported/10 text-status-supported border-status-supported/35",
        label: "Corroborated by independent evidence & technical signals",
      };
    case "Mixed":
      return {
        bg: "bg-status-mixed/10 dark:bg-status-mixed/15",
        text: "text-status-mixed",
        border: "border-status-mixed/40",
        dot: "bg-status-mixed",
        badge: "bg-status-mixed/10 text-status-mixed border-status-mixed/35",
        label: "Conflicting signals or partial factual agreement",
      };
    case "Contradicted":
      return {
        bg: "bg-status-contradicted/10 dark:bg-status-contradicted/15",
        text: "text-status-contradicted",
        border: "border-status-contradicted/40",
        dot: "bg-status-contradicted",
        badge: "bg-status-contradicted/10 text-status-contradicted border-status-contradicted/35",
        label: "Inconsistent with verified records or exhibits synthetic artifacts",
      };
    case "Unverified":
      return {
        bg: "bg-status-unverified/10 dark:bg-status-unverified/15",
        text: "text-status-unverified",
        border: "border-status-unverified/40",
        dot: "bg-status-unverified",
        badge: "bg-status-unverified/10 text-status-unverified border-status-unverified/35",
        label: "Awaiting corroborating evidence or primary source confirmation",
      };
    case "Insufficient evidence":
    default:
      return {
        bg: "bg-status-insufficient/10 dark:bg-status-insufficient/15",
        text: "text-status-insufficient",
        border: "border-status-insufficient/40",
        dot: "bg-status-insufficient",
        badge: "bg-status-insufficient/10 text-status-insufficient border-status-insufficient/35",
        label: "Evidence coverage is currently too limited to establish verification",
      };
  }
}
