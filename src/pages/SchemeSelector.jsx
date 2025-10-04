import { useQuoteStore } from '../store/quoteStore'

export default function SchemeSelector() {
  const scheme = useQuoteStore(s => s.selectedScheme)
  const setScheme = useQuoteStore(s => s.setScheme)

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Select Schemes</h3>
      <div className="space-y-2 text-sm">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={scheme === 'Exchange'}
            onChange={() =>
              setScheme(scheme === 'Exchange' ? null : 'Exchange')
            }
          />
          <span>Exchange / Scrap</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="msmeSolar"
            checked={scheme === 'MSME'}
            onChange={() => setScheme('MSME')}
          />
          <span>MSME</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="msmeSolar"
            checked={scheme === 'Solar'}
            onChange={() => setScheme('Solar')}
          />
          <span>Solar</span>
        </label>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Note: Only MSME or Solar can be chosen. Exchange/Scrap can bundle with
        either.
      </p>
    </div>
  )
}
