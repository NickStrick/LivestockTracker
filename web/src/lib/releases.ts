/** Release notes shown in "What's new". Newest first. Keep this file free of React so it ports to React Native. */
export type ReleaseItemType = "new" | "improved" | "fixed";

export interface Release {
  version: string;
  date: string;
  title: string;
  summary: string;
  items: { type: ReleaseItemType; text: string }[];
}

export const RELEASES: Release[] = [
  {
    version: "0.6.0",
    date: "2026-09-20",
    title: "Printable animal records",
    summary: "Print or save a complete health and compliance record for any animal, ready to hand to a buyer or attach to an email.",
    items: [
      { type: "new", text: "Print records button on every animal page: vaccinations, health notes, breeding, weights, movements and documents on one clean sheet." },
      { type: "improved", text: "Choose the sheet's language (English or Spanish) and which sections to include." },
    ],
  },
  {
    version: "0.5.0",
    date: "2026-09-19",
    title: "Spanish and English",
    summary: "Use Estancia in English or Spanish, and switch any time from the top bar.",
    items: [
      { type: "new", text: "Every screen is available in Spanish (Mexico), with an EN | ES switch in the top bar." },
      { type: "improved", text: "Dates, numbers and relative times follow the language you choose." },
      { type: "improved", text: "The first time you visit, the language follows your browser." },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-09-19",
    title: "Compliance and drill-downs",
    summary: "Track every load that leaves or arrives, and click through from the dashboard to the animals behind the numbers.",
    items: [
      { type: "new", text: "Compliance: record animal movements and upload CVIs, brand inspections, test results and registry papers." },
      { type: "new", text: "Movements without a valid CVI, and documents that are expiring or expired, now raise alerts." },
      { type: "new", text: "Dashboard cards open detail pages for overdue vaccinations and boundary breaches." },
      { type: "new", text: "Announcement banner for critical alerts and product news." },
      { type: "new", text: "What's new button with release notes." },
      { type: "improved", text: "A proper home page with an overview of what Estancia does." },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-09-19",
    title: "Notifications and ranch setup",
    summary: "Stay on top of what needs attention, and onboard ranches without leaving the app.",
    items: [
      { type: "new", text: "Notification bell with unread counts, plus a full Alerts page." },
      { type: "new", text: "Onboard a ranch by drawing its perimeter on the map." },
      { type: "new", text: "Add zones, and lift or reactivate them from the ranch page." },
      { type: "improved", text: "Animals list loads 20 at a time with a Show more button." },
      { type: "fixed", text: "Theme icon no longer flashes the wrong state on load." },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-09-19",
    title: "Dashboard and herd records",
    summary: "The first look at the whole herd.",
    items: [
      { type: "new", text: "Dashboard with herd weight, composition, alerts and recent activity." },
      { type: "new", text: "Animal pages with health, breeding, lineage, identifiers and an audit trail." },
      { type: "new", text: "Ranch maps with zones and live animal positions." },
      { type: "new", text: "Light and dark themes." },
    ],
  },
];

export const LATEST_RELEASE = RELEASES[0];
