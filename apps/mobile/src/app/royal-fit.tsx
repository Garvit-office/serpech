import { useCameraPermissions } from "expo-camera";
import { haptic } from "@/lib/haptics";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import {
  BUILDS,
  DEFAULT_PREFERENCES,
  FIT_STYLES,
  LENGTH_PREFS,
  MEASUREMENT_FIELDS,
  estimateFromBody,
  round1,
  validateMeasurements,
  type Build,
  type FitMethod,
  type FitPreferences,
  type FitProfile,
  type Measurements,
} from "@sarpech/core/fit";
import { CameraIcon, RulerIcon } from "@/components/Icons";
import { Body, TopBar } from "@/components/layout";
import { Btn, Chip, Field, Notice, T, Tap } from "@/components/ui";
import { API_ORIGIN, API_URL } from "@/lib/config";
import { parseMessage, sameOrigin } from "@/lib/webview";
import { C, F } from "@/lib/theme";
import { usePersonal } from "@/state/personal";

type Step = "saved" | "method" | "basics" | "camera" | "review" | "prefs" | "done";

/**
 * Royal Fit wizard: measure with the camera (the website's MediaPipe engine
 * running inside the app — the video never leaves the phone), with a tape, or
 * by a quick estimate; then choose how the piece should fit.
 */
