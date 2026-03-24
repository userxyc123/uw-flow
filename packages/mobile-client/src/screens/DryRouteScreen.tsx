import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import type { RouteOption } from "@uw-flow/shared-types";
import { getDryRoutes } from "../api";

export default function DryRouteScreen() {
  const [originLat, setOriginLat] = useState("47.6553");
  const [originLng, setOriginLng] = useState("-122.3035");
  const [destLat, setDestLat] = useState("47.6558");
  const [destLng, setDestLng] = useState("-122.3049");
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const r = await getDryRoutes(+originLat, +originLng, +destLat, +destLng);
      setRoutes(r);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>DryRoute Navigation</Text>
      <View style={s.row}>
        <TextInput style={s.input} value={originLat} onChangeText={setOriginLat} placeholder="Origin Lat" accessibilityLabel="Origin latitude" />
        <TextInput style={s.input} value={originLng} onChangeText={setOriginLng} placeholder="Origin Lng" accessibilityLabel="Origin longitude" />
      </View>
      <View style={s.row}>
        <TextInput style={s.input} value={destLat} onChangeText={setDestLat} placeholder="Dest Lat" accessibilityLabel="Destination latitude" />
        <TextInput style={s.input} value={destLng} onChangeText={setDestLng} placeholder="Dest Lng" accessibilityLabel="Destination longitude" />
      </View>
      <TouchableOpacity style={s.btn} onPress={search} disabled={loading} accessibilityRole="button" accessibilityLabel="Find dry routes">
        <Text style={s.btnText}>{loading ? "Searching..." : "Find Dry Routes"}</Text>
      </TouchableOpacity>

      <FlatList
        data={routes}
        keyExtractor={(r) => r.route_id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.cardTitle}>Coverage: {item.coverage_score}%</Text>
            <Text>Distance: {Math.round(item.total_distance_meters)}m</Text>
            <Text>Time: {item.estimated_time_minutes.toFixed(1)} min</Text>
            {item.staleness_warning && <Text style={s.stale}>⚠ Weather data may be stale</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No routes yet. Enter locations and search.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#4b2e83" },
  row: { flexDirection: "row", gap: 8, marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "#fff" },
  btn: { backgroundColor: "#4b2e83", borderRadius: 8, padding: 14, alignItems: "center", marginVertical: 12 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  stale: { color: "#e67e22", marginTop: 4, fontStyle: "italic" },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
});
