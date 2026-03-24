import type { Venue } from "@uw-flow/shared-types";

export const SUPPORTED_VENUES: Venue[] = [
  {
    venue_id: "hub-food-court",
    name: "HUB Food Court",
    location: { lat: 47.6558, lng: -122.3049 },
    category: "dining",
  },
  {
    venue_id: "starbucks-hub",
    name: "Starbucks",
    location: { lat: 47.6556, lng: -122.3051 },
    category: "dining",
  },
  {
    venue_id: "local-point",
    name: "Local Point",
    location: { lat: 47.6534, lng: -122.3121 },
    category: "dining",
  },
  {
    venue_id: "district-market",
    name: "District Market",
    location: { lat: 47.6562, lng: -122.3098 },
    category: "dining",
  },
  {
    venue_id: "uw-gym-equipment",
    name: "UW Gym Equipment Areas",
    location: { lat: 47.6527, lng: -122.3002 },
    category: "gym",
  },
  {
    venue_id: "ima",
    name: "IMA",
    location: { lat: 47.6527, lng: -122.3002 },
    category: "gym",
  },
  {
    venue_id: "uw-libraries",
    name: "UW Libraries",
    location: { lat: 47.6553, lng: -122.3035 },
    category: "library",
  },
  {
    venue_id: "advising-offices",
    name: "Advising Offices",
    location: { lat: 47.6561, lng: -122.3079 },
    category: "advising",
  },
  {
    venue_id: "hall-health",
    name: "Hall Health",
    location: { lat: 47.6566, lng: -122.3063 },
    category: "health",
  },
  {
    venue_id: "uw-bookstore",
    name: "UW Bookstore",
    location: { lat: 47.6557, lng: -122.3088 },
    category: "retail",
  },
  {
    venue_id: "link-light-rail",
    name: "Link Light Rail Station",
    location: { lat: 47.6497, lng: -122.3038 },
    category: "transit",
  },
];

export function getVenueById(id: string): Venue | undefined {
  return SUPPORTED_VENUES.find((v) => v.venue_id === id);
}
