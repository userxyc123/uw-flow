import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import type { Venue, WaitPrediction } from "@uw-flow/shared-types";
import { getVenues, getWaitTime } from "../api";

interface VenueWait {
  venue: Venue;
  current_minutes: number;
  predictions: WaitPrediction[];
  unverified: boolean;
  checkin_count: number;
}

export default function WaitTimesScreen({ onCheckin }: { onCheckin?: (venueId: string) => void }) {
  const [data, setData] = useState<VenueWait[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const venues = await getVenues();
        const waits = await Promise.all(
          venues.map(async (v) => {
            const wt = await getWaitTime(v.venue_id);
            return { venue: v, ...wt };
          })
        );
        setData(waits);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  return (
    <View style={s.container}>
      <Text style={s.title}>Live Wait Times</Text>
      {loading ? <Text>Loading...</Text> : (
        <FlatList
          data={data}
          keyExtractor={(d) => d.venue.venue_id}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.header}>
                <Text style={s.name}>{item.venue.name}</Text>
                {item.unverified && <Text style={s.stale}>unverified</Text>}
              </View>
              <Text style={s.wait}>{item.current_minutes} min wait</Text>
              <Text style={s.count}>{item.checkin_count} recent check-ins</Text>
              <View style={s.preds}>
                {item.predictions.map((p) => (
                  <View key={p.minutes_from_now} style={[s.predBadge, p.recommendation === "Go Now" ? s.goNow : p.recommendation === "Go Later" ? s.goLater : s.neutral]}>
                    <Text style={s.predText}>+{p.minutes_from_now}m: {p.predicted_wait_minutes}min</Text>
                    {p.recommendation && <Text style={s.recText}>{p.recommendation}</Text>}
                  </View>
                ))}
              </View>
              <TouchableOpacity style={s.checkinBtn} onPress={() => onCheckin?.(item.venue.venue_id)} accessibilityRole="button" accessibilityLabel={`Check in at ${item.venue.name}`}>
                <Text style={s.checkinText}>Check In</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#4b2e83" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "600" },
  stale: { color: "#e67e22", fontSize: 12, fontStyle: "italic" },
  wait: { fontSize: 20, fontWeight: "700", color: "#4b2e83", marginVertical: 4 },
  count: { color: "#888", fontSize: 12 },
  preds: { flexDirection: "row", gap: 6, marginTop: 8 },
  predBadge: { borderRadius: 6, padding: 6, flex: 1, alignItems: "center" },
  goNow: { backgroundColor: "#d4efdf" },
  goLater: { backgroundColor: "#fdebd0" },
  neutral: { backgroundColor: "#eee" },
  predText: { fontSize: 11, fontWeight: "600" },
  recText: { fontSize: 10, color: "#555" },
  checkinBtn: { backgroundColor: "#4b2e83", borderRadius: 8, padding: 10, alignItems: "center", marginTop: 10 },
  checkinText: { color: "#fff", fontWeight: "600" },
});
