import { useState, useMemo } from 'react'

function buildTree(files) {
  const root = { children: {}, files: [] }

  files.forEach(filePath => {
    const parts = filePath.split('/')
    let current = root

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!current.children[part]) {
        current.children[part] = { children: {}, files: [], path: parts.slice(0, i + 1).join('/') }
      }
      current = current.children[part]
    }

    current.files.push({ name: parts[parts.length - 1], path: filePath })
  })

  return root
}

function countFiles(node) {
  let count = node.files.length
  for (const child of Object.values(node.children)) {
    count += countFiles(child)
  }
  return count
}

function getAllFilesInNode(node) {
  let files = node.files.map(f => f.path)
  for (const child of Object.values(node.children)) {
    files = files.concat(getAllFilesInNode(child))
  }
  return files
}

function TreeNode({ name, node, depth, selectedFiles, onToggleFile, onToggleFolder, expandedFolders, onToggleExpand, searchQuery }) {
  const isExpanded = expandedFolders.has(node.path)
  const allFiles = useMemo(() => getAllFilesInNode(node), [node])
  const selectedCount = allFiles.filter(f => selectedFiles.has(f)).length
  const isFullySelected = selectedCount === allFiles.length
  const isPartiallySelected = selectedCount > 0 && selectedCount < allFiles.length

  const folderNames = Object.keys(node.children).sort()
  const files = [...node.files].sort((a, b) => a.name.localeCompare(b.name))

  // Filter by search
  const matchesSearch = (path) => !searchQuery || path.toLowerCase().includes(searchQuery.toLowerCase())
  const hasVisibleChildren = allFiles.some(matchesSearch)

  if (searchQuery && !hasVisibleChildren) return null

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 px-2 rounded hover:bg-gray-800 cursor-pointer group"
        onClick={() => onToggleExpand(node.path)}
      >
        <span className={`text-xs text-gray-600 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`}>
          ▼
        </span>
        <input
          type="checkbox"
          checked={isFullySelected}
          ref={(el) => { if (el) el.indeterminate = isPartiallySelected }}
          onChange={(e) => {
            e.stopPropagation()
            onToggleFolder(allFiles, !isFullySelected)
          }}
          onClick={(e) => e.stopPropagation()}
          className="accent-blue-500"
        />
        <span className="text-sm">📁</span>
        <span className="text-sm flex-1">{name}</span>
        <span className="text-xs text-gray-600">{allFiles.length}</span>
      </div>

      {isExpanded && (
        <div className="ml-5">
          {folderNames.map(folderName => (
            <TreeNode
              key={node.children[folderName].path}
              name={folderName}
              node={node.children[folderName]}
              depth={depth + 1}
              selectedFiles={selectedFiles}
              onToggleFile={onToggleFile}
              onToggleFolder={onToggleFolder}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
              searchQuery={searchQuery}
            />
          ))}
          {files.map(file => {
            if (searchQuery && !matchesSearch(file.path)) return null
            return (
              <div
                key={file.path}
                className="flex items-center gap-1 py-1 px-2 rounded hover:bg-gray-800"
              >
                <span className="w-4" />
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.path)}
                  onChange={() => onToggleFile(file.path)}
                  className="accent-blue-500"
                />
                <span className="text-sm">📄</span>
                <span className="text-sm text-gray-300">{file.name}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function FileTree({ files, selectedFiles, onSelectionChange }) {
  const [search, setSearch] = useState('')
  const [expandedFolders, setExpandedFolders] = useState(new Set(['lib']))

  const tree = useMemo(() => buildTree(files), [files])

  const toggleFile = (path) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(path)) {
      newSelected.delete(path)
    } else {
      newSelected.add(path)
    }
    onSelectionChange(newSelected)
  }

  const toggleFolder = (folderFiles, select) => {
    const newSelected = new Set(selectedFiles)
    folderFiles.forEach(f => {
      if (select) {
        newSelected.add(f)
      } else {
        newSelected.delete(f)
      }
    })
    onSelectionChange(newSelected)
  }

  const toggleExpand = (path) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const expandAll = () => {
    const allFolders = new Set()
    const addFolders = (node) => {
      if (node.path) allFolders.add(node.path)
      Object.values(node.children).forEach(addFolders)
    }
    addFolders(tree)
    setExpandedFolders(allFolders)
  }

  const collapseAll = () => {
    setExpandedFolders(new Set(['lib']))
  }

  const selectAll = () => {
    onSelectionChange(new Set(files))
  }

  const selectNone = () => {
    onSelectionChange(new Set())
  }

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        <button onClick={expandAll} className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded">
          Expand All
        </button>
        <button onClick={collapseAll} className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded">
          Collapse All
        </button>
        <button onClick={selectAll} className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded">
          Select All
        </button>
        <button onClick={selectNone} className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded">
          Clear
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search files..."
        className="w-full px-3 py-2 mb-3 bg-gray-950 border border-gray-800 rounded-md text-sm focus:outline-none focus:border-blue-500"
      />

      <div className="max-h-96 overflow-y-auto bg-gray-950 border border-gray-800 rounded-md p-2">
        {Object.keys(tree.children).sort().map(folderName => (
          <TreeNode
            key={tree.children[folderName].path}
            name={folderName}
            node={tree.children[folderName]}
            depth={0}
            selectedFiles={selectedFiles}
            onToggleFile={toggleFile}
            onToggleFolder={toggleFolder}
            expandedFolders={expandedFolders}
            onToggleExpand={toggleExpand}
            searchQuery={search}
          />
        ))}
      </div>
    </div>
  )
}
