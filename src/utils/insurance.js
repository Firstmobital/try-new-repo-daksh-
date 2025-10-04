// src/utils/insurance.js
export function toFraction(x) {
  // Accept 50 or "50%" -> 0.5 ; 0.5 stays 0.5
  if (x == null) return 0;
  if (typeof x === "string" && x.trim().endsWith("%")) {
    const n = parseFloat(x);
    return isNaN(n) ? 0 : n / 100;
  }
  const n = Number(x);
  if (isNaN(n)) return 0;
  return n > 1 ? n / 100 : n;
}

export function money(n) {
  const val = Number(n || 0);
  return "₹" + Math.round(val).toLocaleString();
}

export function computeIDV(exShowroom, schemeTotal) {
  const base = Math.max(0, Number(exShowroom || 0) - Number(schemeTotal || 0));
  return base * 0.95;
}

export function computeODPremium(idv, odRate) {
  return Number(idv || 0) * Number(odRate || 0);
}

export function computeNetOD(odPremium, discountFraction) {
  return Number(odPremium || 0) * (1 - Number(discountFraction || 0));
}

export function computeAddons(idv, tpType, companyCode, selectedAddons, addonRateIndex) {
  // addonRateIndex: { [company]: { [addon]: { [tpType]: rate } } }
  if (!selectedAddons || selectedAddons.length === 0) return 0;
  let total = 0;
  const idx = addonRateIndex?.[companyCode];
  if (!idx) return 0;
  for (const code of selectedAddons) {
    const r = idx[code]?.[tpType];
    if (r) total += idv * r;
  }
  return total;
}

export function computeTotal(netOD, tp, addonTotal, gst = 0.18) {
  const base = Number(netOD || 0) + Number(tp || 0) + Number(addonTotal || 0);
  return base * (1 + gst);
}
