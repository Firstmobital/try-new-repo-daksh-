// src/utils/insurance.js

export function toFraction(x) {
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
  return "₹" + Math.round(val).toLocaleString("en-IN");
}

// IDV = (Ex-showroom - Scheme default) * 95%
export function computeIDV(exShowroom, schemeTotal) {
  const base = Math.max(0, Number(exShowroom || 0) - Number(schemeTotal || 0));
  return base * 0.95;
}

// OD Premium
export function computeODPremium(idv, odRate) {
  return Number(idv || 0) * Number(odRate || 0);
}

// Net OD = OD Premium – Discount
export function computeNetOD(odPremium, discountFraction) {
  return Number(odPremium || 0) * (1 - Number(discountFraction || 0));
}

// Addons Sum
export function computeAddons(
  idv,
  tpTypeId,
  companyId,
  selectedAddons,
  addonRateIndex
) {
  if (!selectedAddons?.length) return 0;

  let total = 0;
  const companyRates = addonRateIndex?.[companyId];
  if (!companyRates) return 0;

  for (const addonId of selectedAddons) {
    const pct = companyRates[addonId]?.[tpTypeId];
    if (!pct) continue;

    total += Number(idv) * (Number(pct) / 100); // ✅ Percentage handling
  }

  return total;
}

// Total = (Net OD + TP + Addons) + GST 18%
export function computeTotal(netOD, tp, addonTotal, gst = 0.18) {
  const base = Number(netOD || 0) + Number(tp || 0) + Number(addonTotal || 0);
  return base * (1 + gst);
}
