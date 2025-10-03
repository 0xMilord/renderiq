import { db } from '@/lib/db';
import { renders } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface CreateRenderData {
  projectId?: string | null;
  userId: string;
  type: 'image' | 'video';
  prompt: string;
  settings: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface UpdateRenderData {
  outputUrl?: string;
  outputKey?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  processingTime?: number;
}

export class RendersDAL {
  static async create(data: CreateRenderData) {
    console.log('📝 Creating render record:', data);
    
    const [render] = await db
      .insert(renders)
      .values({
        projectId: data.projectId,
        userId: data.userId,
        type: data.type,
        prompt: data.prompt,
        settings: data.settings,
        status: data.status,
      })
      .returning();

    console.log('✅ Render record created:', render.id);
    return render;
  }

  static async getById(id: string) {
    console.log('🔍 Fetching render by ID:', id);
    
    const [render] = await db
      .select()
      .from(renders)
      .where(eq(renders.id, id))
      .limit(1);

    return render;
  }

  static async getByUser(userId: string, projectId?: string | null) {
    console.log('🔍 Fetching renders for user:', userId, 'project:', projectId);
    
    const whereCondition = projectId 
      ? and(eq(renders.userId, userId), eq(renders.projectId, projectId))
      : eq(renders.userId, userId);

    const userRenders = await db
      .select()
      .from(renders)
      .where(whereCondition)
      .orderBy(desc(renders.createdAt));

    console.log(`✅ Found ${userRenders.length} renders for user`);
    return userRenders;
  }

  static async updateStatus(id: string, status: 'pending' | 'processing' | 'completed' | 'failed', errorMessage?: string) {
    console.log('🔄 Updating render status:', { id, status, errorMessage });
    
    const [updatedRender] = await db
      .update(renders)
      .set({
        status,
        errorMessage: errorMessage || null,
        updatedAt: new Date(),
      })
      .where(eq(renders.id, id))
      .returning();

    console.log('✅ Render status updated:', updatedRender.id);
    return updatedRender;
  }

  static async updateOutput(
    id: string, 
    outputUrl: string, 
    outputKey: string, 
    status: 'completed' | 'failed',
    processingTime?: number
  ) {
    console.log('🔄 Updating render output:', { id, outputUrl, status, processingTime });
    
    const [updatedRender] = await db
      .update(renders)
      .set({
        outputUrl,
        outputKey,
        status,
        processingTime: processingTime || null,
        updatedAt: new Date(),
      })
      .where(eq(renders.id, id))
      .returning();

    console.log('✅ Render output updated:', updatedRender.id);
    return updatedRender;
  }

  static async delete(id: string) {
    console.log('🗑️ Deleting render:', id);
    
    await db
      .delete(renders)
      .where(eq(renders.id, id));

    console.log('✅ Render deleted:', id);
  }

  static async getByStatus(status: 'pending' | 'processing' | 'completed' | 'failed') {
    console.log('🔍 Fetching renders by status:', status);
    
    const rendersByStatus = await db
      .select()
      .from(renders)
      .where(eq(renders.status, status))
      .orderBy(desc(renders.createdAt));

    console.log(`✅ Found ${rendersByStatus.length} renders with status: ${status}`);
    return rendersByStatus;
  }
}
