// src/pages/admin/ManageInsurance.jsx
import { useState } from "react";
import ManageInsuranceCompanies from "./insurance/ManageInsuranceCompanies";
import ManageOdRates from "./insurance/ManageODRate";
import ManageTpRates from "./insurance/ManageTPRate";
import ManageAddonRates from "./insurance/ManageAddonRates";
import AssignVariantTpType from "./insurance/AssignVariantTpType";
import ManageOdDiscounts from "./insurance/ManageOdDiscounts";

const TABS = [
  { key: "companies", label: "Companies", comp: ManageInsuranceCompanies },
  { key: "od", label: "OD Rates", comp: ManageOdRates },
  { key: "tp", label: "Third-Party Rates", comp: ManageTpRates },
  { key: "addons", label: "Addons (TP % Grid)", comp: ManageAddonRates },
  { key: "variant-tp", label: "Variant → TP Type", comp: AssignVariantTpType },
  { key: "od-discount", label: "OD Discounts", comp: ManageOdDiscounts }, // NEW
];

export default function ManageInsurance() {
  const [active, setActive] = useState(TABS[0].key);
  const ActiveComp = TABS.find((t) => t.key === active)?.comp || TABS[0].comp;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Insurance Admin</h1>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-3 py-2 rounded-lg ${
              active === t.key ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card p-4">
        <ActiveComp />
      </div>
    </div>
  );
}
