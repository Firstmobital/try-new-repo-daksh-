import React, { useMemo } from "react";
import { useQuoteStore } from "../store/quoteStore";

export default function QuotationPanel() {
  const variant = useQuoteStore((s) => s.selectedVariant);
  const defaults = useQuoteStore((s) => s.defaults); // consumer, green, intervention
  const optional = useQuoteStore((s) => s.optionalAmounts); // msme, solar, scrap
  const scheme = useQuoteStore((s) => s.selectedScheme); // "MSME" or "Solar"
  const exchange = useQuoteStore((s) => s.selectedExchange); // true/false
  const rtoCharge = useQuoteStore((s) => s.rtoCharge); // number

  // compute total
  const finalPrice = useMemo(() => {
    if (!variant) return 0;
    let base = Number(variant.ex_showroom || 0);

    // defaults always applied
    let totalDiscount =
      Number(defaults.consumer || 0) +
      Number(defaults.green || 0) +
      Number(defaults.intervention || 0);

    // optional
    if (exchange) totalDiscount += Number(optional.scrap || 0);
    if (scheme === "MSME") totalDiscount += Number(optional.msme || 0);
    if (scheme === "Solar") totalDiscount += Number(optional.solar || 0);

    let total = base - totalDiscount + Number(rtoCharge || 0);
    return total;
  }, [variant, defaults, optional, scheme, exchange, rtoCharge]);

  if (!variant) {
    return (
      <div className="text-gray-500 text-sm">
        Select a variant to see the price breakdown.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ex-Showroom */}
      <div className="flex justify-between text-sm">
        <span>Ex-Showroom</span>
        <span className="font-medium">
          ₹{variant.ex_showroom.toLocaleString()}
        </span>
      </div>

      {/* Default schemes */}
      {defaults.consumer > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Consumer</span>
          <span>-₹{defaults.consumer.toLocaleString()}</span>
        </div>
      )}
      {defaults.green > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Green Bonus</span>
          <span>-₹{defaults.green.toLocaleString()}</span>
        </div>
      )}
      {defaults.intervention > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Intervention</span>
          <span>-₹{defaults.intervention.toLocaleString()}</span>
        </div>
      )}

      {/* Optional */}
      {exchange && optional.scrap > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Exchange / Scrap</span>
          <span>-₹{optional.scrap.toLocaleString()}</span>
        </div>
      )}
      {scheme === "MSME" && optional.msme > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>MSME</span>
          <span>-₹{optional.msme.toLocaleString()}</span>
        </div>
      )}
      {scheme === "Solar" && optional.solar > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Solar</span>
          <span>-₹{optional.solar.toLocaleString()}</span>
        </div>
      )}

      {/* RTO */}
      {rtoCharge > 0 && (
        <div className="flex justify-between text-sm text-blue-600">
          <span>RTO Charges</span>
          <span>+₹{rtoCharge.toLocaleString()}</span>
        </div>
      )}

      {/* Final Price (simple white card) */}
      <div className="card p-4 text-center">
        <h3 className="text-lg font-semibold">Final Price</h3>
        <p className="text-3xl font-bold mt-2 text-gray-900">
          ₹{finalPrice.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
