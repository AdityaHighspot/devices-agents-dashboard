import { useState, useEffect } from 'react'
import { ChevronRight, Folder, FileText, Search, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

function TestFolder({
  folder,
  selectedTests,
  onToggleTest,
  onToggleFolder,
  expandedFolders,
  onToggleExpand,
  searchQuery,
}) {
  const isExpanded = expandedFolders.has(folder.id)
  const folderTests = folder.tests || []
  const selectedCount = folderTests.filter((t) => selectedTests.has(t.key)).length

  const isChecked = selectedCount === folderTests.length && folderTests.length > 0
  const isIndeterminate = selectedCount > 0 && selectedCount < folderTests.length

  // Filter by search
  const matchesSearch = (test) =>
    !searchQuery ||
    test.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.name.toLowerCase().includes(searchQuery.toLowerCase())

  const visibleTests = folderTests.filter(matchesSearch)
  const hasVisibleTests = visibleTests.length > 0

  if (searchQuery && !hasVisibleTests) return null

  return (
    <Collapsible open={isExpanded} onOpenChange={() => onToggleExpand(folder.id)}>
      <div className="flex items-center gap-1 py-1 px-1 rounded-md hover:bg-accent group">
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
          onCheckedChange={(checked) =>
            onToggleFolder(
              folderTests.map((t) => t.key),
              checked
            )
          }
          className="mr-1"
        />

        <Folder className="h-4 w-4 text-muted-foreground mr-1" />
        <span className="text-sm flex-1 truncate">{folder.name}</span>
        <span className="text-xs text-muted-foreground pr-2">{folderTests.length}</span>
      </div>

      <CollapsibleContent>
        {visibleTests.map((test) => (
          <div
            key={test.key}
            className="flex items-center gap-1 py-1 px-1 rounded-md hover:bg-accent ml-6"
          >
            <Checkbox
              checked={selectedTests.has(test.key)}
              onCheckedChange={() => onToggleTest(test.key)}
              className="mr-1"
            />
            <FileText className="h-4 w-4 text-muted-foreground mr-1" />
            <span className="text-xs font-mono text-muted-foreground mr-2">{test.key}</span>
            <span className="text-sm truncate">{test.name}</span>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export default function ZephyrTestTree({ selectedTests, onSelectionChange }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [expandedFolders, setExpandedFolders] = useState(new Set())

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}zephyr-tests.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load Zephyr tests')
        return res.json()
      })
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const toggleTest = (key) => {
    const newSelected = new Set(selectedTests)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    onSelectionChange(newSelected)
  }

  const toggleFolder = (testKeys, checked) => {
    const newSelected = new Set(selectedTests)
    testKeys.forEach((key) => {
      if (checked) {
        newSelected.add(key)
      } else {
        newSelected.delete(key)
      }
    })
    onSelectionChange(newSelected)
  }

  const toggleExpand = (folderId) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const expandAll = () => {
    if (data) {
      setExpandedFolders(new Set(data.folders.map((f) => f.id)))
    }
  }

  const collapseAll = () => {
    setExpandedFolders(new Set())
  }

  const selectAll = () => {
    if (data) {
      const allKeys = data.folders.flatMap((f) => f.tests.map((t) => t.key))
      onSelectionChange(new Set(allKeys))
    }
  }

  const selectNone = () => {
    onSelectionChange(new Set())
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading Zephyr tests...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data || data.folders.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No Zephyr tests available. Re-run the deploy workflow to fetch.</AlertDescription>
      </Alert>
    )
  }

  const totalTests = data.folders.reduce((sum, f) => sum + f.tests.length, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Select Tests ({selectedTests.size} / {totalTests})
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(data.generatedAt).toLocaleString()}
        </p>
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
            placeholder="Search tests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-96 overflow-y-auto border rounded-md p-2">
          {data.folders.map((folder) => (
            <TestFolder
              key={folder.id}
              folder={folder}
              selectedTests={selectedTests}
              onToggleTest={toggleTest}
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
