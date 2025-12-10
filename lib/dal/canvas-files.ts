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
    
    // ✅ OPTIMIZED: Let database handle uniqueness constraint instead of pre-check
    // This eliminates one query and handles race conditions better
    try {
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
    } catch (error: any) {
      // Handle unique constraint violation (PostgreSQL error code 23505)
      if (error?.code === '23505' || error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
        throw new Error(`Canvas file with slug "${data.slug}" already exists in this project`);
      }
      throw error;
    }
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
    // ✅ OPTIMIZED: Uses partial index idx_canvas_files_project_active_updated when filtering active files
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
    // Uses: idx_canvas_files_project_active_updated (partial composite index) when includeArchived=false
  }

  static async getByUser(userId: string, includeArchived = false) {
    // ✅ OPTIMIZED: Uses partial index idx_canvas_files_user_active_updated when filtering active files
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
    // Uses: idx_canvas_files_user_active_updated (partial composite index) when includeArchived=false
  }

  static async update(id: string, data: UpdateCanvasFileData) {
    // ✅ OPTIMIZED: Let database handle uniqueness constraint instead of pre-check
    // This eliminates 2 sequential queries and handles race conditions better
    try {
      const [updated] = await db
        .update(canvasFiles)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(canvasFiles.id, id))
        .returning();

      if (!updated) {
        return null;
      }

      return updated;
    } catch (error: any) {
      // Handle unique constraint violation (PostgreSQL error code 23505)
      if (error?.code === '23505' || error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
        throw new Error(`Canvas file with slug "${data.slug}" already exists in this project`);
      }
      throw error;
    }
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

  /**
   * ✅ NEW: Duplicate canvas file with its graph
   * Creates a new file with a copy of the graph
   */
  static async duplicate(fileId: string, newName?: string) {
    logger.log('📋 Duplicating canvas file:', fileId);
    
    try {
      // Get original file with graph
      const original = await this.getFileWithGraph(fileId);
      
      if (!original || !original.file) {
        throw new Error('Canvas file not found');
      }

      // Generate new slug
      const baseSlug = newName 
        ? newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 50)
        : `${original.file.slug}-copy`;
      
      // Ensure unique slug
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await this.getBySlug(original.file.projectId, slug);
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
        if (counter > 100) {
          slug = `${baseSlug}-${Date.now()}`;
          break;
        }
      }

      // Create new file
      const [duplicatedFile] = await db
        .insert(canvasFiles)
        .values({
          projectId: original.file.projectId,
          userId: original.file.userId,
          name: newName || `${original.file.name} (Copy)`,
          slug,
          description: original.file.description,
          thumbnailUrl: original.file.thumbnailUrl,
          thumbnailKey: original.file.thumbnailKey,
          version: 1,
          isActive: true,
          isArchived: false,
          metadata: original.file.metadata,
        })
        .returning();

      // Duplicate graph if it exists
      if (original.graph) {
        await db
          .insert(canvasGraphs)
          .values({
            fileId: duplicatedFile.id,
            projectId: duplicatedFile.projectId,
            userId: duplicatedFile.userId,
            nodes: original.graph.nodes,
            connections: original.graph.connections,
            viewport: original.graph.viewport,
            version: 1,
          });
      }

      logger.log('✅ Canvas file duplicated:', duplicatedFile.id);
      return duplicatedFile;
    } catch (error) {
      logger.error('Error duplicating canvas file:', error);
      throw error;
    }
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
    // ✅ OPTIMIZED: Use LEFT JOIN to fetch file and graph in a single query
    // This reduces from 2 sequential queries to 1 query
    const [result] = await db
      .select({
        file: canvasFiles,
        graph: canvasGraphs,
      })
      .from(canvasFiles)
      .leftJoin(canvasGraphs, eq(canvasFiles.id, canvasGraphs.fileId))
      .where(eq(canvasFiles.id, fileId))
      .limit(1);

    if (!result || !result.file) {
      return null;
    }

    return {
      file: result.file,
      graph: result.graph || null,
    };
  }

  static async getFileWithGraphBySlug(projectId: string, slug: string) {
    // ✅ OPTIMIZED: Use LEFT JOIN to fetch file and graph in a single query
    // This reduces from 2 sequential queries to 1 query
    const [result] = await db
      .select({
        file: canvasFiles,
        graph: canvasGraphs,
      })
      .from(canvasFiles)
      .leftJoin(canvasGraphs, eq(canvasFiles.id, canvasGraphs.fileId))
      .where(
        and(
          eq(canvasFiles.projectId, projectId),
          eq(canvasFiles.slug, slug)
        )
      )
      .limit(1);

    if (!result || !result.file) {
      return null;
    }

    return {
      file: result.file,
      graph: result.graph || null,
    };
  }
}

