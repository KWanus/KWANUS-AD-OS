# PHASE 1 PRISMA SCHEMA

Use PostgreSQL.

Recommended minimum schema:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Project {
  id        String      @id @default(cuid())
  name      String
  type      ProjectType
  createdAt DateTime    @default(now())
  scans     ScanResult[]
}

model ScanResult {
  id          String      @id @default(cuid())
  mode        ScanMode
  title       String
  payloadJson Json
  createdAt   DateTime    @default(now())
  projectId   String?
  project     Project?    @relation(fields: [projectId], references: [id])
}

enum ProjectType {
  product
  business
}

enum ScanMode {
  product
  business
}
```

If a placeholder User model already exists, it may remain, but Phase 1 must include Project and ScanResult.
