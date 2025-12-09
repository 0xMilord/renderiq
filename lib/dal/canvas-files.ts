import { db } from '@/lib/db';
import { canvasFiles, canvasFileVersions, canvasGraphs } from '@/lib/db/schema';
import { eq, and, desc, sql, or, isNull } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import type { NewCanvasFile, NewCanvasFileVersion } from '@/lib/db/schema';

export interface CreateCanvasFileData {
  projectId: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCanvasFileData {
  name?: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  isActive?: boolean;
  isArchived?: boolean;
  metadata?: Record<string, any>;
}

export class CanvasFilesDAL {
  // ============================================================================
  // CANVAS FILES (Figma-like: Project → File → Canvas Graph)
  // ============================================================================

  static async create(data: CreateCanvasFileData) {
    logger.log('📝 Creating canvas file:', { name: data.name, projectId: data.projectId });
    
    // Check if slug already exists for this project
    const existing = await this.getBySlug(data.projectId, data.slug);
    if (existing) {
      throw new Error(`Canvas file with slug "${data.slug}" already exists in this project`);
    }

    const [file] = await db
      .insert(canvasFiles)
      .values({
        projectId: data.projectId,
        userId: data.userId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        thumbnailKey: data.thumbnailKey,
        metadata: data.metadata,
        version: 1,
        isActive: true,
        isArchived: false,
      })
      .returning();

    logger.log('✅ Canvas file created:', file.id);
    return file;
  }

  static async getById(id: string) {
    const [file] = await db
      .select()
      .from(canvasFiles)
      .where(eq(canvasFiles.id, id))
      .limit(1);

    return file || null;
  }

  static async getBySlug(projectId: string, slug: string) {
    const [file] = await db
      .select()
      .from(canvasFiles)
      .where(
        and(
          eq(canvasFiles.projectId, projectId),
          eq(canvasFiles.slug, slug)
        )
      )
      .limit(1);

    return file || null;
  }

  static async getByProject(projectId: string, includeArchived = false) {
    const whereCondition = includeArchived
      ? eq(canvasFiles.projectId, projectId)
      : and(
          eq(canvasFiles.projectId, projectId),
          eq(canvasFiles.isActive, true),
          eq(canvasFiles.isArchived, false)
        );

    return await db
      .select()
      .from(canvasFiles)
      .where(whereCondition)
      .orderBy(desc(canvasFiles.updatedAt));
  }

  static async getByUser(userId: string, includeArchived = false) {
    const whereCondition = includeArchived
      ? eq(canvasFiles.userId, userId)
      : and(
          eq(canvasFiles.userId, userId),
          eq(canvasFiles.isActive, true),
          eq(canvasFiles.isArchived, false)
        );

    return await db
      .select()
      .from(canvasFiles)
      .where(whereCondition)
      .orderBy(desc(canvasFiles.updatedAt));
  }

  static async update(id: string, data: UpdateCanvasFileData) {
    // If updating slug, check for conflicts
    if (data.slug) {
      const [file] = await db
        .select()
        .from(canvasFiles)
        .where(eq(canvasFiles.id, id))
        .limit(1);

      if (file) {
        const existing = await this.getBySlug(file.projectId, data.slug);
        if (existing && existing.id !== id) {
          throw new Error(`Canvas file with slug "${data.slug}" already exists in this project`);
        }
      }
    }

    const [updated] = await db
      .update(canvasFiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(canvasFiles.id, id))
      .returning();

    return updated || null;
  }

  static async delete(id: string) {
    // Soft delete by archiving
    await db
      .update(canvasFiles)
      .set({
        isActive: false,
        isArchived: true,
        updatedAt: new Date(),
      })
      .where(eq(canvasFiles.id, id));
  }

  static async incrementVersion(id: string) {
    const [updated] = await db
      .update(canvasFiles)
      .set({
        version: sql`${canvasFiles.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(canvasFiles.id, id))
      .returning();

    return updated || null;
  }

  // ============================================================================
  // CANVAS FILE VERSIONS
  // ============================================================================

  static async createVersion(data: {
    fileId: string;
    version: number;
    graphId?: string;
    name?: string;
    description?: string;
    createdBy?: string;
  }) {
    const [fileVersion] = await db
      .insert(canvasFileVersions)
      .values({
        fileId: data.fileId,
        version: data.version,
        graphId: data.graphId,
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
      })
      .returning();

    return fileVersion;
  }

  static async getVersionsByFile(fileId: string, limit?: number) {
    const query = db
      .select()
      .from(canvasFileVersions)
      .where(eq(canvasFileVersions.fileId, fileId))
      .orderBy(desc(canvasFileVersions.version));

    return limit ? await query.limit(limit) : await query;
  }

  static async getVersionByFileAndVersion(fileId: string, version: number) {
    const [fileVersion] = await db
      .select()
      .from(canvasFileVersions)
      .where(
        and(
          eq(canvasFileVersions.fileId, fileId),
          eq(canvasFileVersions.version, version)
        )
      )
      .limit(1);

    return fileVersion || null;
  }

  static async getLatestVersion(fileId: string) {
    const [fileVersion] = await db
      .select()
      .from(canvasFileVersions)
      .where(eq(canvasFileVersions.fileId, fileId))
      .orderBy(desc(canvasFileVersions.version))
      .limit(1);

    return fileVersion || null;
  }

  // ============================================================================
  // CANVAS FILE WITH GRAPH
  // ============================================================================

  static async getFileWithGraph(fileId: string) {
    const [file] = await db
      .select()
      .from(canvasFiles)
      .where(eq(canvasFiles.id, fileId))
      .limit(1);

    if (!file) {
      return null;
    }

    // Get associated graph (if exists)
    const [graph] = await db
      .select()
      .from(canvasGraphs)
      .where(eq(canvasGraphs.fileId, fileId))
      .limit(1);

    return {
      file,
      graph: graph || null,
    };
  }

  static async getFileWithGraphBySlug(projectId: string, slug: string) {
    const file = await this.getBySlug(projectId, slug);
    if (!file) {
      return null;
    }

    // Get associated graph (if exists)
    const [graph] = await db
      .select()
      .from(canvasGraphs)
      .where(eq(canvasGraphs.fileId, file.id))
      .limit(1);

    return {
      file,
      graph: graph || null,
    };
  }
}

