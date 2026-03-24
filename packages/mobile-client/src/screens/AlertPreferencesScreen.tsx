import React, { useEffect, useState } from "react";
import { View, Text, Switch, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import type { UserAlertPreferences } from "@uw-flow/shared-types";
import { getAlertPreferences, saveAlertPreferences } from "../api";

const USER_ID = "demo-user"; // MVP: hardcoded user

export default function AlertPreferencesScreen() {
  const [prefs, setPrefs] = useState<UserAlertPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await getAlertPreferences(USER_ID);
        setPrefs(p);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    try { await saveAlertPreferences(prefs); } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (!prefs) return <View style={s.container}><Text>Loading...</Text></View>;

  const toggle = (key: keyof UserAlertPreferences) => (val: boolean) =>
    setPrefs({ ...prefs, [key]: val });

  return (
    <View style={s.container}>
      <Text style={s.title}>Alert Preferences</Text>

      <View style={s.row}>
        <Text style={s.label}>Wait time alerts</Text>
        <Switch value={prefs.wait_time_alerts_enabled} onValueChange={toggle("wait_time_alerts_enabled")} accessibilityLabel="Toggle wait time alerts" />
      </View>

      {prefs.wait_time_alerts_enabled && (
        <View style={s.thresholdRow}>
          <Text>Notify when wait drops below</Text>
          <TextInput
            style={s.thresholdInput}
            value={String(prefs.wait_time_threshold_minutes)}
            onChangeText={(v) => setPrefs({ ...prefs, wait_time_threshold_minutes: parseInt(v) || 0 })}
            keyboardType="numeric"
            accessibilityLabel="Wait time threshold in minutes"
          />
          <Text>min</Text>
        </View>
      )}

      <View style={s.row}>
        <Text style={s.label}>Rain alerts</Text>
        <Switch value={prefs.rain_alerts_enabled} onValueChange={toggle("rain_alerts_enabled")} accessibilityLabel="Toggle rain alerts" />
      </View>

      <View style={s.row}>
        <Text style={s.label}>Quiet spot alerts</Text>
        <Switch value={prefs.quiet_spot_alerts_enabled} onValueChange={toggle("quiet_spot_alerts_enabled")} accessibilityLabel="Toggle quiet spot alerts" />
      </View>

      <Text style={s.sectionTitle}>Favorite Study Spots</Text>
      <Text style={s.spotsText}>{prefs.favorite_study_spots.length > 0 ? prefs.favorite_study_spots.join(", ") : "None selected"}</Text>

      <TouchableOpacity style={s.btn} onPress={save} disabled={saving} accessibilityRole="button">
        <Text style={s.btnText}>{saving ? "Saving..." : "Save Preferences"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16, color: "#4b2e83" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  label: { fontSize: 16 },
  thresholdRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingLeft: 16 },
  thresholdInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 6, width: 50, textAlign: "center", backgroundColor: "#fff" },
  spotsText: { color: "#888", marginBottom: 8 },
  btn: { backgroundColor: "#4b2e83", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 20 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
