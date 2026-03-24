import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import type { SmartRoute } from "@uw-flow/shared-types";

interface Props {
  routes?: SmartRoute[];
}

export default function SmartRouteScreen({ routes = [] }: Props) {
  return (
    <View style={s.container}>
      <Text style={s.title}>Smart Route Planner</Text>
      <FlatList
        data={routes}
        keyExtractor={(r) => r.route_id}
        renderItem={({ item }) => (
          <View style={[s.card, item.fastest && s.fastest]}>
            {item.fastest && <Text style={s.badge}>⚡ Fastest</Text>}
            {item.late_warning && <Text style={s.lateBanner}>⚠ You may be late</Text>}
            <Text style={s.cardTitle}>Coverage: {item.coverage_score}%</Text>
            <Text>Time: {item.estimated_time_minutes.toFixed(1)} min</Text>
            <Text>Crowd: {item.crowd_score < 35 ? "Low" : item.crowd_score < 70 ? "Moderate" : "High"}</Text>
            {item.indoor_shortcuts.length > 0 && (
              <View style={s.shortcuts}>
                <Text style={s.shortcutLabel}>Indoor shortcuts:</Text>
                {item.indoor_shortcuts.map((sc, i) => (
                  <Text key={i}>  • {sc.building_name} (saves {sc.time_saved_minutes} min)</Text>
                ))}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No smart routes available.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#4b2e83" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2 },
  fastest: { borderLeftWidth: 4, borderLeftColor: "#27ae60" },
  badge: { color: "#27ae60", fontWeight: "700", marginBottom: 4 },
  lateBanner: { backgroundColor: "#fdcb6e", padding: 6, borderRadius: 4, marginBottom: 6, fontWeight: "600" },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  shortcuts: { marginTop: 6 },
  shortcutLabel: { fontWeight: "600", marginBottom: 2 },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
});
