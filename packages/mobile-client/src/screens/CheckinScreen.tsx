import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { submitCheckin } from "../api";

const CROWD_LEVELS = ["low", "medium", "high"] as const;
const WAIT_OPTIONS = [0, 5, 10, 15, 20, 30];

/** 3-tap check-in flow: select wait → select crowd → submit */
export default function CheckinScreen({ venueId, onDone }: { venueId: string; onDone?: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [waitMin, setWaitMin] = useState(5);
  const [crowd, setCrowd] = useState<"low" | "medium" | "high">("medium");
  const [confirming, setConfirming] = useState(false);

  const doSubmit = async (confirm = false) => {
    try {
      const res = await submitCheckin(venueId, { reported_wait_minutes: waitMin, crowd_level: crowd }, confirm);
      if (res.location_confirmation_required) {
        setConfirming(true);
        return;
      }
      onDone?.();
    } catch (e) {
      console.error(e);
    }
  };

  if (confirming) {
    return (
      <View style={s.container}>
        <Text style={s.title}>Confirm your location</Text>
        <Text style={s.sub}>Are you currently at this venue?</Text>
        <TouchableOpacity style={s.btn} onPress={() => doSubmit(true)} accessibilityRole="button">
          <Text style={s.btnText}>Yes, I'm here</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 1) {
    return (
      <View style={s.container}>
        <Text style={s.title}>How long is the wait?</Text>
        <View style={s.options}>
          {WAIT_OPTIONS.map((w) => (
            <TouchableOpacity key={w} style={[s.opt, waitMin === w && s.optSel]} onPress={() => { setWaitMin(w); setStep(2); }} accessibilityRole="button" accessibilityLabel={`${w} minutes`}>
              <Text style={[s.optText, waitMin === w && s.optTextSel]}>{w} min</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (step === 2) {
    return (
      <View style={s.container}>
        <Text style={s.title}>How crowded is it?</Text>
        <View style={s.options}>
          {CROWD_LEVELS.map((c) => (
            <TouchableOpacity key={c} style={[s.opt, crowd === c && s.optSel]} onPress={() => { setCrowd(c); setStep(3); doSubmit(); }} accessibilityRole="button" accessibilityLabel={`Crowd level ${c}`}>
              <Text style={[s.optText, crowd === c && s.optTextSel]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Submitting...</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16, color: "#4b2e83", textAlign: "center" },
  sub: { fontSize: 16, textAlign: "center", marginBottom: 16, color: "#555" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  opt: { backgroundColor: "#fff", borderRadius: 10, padding: 16, minWidth: 80, alignItems: "center", elevation: 2 },
  optSel: { backgroundColor: "#4b2e83" },
  optText: { fontSize: 16, fontWeight: "600" },
  optTextSel: { color: "#fff" },
  btn: { backgroundColor: "#4b2e83", borderRadius: 8, padding: 14, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
