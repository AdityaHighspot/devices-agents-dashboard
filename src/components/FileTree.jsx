import { useState, useMemo } from 'react'
import { ChevronRight, Folder, File, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

// Build nested tree from flat file paths
function buildTree(files) {
  const root = { name: 'root', children: {}, files: [] }

  files.forEach((filePath) => {
    const parts = filePath.split('/')
    let current = root

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          children: {},
          files: [],
        }
      }
      current = current.children[part]
    }

    current.files.push({
      name: parts[parts.length - 1],
      path: filePath,
    })
  })

  return root
}

// Get all file paths under a node
function getAllFiles(node) {
  let files = node.files.map((f) => f.path)
  Object.values(node.children).forEach((child) => {
    files = files.concat(getAllFiles(child))
  })
  return files
}

// Folder component
function TreeFolder({
  node,
  selectedFiles,
  onToggleFile,
  onToggleFolder,
  expandedFolders,
  onToggleExpand,
  searchQuery,
  depth = 0,
}) {
  const isExpanded = expandedFolders.has(node.path)
  const allFiles = useMemo(() => getAllFiles(node), [node])
  const selectedCount = allFiles.filter((f) => selectedFiles.has(f)).length

  const isChecked = selectedCount === allFiles.length && allFiles.length > 0
  const isIndeterminate = selectedCount > 0 && selectedCount < allFiles.length

  const folderNames = Object.keys(node.children).sort()
  const files = [...node.files].sort((a, b) => a.name.localeCompare(b.name))

  // Filter by search
  const matchesSearch = (path) =>
    !searchQuery || path.toLowerCase().includes(searchQuery.toLowerCase())
  const hasVisibleChildren = allFiles.some(matchesSearch)

  if (searchQuery && !hasVisibleChildren) return null

  return (
    <Collapsible open={isExpanded} onOpenChange={() => onToggleExpand(node.path)}>
      <div
        className="flex items-center gap-1 py-1 px-1 rounded-md hover:bg-accent group"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </Button>
        </CollapsibleTrigger>

        <Checkbox
          checked={isChecked}
          ref={(el) => {
            if (el) el.indeterminate = isIndeterminate
          }}
          onCheckedChange={(checked) => onToggleFolder(allFiles, checked)}
          className="mr-1"
        />

        <Folder className="h-4 w-4 text-muted-foreground mr-1" />
        <span className="text-sm flex-1">{node.name}</span>
        <span className="text-xs text-muted-foreground pr-2">{allFiles.length}</span>
      </div>

      <CollapsibleContent>
        {folderNames.map((folderName) => (
          <TreeFolder
            key={node.children[folderName].path}
            node={node.children[folderName]}
            selectedFiles={selectedFiles}
            onToggleFile={onToggleFile}
            onToggleFolder={onToggleFolder}
            expandedFolders={expandedFolders}
            onToggleExpand={onToggleExpand}
            searchQuery={searchQuery}
            depth={depth + 1}
          />
        ))}

        {files.map((file) => {
          if (searchQuery && !matchesSearch(file.path)) return null
          return (
            <TreeFile
              key={file.path}
              file={file}
              isSelected={selectedFiles.has(file.path)}
              onToggle={() => onToggleFile(file.path)}
              depth={depth + 1}
            />
          )
        })}
      </CollapsibleContent>
    </Collapsible>
  )
}

// File component
function TreeFile({ file, isSelected, onToggle, depth }) {
  return (
    <div
      className="flex items-center gap-1 py-1 px-1 rounded-md hover:bg-accent"
      style={{ paddingLeft: `${depth * 12 + 28}px` }}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        className="mr-1"
      />
      <File className="h-4 w-4 text-muted-foreground mr-1" />
      <span className="text-sm">{file.name}</span>
    </div>
  )
}

// Main FileTree component
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

  const toggleFolder = (folderFiles, checked) => {
    const newSelected = new Set(selectedFiles)
    folderFiles.forEach((f) => {
      if (checked) {
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Select Files</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={selectNone}>
            Clear
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-96 overflow-y-auto border rounded-md p-2">
          {Object.keys(tree.children)
            .sort()
            .map((folderName) => (
              <TreeFolder
                key={tree.children[folderName].path}
                node={tree.children[folderName]}
                selectedFiles={selectedFiles}
                onToggleFile={toggleFile}
                onToggleFolder={toggleFolder}
                expandedFolders={expandedFolders}
                onToggleExpand={toggleExpand}
                searchQuery={search}
              />
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