export default function RoyalFit() {
  const { fit, saveFit, clearFit } = usePersonal();
  const [step, setStep] = useState<Step>(fit ? "saved" : "method");
  const [method, setMethod] = useState<FitMethod>("camera");
  const [height, setHeight] = useState(fit ? String(fit.heightCm) : "");
  const [weight, setWeight] = useState(fit?.weightKg ? String(fit.weightKg) : "");
  const [build, setBuild] = useState<Build>(fit?.build ?? "average");
  const [m, setM] = useState<Partial<Record<keyof Measurements, string>>>(() =>
    fit ? Object.fromEntries(Object.entries(fit.measurements).map(([k, v]) => [k, String(v)])) : {},
  );
  const [review, setReview] = useState<(keyof Measurements)[]>([]);
  const [prefs, setPrefs] = useState<FitPreferences>(fit?.preferences ?? DEFAULT_PREFERENCES);
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const heightCm = Number(height);
  const weightKg = Number(weight) || null;
  const basicsOk = heightCm >= 120 && heightCm <= 230 && (method !== "quick" || (weightKg !== null && weightKg >= 35 && weightKg <= 250));

  const fromBasics = async () => {
    if (!basicsOk) return setError(method === "quick" ? "Enter your height (120–230 cm) and weight (35–250 kg)." : "Enter your height (120–230 cm).");
    setError(null);
    if (method === "quick") {
      const est = estimateFromBody(heightCm, weightKg!, build);
      setM(Object.fromEntries(Object.entries(est).map(([k, v]) => [k, String(round1(v))])));
      setReview([]);
      return setStep("review");
    }
    if (method === "manual") return setStep("review");
    const p = permission?.granted ? permission : await requestPermission();
    if (!p.granted) return setError("Camera access is off. Allow it in Settings, or measure with a tape instead.");
    setStep("camera");
  };

  const onCamera = (e: WebViewMessageEvent) => {
    if (!sameOrigin(e.nativeEvent.url, API_ORIGIN)) return; // only our Fit Check page may report a reading
    const msg = parseMessage<{ type: string; reading?: { measurements: Measurements; review: (keyof Measurements)[] } }>(e.nativeEvent.data);
    if (!msg) return;
    if (msg.type === "fitcheck:done" && msg.reading) {
      haptic.success();
      setM(Object.fromEntries(Object.entries(msg.reading.measurements).map(([k, v]) => [k, String(round1(v))])));
      setReview(msg.reading.review);
      setStep("review");
    } else if (msg.type === "fitcheck:manual") {
      setMethod("manual");
      setStep("review");
    }
  };

  const measurements = Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f.key, Number(m[f.key])])) as unknown as Measurements;
  const check = validateMeasurements(measurements);

  const finish = () => {
    const profile: FitProfile = { version: 1, method, updatedAt: new Date().toISOString(), heightCm, weightKg, build, measurements, preferences: prefs };
    saveFit(profile);
    haptic.success();
    setStep("done");
  };

  if (step === "camera") {
    const uri = `${API_URL}/fit-embed?height=${heightCm}${weightKg ? `&weight=${weightKg}` : ""}&build=${build}`;
    return (
      <View style={{ flex: 1, backgroundColor: C.green }}>
        <TopBar back title="Fit Check" />
        <WebView
          source={{ uri }}
          onMessage={onCamera}
          javaScriptEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
          originWhitelist={[API_ORIGIN]}
          onShouldStartLoadWithRequest={(r) => r.isTopFrame === false || sameOrigin(r.url, API_ORIGIN) || r.url === "about:blank"}
          style={{ flex: 1, backgroundColor: C.white }}
          onError={() => setError("Couldn't open the Fit Check. Check your connection.")}
        />
        <Tap onPress={() => (setMethod("manual"), setStep("review"))} style={{ padding: 14, backgroundColor: C.green, alignItems: "center" }} accessibilityRole="button">
          <T v="label" style={{ color: C.goldLight }}>
            Enter measurements instead
          </T>
        </Tap>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.white }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <TopBar close title="Royal Fit" />
      <Body contentStyle={{ padding: 18 }}>
        <Animated.View key={step} entering={FadeInRight.duration(280)}>
          {error && <Notice tone="error">{error}</Notice>}

          {step === "saved" && fit && (
            <>
              <T v="eyebrow">Your Royal Fit</T>
              <T v="display" style={{ fontSize: 22, marginTop: 6 }}>
                {FIT_STYLES.find((f) => f.value === fit.preferences.fit)?.label} fit
              </T>
              <T v="small" style={{ marginTop: 4 }}>
                Saved {new Date(fit.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long" })} · {fit.method === "camera" ? "camera Fit Check" : fit.method === "quick" ? "quick estimate" : "entered by you"}
              </T>
              <View style={s.grid}>
                {MEASUREMENT_FIELDS.map((f) => (
                  <View key={f.key} style={s.cell}>
                    <T v="small">{f.label}</T>
                    <T v="price">{fit.measurements[f.key]} cm</T>
                  </View>
                ))}
              </View>
              <Btn onPress={() => setStep("method")} style={{ marginTop: 18 }}>
                Measure again
              </Btn>
              <Btn kind="outline" onPress={() => setStep("prefs")} style={{ marginTop: 10 }}>
                Change fit preferences
              </Btn>
              <Btn kind="ghost" onPress={() => (clearFit(), setStep("method"))} style={{ marginTop: 6 }}>
                Delete my Royal Fit
              </Btn>
            </>
          )}

          {step === "method" && (
            <>
              <T v="display" style={{ fontSize: 22 }}>
                Find your Royal Fit
              </T>
              <T v="small" style={{ marginTop: 6, marginBottom: 18 }}>
                Measure once — every piece then shows your size, and made-to-measure orders are cut to you.
              </T>
              <Option icon={<CameraIcon color={C.goldDark} size={26} />} title="Camera Fit Check" sub="About 20 seconds. Stand back, arms out. The video never leaves your phone." on={method === "camera"} onPress={() => setMethod("camera")} />
              <Option icon={<RulerIcon color={C.goldDark} size={26} />} title="Enter with a tape" sub="Chest, waist, hip, shoulder, sleeve, inseam and neck." on={method === "manual"} onPress={() => setMethod("manual")} />
              <Option icon={<T style={{ fontFamily: F.display, color: C.goldDark, fontSize: 18 }}>≈</T>} title="Quick estimate" sub="From height, weight and build — good for standard sizes." on={method === "quick"} onPress={() => setMethod("quick")} />
              <Btn onPress={() => setStep("basics")} style={{ marginTop: 16 }}>
                Continue
              </Btn>
            </>
          )}

          {step === "basics" && (
            <>
              <T v="title">About you</T>
              <View style={{ height: 14 }} />
              <Field label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" hint="Sets the scale for the camera reading." />
              <Field label={method === "quick" ? "Weight (kg)" : "Weight (kg, optional)"} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
              <T v="label" style={{ marginBottom: 8 }}>
                Build
              </T>
              <View style={s.wrap}>
                {BUILDS.map((b) => (
                  <Chip key={b.value} on={build === b.value} onPress={() => setBuild(b.value)}>
                    {b.label}
                  </Chip>
                ))}
              </View>
              <Btn onPress={fromBasics} style={{ marginTop: 22 }}>
                {method === "camera" ? "Start the Fit Check" : "Continue"}
              </Btn>
              <Btn kind="ghost" onPress={() => setStep("method")} style={{ marginTop: 6 }}>
                Back
              </Btn>
            </>
          )}

          {step === "review" && (
            <>
              <T v="title">Your measurements (cm)</T>
              <T v="small" style={{ marginTop: 4, marginBottom: 14 }}>
                {method === "camera" ? "Read by the camera — check each value, especially any marked." : method === "quick" ? "Estimated from your height and weight — adjust any you know." : "Body measurements, taken over a light shirt."}
              </T>
              {MEASUREMENT_FIELDS.map((f) => (
                <View key={f.key} style={s.mRow}>
                  <View style={{ flex: 1 }}>
                    <T v="label" style={{ fontSize: 10 }}>
                      {f.label}
                      {review.includes(f.key) ? "  · please check" : ""}
                    </T>
                    <T v="small" numberOfLines={2}>
                      {f.how}
                    </T>
                  </View>
                  <TextInput
                    value={m[f.key] ?? ""}
                    onChangeText={(v) => setM((x) => ({ ...x, [f.key]: v }))}
                    keyboardType="decimal-pad"
                    accessibilityLabel={`${f.label} in centimetres`}
                    style={[s.mInput, (check.invalid.includes(f.key) && m[f.key]) || review.includes(f.key) ? { borderColor: C.ruby } : null]}
                  />
                </View>
              ))}
              <Btn onPress={() => (check.ok ? setStep("prefs") : setError("Some measurements are missing or look out of range."))} style={{ marginTop: 18 }}>
                Continue
              </Btn>
            </>
          )}

          {step === "prefs" && (
            <>
              <T v="title">How should it fit?</T>
              <View style={{ gap: 8, marginTop: 14 }}>
                {FIT_STYLES.map((f) => (
                  <Option key={f.value} title={`${f.label} · ${f.short}`} sub={f.description} on={prefs.fit === f.value} onPress={() => setPrefs((p) => ({ ...p, fit: f.value }))} />
                ))}
              </View>
              <T v="label" style={{ marginTop: 16, marginBottom: 8 }}>
                Length
              </T>
              <View style={s.wrap}>
                {LENGTH_PREFS.map((l) => (
                  <Chip key={l.value} on={prefs.length === l.value} onPress={() => setPrefs((p) => ({ ...p, length: l.value }))}>
                    {l.label}
                  </Chip>
                ))}
              </View>
              <T v="label" style={{ marginTop: 16, marginBottom: 8 }}>
                Sleeves
              </T>
              <View style={s.wrap}>
                {LENGTH_PREFS.map((l) => (
                  <Chip key={l.value} on={prefs.sleeve === l.value} onPress={() => setPrefs((p) => ({ ...p, sleeve: l.value }))}>
                    {l.label}
                  </Chip>
                ))}
              </View>
              <View style={{ height: 16 }} />
              <Field label="Notes for the tailor (optional)" value={prefs.notes} onChangeText={(notes) => setPrefs((p) => ({ ...p, notes: notes.slice(0, 300) }))} multiline />
              <Btn onPress={finish} disabled={!check.ok || !heightCm}>
                Save my Royal Fit
              </Btn>
            </>
          )}

          {step === "done" && (
            <View style={{ alignItems: "center", paddingVertical: 30 }}>
              <RulerIcon color={C.goldDark} size={40} />
              <T v="display" style={{ fontSize: 22, marginTop: 14 }}>
                Royal Fit saved
              </T>
              <T v="small" style={{ textAlign: "center", marginTop: 6 }}>
                Every piece now shows your recommended size, and made-to-measure orders use these measurements.
              </T>
              <Btn onPress={() => router.back()} style={{ alignSelf: "stretch", marginTop: 22 }}>
                Done
              </Btn>
            </View>
          )}
        </Animated.View>
      </Body>
    </KeyboardAvoidingView>
  );
}

function Option({ icon, title, sub, on, onPress }: { icon?: React.ReactNode; title: string; sub: string; on: boolean; onPress: () => void }) {
  return (
    <Tap onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: on }} style={[s.opt, on && s.optOn]}>
      {icon}
      <View style={{ flex: 1 }}>
        <T v="label">{title}</T>
        <T v="small">{sub}</T>
      </View>
    </Tap>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 16, borderTopWidth: 1, borderTopColor: C.mist },
  cell: { width: "50%", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.mist },
  opt: { flexDirection: "row", gap: 14, alignItems: "center", borderWidth: 1, borderColor: C.mist, padding: 14, marginBottom: 8 },
  optOn: { borderColor: C.green, borderWidth: 1.5, backgroundColor: C.pearl },
  mRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.mist },
  mInput: { width: 84, minHeight: 46, borderWidth: 1, borderColor: "#B9B4A6", textAlign: "center", fontFamily: F.serif, fontSize: 18, color: C.green },
});
