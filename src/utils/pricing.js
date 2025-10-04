export function buildBreakdown(exShowroom, defaults, optionalToggles, optionalAmts, rto) {
  const businessChoice = optionalToggles.msme ? optionalAmts.msme : (optionalToggles.solar ? optionalAmts.solar : 0)
  const corporate = optionalToggles.corporate ? optionalAmts.corporate : 0
  const scrap = optionalToggles.scrap ? optionalAmts.scrap : 0

  const items = [
    { label: 'Ex-Showroom', type: 'base', value: exShowroom },
    { label: 'Consumer', type: 'discount', value: defaults.consumer },
    { label: 'Green Bonus', type: 'discount', value: defaults.green },
    { label: 'Intervention', type: 'discount', value: defaults.intervention },
  ]
  if (businessChoice) items.push({ label: 'Business Benefit (Solar/MSME)', type: 'discount', value: businessChoice })
  if (corporate) items.push({ label: 'Corporate', type: 'discount', value: corporate })
  if (scrap) items.push({ label: 'Scrap', type: 'discount', value: scrap })
  if (rto) items.push({ label: 'RTO', type: 'charge', value: rto })

  const totalDiscounts = items.filter(i => i.type==='discount').reduce((s,i)=>s+Number(i.value||0),0)
  const totalCharges  = items.filter(i => i.type==='charge').reduce((s,i)=>s+Number(i.value||0),0)
  const final = exShowroom - totalDiscounts + totalCharges

  return { items, final, totalDiscounts, totalCharges }
}

export function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}
