# Project TODO

## In Progress
- [ ] Application scaffolding
- [ ] flesh out db structure


## Next Up
- [ ] configure github and branching
- [ ] seed db for scenarios

## Backlog
- [ ] Authentication and user roles
- [ ] In-App Messaging
- [ ] Technical debt items
- [ ] Performance optimizations
- [ ] Documentation updates
- [ ] SEO
- [ ] intrest survey (lead generation)

## Done
- [x] 8/8/25 - Hello world Azure DB connectivity
- [x] Set up Next.js application with TypeScript and Tailwind CSS
- [x] Configure Azure SQL Database connection
- [x] Create initial database schema with messages table
- [x] Implement basic API route for fetching messages
- [x] Test database connectivity and display test data

---

## Project Notes
- **Database**: Azure SQL Database (`sfe_db`) 
- **Framework**: Next.js 15 with App Router
- **Authentication**: Currently using SQL auth (consider migrating to Azure AD)
- **Styling**: Tailwind CSS 4

## Quick Reference
- Development: `npm run dev`
- Build: `npm run build` 
- Lint: `npm run lint`
- Database config: `src/lib/database.ts`