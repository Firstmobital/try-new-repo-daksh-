// src/store/quoteStore.js
import { create } from "zustand";

export const useQuoteStore = create((set) => ({
  /**********************
   * CAR SELECTION
   **********************/
  cars: [],
  setCars: (cars) => set({ cars }),

  selectedCar: null,
  selectCar: (car) =>
    set({
      selectedCar: car,
      // reset everything when a new car is chosen:
      selectedFuel: null,
      selectedTransmission: null,
      selectedVariant: null,
      selectedAccessories: [],
      selectedInsurance: null,
      selectedScheme: null,
      selectedExchange: false,
      selectedRTO: null,
      rtoCharge: 0,
      defaults: { consumer: 0, green: 0, intervention: 0 },
      optionalAmounts: { msme: 0, solar: 0, corporate: 0, scrap: 0 },
    }),

  /**********************
   * FUEL / TRANSMISSION / VARIANTS
   **********************/
  fuels: [],
  setFuels: (fuels) => set({ fuels }),

  selectedFuel: null,
  setFuel: (fuel) => set({ selectedFuel: fuel }),

  transmissions: [],
  setTransmissions: (transmissions) => set({ transmissions }),

  selectedTransmission: null,
  setTransmission: (transmission) => set({ selectedTransmission: transmission }),

  variants: [],
  setVariants: (variants) => set({ variants }),

  selectedVariant: null,
  setVariant: (variant) => set({ selectedVariant: variant }),

  /**********************
   * SCHEMES (optional discounts)
   **********************/
  selectedScheme: null,
  setScheme: (scheme) => set({ selectedScheme: scheme }),

  selectedExchange: false,
  setExchange: (selectedExchange) => set({ selectedExchange }),

  defaults: { consumer: 0, green: 0, intervention: 0 },
  setDefaults: (defaults) => set({ defaults }),

  optionalAmounts: { msme: 0, solar: 0, corporate: 0, scrap: 0 },
  setOptional: (optionalAmounts) => set({ optionalAmounts }),

  /**********************
   * RTO
   **********************/
  selectedRTO: null, // store chosen RTO option
  setRTO: (rto) => set({ selectedRTO: rto }),

  rtoCharge: 0,
  setRtoCharge: (rtoCharge) => set({ rtoCharge }),

  /**********************
   * INSURANCE
   **********************/
  selectedInsurance: null, // store chosen insurance plan + add-ons
  setSelectedInsurance: (obj) => set({ selectedInsurance: obj }),

  /**********************
   * ACCESSORIES
   **********************/
  selectedAccessories: [], // array of accessory IDs or objects
  setSelectedAccessories: (arr) => set({ selectedAccessories: arr }),

  /**********************
   * RESET ALL
   **********************/
  resetAll: () =>
    set({
      selectedFuel: null,
      selectedTransmission: null,
      selectedVariant: null,
      selectedScheme: null,
      selectedExchange: false,
      selectedRTO: null,
      rtoCharge: 0,
      defaults: { consumer: 0, green: 0, intervention: 0 },
      optionalAmounts: { msme: 0, solar: 0, corporate: 0, scrap: 0 },
      selectedAccessories: [],
      selectedInsurance: null,
    }),
}));
