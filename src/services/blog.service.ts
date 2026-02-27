// Re-export everything from journal.service.ts for backward compatibility
export {
  JournalService as BlogService,
  type JournalPost as BlogPost,
  type JournalPostCreateData as BlogPostCreateData,
  type JournalPostUpdateData as BlogPostUpdateData,
  type JournalPostFilters as BlogPostFilters,
  type JournalPostListResponse as BlogPostListResponse,
  type JournalArchive as BlogArchive,
  type PaginationOptions,
} from './journal.service'
