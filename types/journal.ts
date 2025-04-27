import type { EntryTag } from "./tags"

export interface JournalEntry {
  id: string
  user_id: string
  content: string
  title: string
  created_at: string
  updated_at: string
  mood?: number
  summary?: string
  tags?: EntryTag[]
}

export interface JournalEntryWithTags extends JournalEntry {
  entry_tags: EntryTag[]
}
