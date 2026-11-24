import { router } from "expo-router";
import { haptic } from "@/lib/haptics";
import { useMemo, useState, type ReactNode } from "react";
import { Alert, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeInDown, LinearTransition } from "react-native-reanimated";
import {
  BUTTONS,
  COLLAR_LABEL,
  DESIGN_DAYS,
  DESIGN_LOOKS,
  DESIGN_PRODUCT_ID,
  EMBROIDERY,
  FABRIC_COLORS,
  GARMENTS,
  LENGTH_LABEL,
  PATTERNS,
  SLEEVE_LABEL,
  ZONES,
  changeGarment,
  defaultDesign,
  designKey,
  designPrice,
  designSlug,
  designSummary,
  fabricLabel,
  garmentDef,
  type DesignSpec,
  type Fabric,
  type PatternAngle,
  type Zone,
} from "@sarpech/core/designer";
import { MTM_SIZE, toSnapshot } from "@sarpech/core/fit";
import { formatINR } from "@sarpech/core/format";
import { DesignArt, FabricSwatch } from "@/components/DesignArt";
import { TopBar } from "@/components/layout";
import { Stepper } from "@/components/Stepper";
import { Btn, Chip, Notice, T, Tap } from "@/components/ui";
import { C, F } from "@/lib/theme";
import { useCart } from "@/state/cart";
import { usePersonal } from "@/state/personal";

type Tab = "fabric" | "style" | "order";
const same = (a: Fabric, b: Fabric) => fabricLabel(a) === fabricLabel(b);
const SCALES = [0.6, 0.8, 1, 1.2, 1.4, 1.6];

