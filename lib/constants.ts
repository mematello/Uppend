export const SOURCE_OPTIONS = [
  { label: "LinkedIn", value: "LinkedIn", keywords: ["linkedin"] },
  { label: "Indeed", value: "Indeed", keywords: ["indeed"] },
  { label: "JobStreet", value: "JobStreet", keywords: ["jobstreet"] },
  { label: "Facebook", value: "Facebook", keywords: ["facebook", "fb group", "fb page"] },
  { label: "Company Website", value: "Company Website", keywords: ["company website", "company site", "careers page", "career page", "company portal"] },
  { label: "Referral", value: "Referral", keywords: ["referral", "referred", "friend", "colleague", "connection"] },
  { label: "Other", value: "Other", keywords: [] },
];

export function matchSourceOption(rawSource: string | null): { option: string; freeText: string } {
  if (!rawSource) return { option: "", freeText: "" };
  const lower = rawSource.toLowerCase();
  
  // We only want to match options that have keywords
  const match = SOURCE_OPTIONS.find(o => o.keywords.length > 0 && o.keywords.some(k => lower.includes(k)));
  if (match) return { option: match.value, freeText: "" };
  
  return { option: "Other", freeText: rawSource };
}

export function matchSourceFromUrl(url: string): string | null {
  if (!url || !url.trim()) return null;
  const lower = url.toLowerCase();
  const domainMatch = SOURCE_OPTIONS.find(o =>
    (o.value === "LinkedIn" || o.value === "Indeed" ||
     o.value === "JobStreet" || o.value === "Facebook") &&
    o.keywords.some(k => lower.includes(k))
  );
  if (domainMatch) return domainMatch.value;
  return "Company Website";
}
