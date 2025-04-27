"\"use client"

import { useState, useEffect } from "react"
import { Check, X, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Tag, Category } from "@/types/tags"

interface TagFilterProps {
  onFilterChange: (selectedTags: string[], selectedCategories: string[]) => void
}

export default function TagFilter({ onFilterChange }: TagFilterProps) {
  const [open, setOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTagsAndCategories = async () => {
      try {
        setLoading(true)

        // Fetch tags
        const tagsResponse = await fetch("/api/tags")
        const tagsData = await tagsResponse.json()

        // Fetch categories
        const categoriesResponse = await fetch("/api/categories")
        const categoriesData = await categoriesResponse.json()

        setTags(tagsData.tags || [])
        setCategories(categoriesData.categories || [])
      } catch (error) {
        console.error("Error fetching tags and categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTagsAndCategories()
  }, [])

  const handleTagSelect = (tagName: string) => {
    setSelectedTags((prev) => {
      const newSelection = prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]

      // Notify parent component about the change
      onFilterChange(newSelection, selectedCategories)
      return newSelection
    })
  }

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategories((prev) => {
      const newSelection = prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]

      // Notify parent component about the change
      onFilterChange(selectedTags, newSelection)
      return newSelection
    })
  }

  const clearFilters = () => {
    setSelectedTags([])
    setSelectedCategories([])
    onFilterChange([], [])
  }

  // Group tags by category
  const tagsByCategory: Record<string, Tag[]> = {}

  tags.forEach((tag) => {
    const category = categories.find((c) => c.id === tag.category_id)
    const categoryName = category?.name || "Uncategorized"

    if (!tagsByCategory[categoryName]) {
      tagsByCategory[categoryName] = []
    }

    tagsByCategory[categoryName].push(tag)
  })

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filter</h3>
        {selectedTags.length > 0 || selectedCategories.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs">
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <X className="h-3 w-3 cursor-pointer" onClick={() => handleTagSelect(tag)} />
          </Badge>
        ))}
        {selectedCategories.map((category) => (
          <Badge key={category} variant="secondary" className="flex items-center gap-1">
            {category}
            <X className="h-3 w-3 cursor-pointer" onClick={() => handleCategorySelect(category)} />
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="justify-between" disabled={loading}>
            {loading ? "Loading..." : "Add filter"}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No items found.</CommandEmpty>
              {categories.map((category) => (
                <CommandGroup key={category.id} heading={category.name}>
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => handleCategorySelect(category.name)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${selectedCategories.includes(category.name) ? "opacity-100" : "opacity-0"}`}
                    />
                    {category.name}
                  </CommandItem>
                  {tagsByCategory[category.name]?.map((tag) => (
                    <CommandItem key={tag.id} value={tag.name} onSelect={() => handleTagSelect(tag.name)}>
                      <Check
                        className={`mr-2 h-4 w-4 ${selectedTags.includes(tag.name) ? "opacity-100" : "opacity-0"}`}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