/** Design Studio — design a shirt, polo, kurta or sherwani and have it made to order. */
export default function Studio() {
  const cart = useCart();
  const { fit, designs, saveDesign, removeDesign } = usePersonal();
  const { width } = useWindowDimensions();
  const [spec, setSpec] = useState<DesignSpec>(() => DESIGN_LOOKS[0].spec);
  const [zone, setZone] = useState<Zone>("body");
  const [tab, setTab] = useState<Tab>("fabric");
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const g = garmentDef(spec.garment);
  const price = useMemo(() => designPrice(spec), [spec]);
  const current = spec.fabrics[zone];
  const zones = ZONES.filter((z) => z.key !== "collar" || spec.options.collar !== "round");
  const linked = zone !== "body" && same(current, spec.fabrics.body);
  const artW = Math.min(width * 0.62, 260);

  const update = (next: DesignSpec) => {
    setSpec(next);
    setMsg(null);
  };
  const setFabric = (patch: Partial<Fabric>) => {
    haptic.select();
    const nextFabric = { ...current, ...patch };
    const fabrics = { ...spec.fabrics, [zone]: nextFabric };
    if (zone === "body") for (const z of ZONES) if (z.key !== "body" && same(spec.fabrics[z.key], spec.fabrics.body)) fabrics[z.key] = { ...nextFabric };
    update({ ...spec, fabrics });
  };
  const setOption = <K extends keyof DesignSpec["options"]>(k: K, v: DesignSpec["options"][K]) => {
    haptic.select();
    update({ ...spec, options: { ...spec.options, [k]: v } });
  };
  const load = (s: DesignSpec, id: string | null = null) => {
    update(s);
    setSavedId(id);
    setSize(null);
    setZone("body");
  };

  const addToBag = () => {
    if (!size) {
      setTab("order");
      setMsg({ tone: "error", text: "Choose a size (or your Royal Fit) to add this design to your bag." });
      haptic.warning();
      return;
    }
    if (size === MTM_SIZE && !fit) return router.push("/royal-fit");
    cart.add({ productId: DESIGN_PRODUCT_ID, slug: designSlug(spec.garment), size, color: designKey(spec), qty, design: spec, ...(size === MTM_SIZE && fit ? { fit: toSnapshot(fit) } : {}) });
    haptic.success();
    setMsg({ tone: "success", text: `${spec.name || `Custom ${g.label}`} is in your bag.` });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <TopBar title="Design Studio" />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {/* Preview */}
        <View style={s.preview}>
          <View style={s.previewFrame} pointerEvents="none" />
          <Animated.View key={spec.garment} entering={FadeIn.duration(350)}>
            <DesignArt spec={spec} width={artW} height={artW * (380 / 300)} />
          </Animated.View>
          <View style={s.priceRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <T v="label">{spec.name || `Custom ${g.label}`}</T>
              <T v="small" numberOfLines={2}>
                {designSummary(spec)}
              </T>
            </View>
            <T v="price" style={{ fontSize: 19 }} accessibilityLabel={`Price ${formatINR(price.total)}`}>
              {formatINR(price.total)}
            </T>
          </View>
        </View>

        {/* Garment */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 16 }}>
          {GARMENTS.map((x) => (
            <Chip
              key={x.kind}
              on={spec.garment === x.kind}
              onPress={() => {
                load({ ...changeGarment(spec, x.kind), name: spec.name }, savedId);
                if (zone === "collar") setZone("body");
              }}
            >
              {`${x.label} · ${formatINR(x.basePrice)}+`}
            </Chip>
          ))}
        </ScrollView>

        {/* Looks */}
        <T v="eyebrow" style={{ paddingHorizontal: 16, marginTop: 18 }}>
          Start from a look
        </T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
          {DESIGN_LOOKS.map((l) => (
            <Tap key={l.title} onPress={() => load(l.spec)} accessibilityRole="button" accessibilityLabel={`${l.title}: ${l.note}`} style={s.look}>
              <DesignArt spec={l.spec} width={70} height={89} />
              <T v="label" style={{ fontSize: 8.5, marginTop: 4, textAlign: "center" }} numberOfLines={1}>
                {l.title}
              </T>
            </Tap>
          ))}
        </ScrollView>

        {/* Tabs */}
        <View style={s.tabs} accessibilityRole="tablist">
          {(
            [
              ["fabric", "1 · Fabric"],
              ["style", "2 · Style"],
              ["order", "3 · Order"],
            ] as const
          ).map(([k, label]) => (
            <Tap key={k} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} style={[s.tab, tab === k && s.tabOn]}>
              <T v="label" style={[{ fontSize: 10 }, tab !== k && { color: C.inkSoft }]}>
                {label}
              </T>
            </Tap>
          ))}
        </View>

        <Animated.View key={tab} entering={FadeInDown.duration(260)} layout={LinearTransition} style={{ paddingHorizontal: 16, paddingTop: 18 }}>
          {tab === "fabric" && (
            <>
              <Group label="Part of the garment">
                <View style={s.wrap}>
                  {zones.map((z) => (
                    <Chip key={z.key} on={zone === z.key} onPress={() => setZone(z.key)}>
                      {z.label}
                    </Chip>
                  ))}
                </View>
                {zone !== "body" && (
                  <Tap
                    onPress={() => update({ ...spec, fabrics: { ...spec.fabrics, [zone]: linked ? { ...current, color: current.color === "#F7F4EC" ? "#17191A" : "#F7F4EC", pattern: "solid" } : { ...spec.fabrics.body } } })}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: linked }}
                    style={s.check}
                  >
                    <View style={[s.box, linked && { backgroundColor: C.green }]} />
                    <T>Same fabric as the body{linked ? "" : " (contrast)"}</T>
                  </Tap>
                )}
              </Group>
              <Group label={`Colour · ${FABRIC_COLORS.find((c) => c.hex === current.color)?.name ?? current.color}`}>
                <Swatches value={current.color} onPick={(hex) => setFabric({ color: hex })} />
              </Group>
              <Group label={`Pattern · ${PATTERNS.find((p) => p.key === current.pattern)?.note ?? ""}`}>
                <View style={s.wrap}>
                  {PATTERNS.map((p) => {
                    const on = p.key === current.pattern;
                    return (
                      <Tap key={p.key} onPress={() => setFabric({ pattern: p.key })} accessibilityRole="button" accessibilityLabel={p.label} accessibilityState={{ selected: on }} style={[s.pattern, on && s.patternOn]}>
                        <FabricSwatch fabric={{ ...current, pattern: p.key }} size={54} />
                        <T style={{ fontSize: 13.5, marginTop: 2 }}>{p.label}</T>
                      </Tap>
                    );
                  })}
                </View>
              </Group>
              {current.pattern !== "solid" && (
                <>
                  <Group label={`Pattern colour · ${FABRIC_COLORS.find((c) => c.hex === current.accent)?.name ?? current.accent}`}>
                    <Swatches value={current.accent} onPick={(hex) => setFabric({ accent: hex })} />
                  </Group>
                  <Group label={`Pattern size · ${current.scale.toFixed(1)}×`}>
                    <View style={s.wrap}>
                      {SCALES.map((sc) => (
                        <Chip key={sc} on={current.scale === sc} onPress={() => setFabric({ scale: sc })}>
                          {sc === 0.6 ? "Fine" : sc === 1.6 ? "Bold" : `${sc}×`}
                        </Chip>
                      ))}
                    </View>
                  </Group>
                  <Group label="Direction">
                    <View style={s.wrap}>
                      {([0, 45, 90, 135] as PatternAngle[]).map((a) => (
                        <Chip key={a} on={current.angle === a} onPress={() => setFabric({ angle: a })}>
                          {`${a}°`}
                        </Chip>
                      ))}
                    </View>
                  </Group>
                </>
              )}
            </>
          )}

          {tab === "style" && (
            <>
              {g.sleeves.length > 1 && (
                <Group label="Sleeves">
                  <View style={s.wrap}>
                    {g.sleeves.map((x) => (
                      <Chip key={x} on={spec.options.sleeve === x} onPress={() => setOption("sleeve", x)}>
                        {SLEEVE_LABEL[x]}
                      </Chip>
                    ))}
                  </View>
                </Group>
              )}
              {g.collars.length > 1 && (
                <Group label="Collar">
                  <View style={s.wrap}>
                    {g.collars.map((x) => (
                      <Chip key={x} on={spec.options.collar === x} onPress={() => setOption("collar", x)}>
                        {COLLAR_LABEL[x]}
                      </Chip>
                    ))}
                  </View>
                </Group>
              )}
              {g.lengths.length > 1 && (
                <Group label="Length">
                  <View style={s.wrap}>
                    {g.lengths.map((x) => (
                      <Chip key={x} on={spec.options.length === x} onPress={() => setOption("length", x)}>
                        {LENGTH_LABEL[x]}
                      </Chip>
                    ))}
                  </View>
                </Group>
              )}
              <Group label="Buttons">
                <View style={s.wrap}>
                  {BUTTONS.map((b) => (
                    <Chip key={b.key} on={spec.options.buttons === b.key} onPress={() => setOption("buttons", b.key)}>
                      <View style={[s.btnDot, { backgroundColor: b.hex ?? spec.fabrics.trim.color }]} />
                      <T v="label" style={[{ fontSize: 10 }, spec.options.buttons === b.key && { color: C.ivory }]}>
                        {b.label}
                      </T>
                    </Chip>
                  ))}
                </View>
              </Group>
              {g.embroidery.length > 1 && (
                <Group label="Embroidery">
                  {EMBROIDERY.filter((e) => g.embroidery.includes(e.key)).map((e) => {
                    const on = spec.options.embroidery === e.key;
                    const extra = designPrice({ ...spec, options: { ...spec.options, embroidery: e.key } }).total - designPrice({ ...spec, options: { ...spec.options, embroidery: "none" } }).total;
                    return (
                      <Tap key={e.key} onPress={() => setOption("embroidery", e.key)} accessibilityRole="button" accessibilityState={{ selected: on }} style={[s.emb, on && s.embOn]}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <T v="label" style={{ fontSize: 10 }}>
                            {e.label}
                          </T>
                          {extra > 0 && (
                            <T v="label" style={{ fontSize: 10, color: C.goldDark }}>
                              +{formatINR(extra)}
                            </T>
                          )}
                        </View>
                        <T v="small">{e.note}</T>
                      </Tap>
                    );
                  })}
                </Group>
              )}
              {g.pocket && (
                <Tap onPress={() => setOption("pocket", !spec.options.pocket)} accessibilityRole="checkbox" accessibilityState={{ checked: spec.options.pocket }} style={s.check}>
                  <View style={[s.box, spec.options.pocket && { backgroundColor: C.green }]} />
                  <T>Chest pocket</T>
                </Tap>
              )}
            </>
          )}

          {tab === "order" && (
            <>
              <Group label="Name your design (optional)">
                <TextInput
                  value={spec.name}
                  maxLength={40}
                  onChangeText={(name) => update({ ...spec, name })}
                  placeholder="e.g. Sangeet kurta"
                  placeholderTextColor="#6B746F"
                  style={s.input}
                />
              </Group>
              <Group label="Size">
                <View style={s.wrap}>
                  {g.sizes.map((x) => (
                    <Chip key={x} on={size === x} onPress={() => setSize(x)}>
                      {x}
                    </Chip>
                  ))}
                  <Chip on={size === MTM_SIZE} onPress={() => (fit ? setSize(MTM_SIZE) : router.push("/royal-fit"))}>
                    Royal Fit · made to measure
                  </Chip>
                </View>
                <T v="small" style={{ marginTop: 8 }}>
                  {fit ? "Your saved Royal Fit measurements are included at no extra cost." : "Choose Royal Fit to measure with your camera or a tape — included at no extra cost."}
                </T>
              </Group>
              <Group label="Quantity">
                <Stepper value={qty} onChange={setQty} />
              </Group>
              <T v="small" style={{ borderLeftWidth: 2, borderLeftColor: C.gold, paddingLeft: 10, marginBottom: 6 }}>
                Made to order in our atelier and dispatched in about {DESIGN_DAYS} working days. Our master tailor reviews every design before the cloth is cut.
              </T>
              <T v="small" style={{ marginTop: 10 }}>
                {price.lines.map((l) => `${l.label} ${formatINR(l.amount)}`).join("  ·  ")}
              </T>
            </>
          )}
        </Animated.View>

        <View style={{ paddingHorizontal: 16, marginTop: 22, gap: 10 }}>
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <Btn onPress={addToBag} accessibilityLabel={`Add to bag, ${formatINR(price.total * qty)}`}>
            {`Add to bag · ${formatINR(price.total * qty)}`}
          </Btn>
          {msg?.tone === "success" && (
            <Btn kind="outline" onPress={() => router.push("/bag")}>
              View bag
            </Btn>
          )}
          <Btn
            kind="ghost"
            onPress={() => {
              const id = saveDesign(spec, savedId ?? undefined);
              setSavedId(id);
              setMsg({ tone: "success", text: "Design saved on this phone." });
            }}
          >
            {savedId ? "Update saved design" : "Save design"}
          </Btn>
          <Tap onPress={() => load(defaultDesign(spec.garment))} accessibilityRole="button" style={{ alignSelf: "center", padding: 8 }}>
            <T v="small" style={{ textDecorationLine: "underline" }}>
              Start this {g.label.toLowerCase()} again
            </T>
          </Tap>
        </View>

        {designs.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <T v="eyebrow" style={{ paddingHorizontal: 16 }}>
              Your saved designs
            </T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
              {designs.map((d) => (
                <Tap
                  key={d.id}
                  onPress={() => load(d.spec, d.id)}
                  onLongPress={() =>
                    Alert.alert("Delete saved design?", d.spec.name || garmentDef(d.spec.garment).label, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => removeDesign(d.id) },
                    ])
                  }
                  accessibilityRole="button"
                  accessibilityHint="Long-press to delete"
                  style={s.look}
                >
                  <DesignArt spec={d.spec} width={70} height={89} />
                  <T v="label" style={{ fontSize: 8.5, marginTop: 4 }} numberOfLines={1}>
                    {d.spec.name || garmentDef(d.spec.garment).label}
                  </T>
                </Tap>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <T v="label" style={{ marginBottom: 8 }}>
        {label}
      </T>
      {children}
    </View>
  );
}

