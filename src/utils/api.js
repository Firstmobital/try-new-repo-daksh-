// src/utils/api.js
import { supabase } from "../lib/supabase";

/** Cars **/
export async function getCars() {
  const { data, error } = await supabase
    .from("car")
    .select("id,name,hero_image_url")
    .eq("is_published", true)
    .order("name");

  if (error) throw error;
  return data || [];
}

/** Single Variant **/
export async function getVariant(variantId) {
  const { data, error } = await supabase
    .from("model_variant")
    .select(
      `
      *,
      fuel_type:fuel_type_id (id,label),
      transmission:transmission_id (id,label,code)
    `
    )
    .eq("id", variantId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    fuel_label: data.fuel_type?.label,
    transmission_label: data.transmission?.label,
  };
}

/** Variant content (features + up to 7 images) **/
export async function getVariantContent(variantId) {
  const { data, error } = await supabase
    .from("variant_content")
    .select(`
      variant_id,
      features,
      image1_url,
      image2_url,
      image3_url,
      image4_url,
      image5_url,
      image6_url,
      image7_url
    `)
    .eq("variant_id", variantId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    features: data.features
      ? String(data.features)
          .split("|")
          .map((f) => f.trim())
          .filter(Boolean)
      : [],
    images: [
      data.image1_url,
      data.image2_url,
      data.image3_url,
      data.image4_url,
      data.image5_url,
      data.image6_url,
      data.image7_url,
    ].filter(Boolean),
  };
}

/** Schemes — safe OR logic **/
export async function getSchemesForVariant(variantId, carId) {
  let orParts = [`variant_id.eq.${variantId}`, `scope.eq.GLOBAL`];
  if (carId) orParts.push(`car_id.eq.${carId}`);

  const { data, error } = await supabase
    .from("scheme_rule")
    .select("scope,scheme,amount,apply_default")
    .or(orParts.join(","))
    .eq("active", true);

  if (error) throw error;

  const rank = { VARIANT: 3, CAR: 2, GLOBAL: 1 };
  const byScheme = {};
  (data || []).forEach((row) => {
    const existing = byScheme[row.scheme];
    if (!existing || rank[row.scope] > rank[existing.scope]) {
      byScheme[row.scheme] = row;
    }
  });

  return Object.keys(byScheme).map((k) => ({
    scheme: k,
    amount: Number(byScheme[k].amount || 0),
    apply_default: !!byScheme[k].apply_default,
  }));
}

/** RTO breakdown **/
export async function getRtoBreakdown(variantId) {
  const { data, error } = await supabase
    .from("rto_charge")
    .select(`
      reg_type,
      new_registration,
      hypothecation_addition,
      duplicate_tax_card,
      mv_tax,
      surcharge_mv_tax,
      green_tax,
      rebate_waiver
    `)
    .eq("variant_id", variantId);

  if (error) throw error;
  return data || [];
}
