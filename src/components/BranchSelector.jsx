import { useState, useRef, useEffect } from 'react'

export default function BranchSelector({ branch, branches, loading, onBranchChange, onFetchBranches }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredBranches = branches.filter(b =>
    b.toLowerCase().includes(search.toLowerCase())
  )

  // Group branches
  const defaultBranches = ['main', 'develop', 'master'].filter(b => branches.includes(b))
  const otherBranches = filteredBranches.filter(b => !defaultBranches.includes(b))

  const handleSelect = (b) => {
    onBranchChange(b)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 relative" ref={dropdownRef}>
        <label className="block text-xs text-gray-500 mb-1">Branch</label>
        <div
          onClick={() => {
            setOpen(!open)
            if (!open && branches.length === 0) onFetchBranches()
          }}
          className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-md text-sm cursor-pointer flex justify-between items-center hover:border-gray-700"
        >
          <span>{branch}</span>
          <span className="text-gray-600">▼</span>
        </div>

        {open && (
          <div className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-800 rounded-md shadow-lg max-h-80 overflow-hidden">
            <div className="p-2 border-b border-gray-800">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search branches..."
                autoFocus
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-md text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="px-3 py-4 text-center text-gray-500 text-sm">Loading branches...</div>
              ) : (
                <>
                  {defaultBranches.length > 0 && (
                    <>
                      <div className="px-3 py-1 text-xs text-gray-600 bg-gray-950">Default</div>
                      {defaultBranches.map(b => (
                        <div
                          key={b}
                          onClick={() => handleSelect(b)}
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-800 text-sm ${b === branch ? 'text-blue-400' : ''}`}
                        >
                          {b}
                        </div>
                      ))}
                    </>
                  )}

                  {otherBranches.length > 0 && (
                    <>
                      <div className="px-3 py-1 text-xs text-gray-600 bg-gray-950">
                        {search ? 'Results' : 'Recent'}
                      </div>
                      {otherBranches.slice(0, 50).map(b => (
                        <div
                          key={b}
                          onClick={() => handleSelect(b)}
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-800 text-sm ${b === branch ? 'text-blue-400' : ''}`}
                        >
                          {b}
                        </div>
                      ))}
                      {otherBranches.length > 50 && (
                        <div className="px-3 py-2 text-xs text-gray-600">
                          +{otherBranches.length - 50} more (use search)
                        </div>
                      )}
                    </>
                  )}

                  {filteredBranches.length === 0 && !loading && (
                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                      {branches.length === 0 ? 'Click to load branches' : 'No matches'}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onFetchBranches}
        disabled={loading}
        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-sm disabled:opacity-50"
      >
        ↻
      </button>
    </div>
  )
}
