import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import type { HeatmapCell } from "@uw-flow/shared-types";
import { getHeatmap, getQuietSpots, getHeatmapCell } from "../api";

export default function HeatmapScreen() {
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [quietSpots, setQuietSpots] = useState<HeatmapCell[]>([]);
  const [selected, setSelected] = useState<HeatmapCell | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getHeatmap();
        setCells(snap.cells);
        const qs = await getQuietSpots();
        setQuietSpots(qs);
      } catch (e) { console.error(e); }
    })();

    // WebSocket for live updates
    const ws = new WebSocket("ws://localhost:3003/ws/heatmap");
    ws.onmessage = (ev) => {
      try {
        const snap = JSON.parse(ev.data);
        if (snap.cells) setCells(snap.cells);
      } catch {}
    };
    return () => ws.close();
  }, []);

  const tapCell = async (cellId: string) => {
    try {
      const cell = await getHeatmapCell(cellId);
      setSelected(cell);
    } catch (e) { console.error(e); }
  };

  const labelColor = (label: string) =>
    label === "Quiet" ? "#27ae60" : label === "Moderate" ? "#f39c12" : "#e74c3c";

  return (
    <View style={s.container}>
      <Text style={s.title}>Campus Flow Heatmap</Text>

      {quietSpots.length > 0 && (
        <View style={s.quietSection}>
          <Text style={s.sectionTitle}>🧘 Top Quiet Study Spots</Text>
          {quietSpots.map((qs) => (
            <View key={qs.cell_id} style={s.quietCard}>
              <Text style={s.quietName}>{qs.cell_id}</Text>
              <Text style={{ color: labelColor(qs.label) }}>{qs.label} ({qs.density_score})</Text>
            </View>
          ))}
        </View>
      )}

      {selected && (
        <View style={s.detail}>
          <Text style={s.detailTitle}>{selected.cell_id}</Text>
          <Text style={{ color: labelColor(selected.label), fontSize: 18 }}>{selected.label} — Density: {selected.density_score}</Text>
          <TouchableOpacity onPress={() => setSelected(null)}><Text style={s.close}>Close</Text></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={cells}
        keyExtractor={(c) => c.cell_id}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.cell, { borderLeftColor: labelColor(item.label) }]} onPress={() => tapCell(item.cell_id)} accessibilityRole="button" accessibilityLabel={`${item.cell_id} ${item.label}`}>
            <Text style={s.cellId}>{item.cell_id}</Text>
            <Text style={{ color: labelColor(item.label), fontWeight: "700" }}>{item.label}</Text>
            <Text style={s.score}>{item.density_score}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#4b2e83" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  quietSection: { marginBottom: 16 },
  quietCard: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: 8, padding: 10, marginBottom: 6 },
  quietName: { fontWeight: "600" },
  detail: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 12, elevation: 3 },
  detailTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  close: { color: "#4b2e83", marginTop: 8, fontWeight: "600" },
  cell: { flex: 1, backgroundColor: "#fff", borderRadius: 8, padding: 12, margin: 4, borderLeftWidth: 4, elevation: 1 },
  cellId: { fontSize: 12, color: "#888" },
  score: { fontSize: 12, color: "#555" },
});
