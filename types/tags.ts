export interface Tag {
  id: number
  name: string
  description: string
  category_id: number
  categories?: Category
}

export interface Category {
  id: number
  name: string
  description: string
}

export interface EntryTag {
  id: number
  entry_id: string
  tag_id: number
  confidence: number
  tags?: Tag
}

export interface TagWithCount extends Tag {
  count: number
}

export interface CategoryWithTags extends Category {
  tags: Tag[]
}