function Swatches({ value, onPick }: { value: string; onPick: (hex: string) => void }) {
  return (
    <View style={s.wrap}>
      {FABRIC_COLORS.map((c) => {
        const on = c.hex.toUpperCase() === value.toUpperCase();
        return (
          <Tap key={c.hex} onPress={() => onPick(c.hex)} accessibilityRole="button" accessibilityLabel={c.name} accessibilityState={{ selected: on }} style={[s.colorRing, on && { borderColor: C.gold }]}>
            <View style={[s.color, { backgroundColor: c.hex }]} />
          </Tap>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  preview: { backgroundColor: C.pearl, alignItems: "center", paddingTop: 18, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.mist },
  previewFrame: { position: "absolute", top: 8, left: 8, right: 8, bottom: 8, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(201,160,74,0.45)" },
  priceRow: { flexDirection: "row", alignItems: "flex-end", alignSelf: "stretch", marginTop: 8 },
  look: { width: 84, alignItems: "center", borderWidth: 1, borderColor: C.mist, padding: 6, backgroundColor: C.white },
  tabs: { flexDirection: "row", marginTop: 14, borderBottomWidth: 1, borderBottomColor: C.mist, marginHorizontal: 16 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabOn: { borderBottomWidth: 2, borderBottomColor: C.gold },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  check: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, minHeight: 44 },
  box: { width: 20, height: 20, borderWidth: 1.5, borderColor: C.green },
  pattern: { width: 66, alignItems: "center", padding: 4, borderWidth: 1, borderColor: C.mist },
  patternOn: { borderColor: C.green, borderWidth: 2 },
  colorRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  color: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: "rgba(14,26,21,0.18)" },
  btnDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: "rgba(14,26,21,0.3)" },
  emb: { borderWidth: 1, borderColor: C.mist, padding: 12, marginBottom: 8 },
  embOn: { borderColor: C.green, borderWidth: 1.5, backgroundColor: C.pearl },
  input: { minHeight: 50, borderWidth: 1, borderColor: "#B9B4A6", paddingHorizontal: 14, fontFamily: F.serif, fontSize: 18, color: C.green },
});
