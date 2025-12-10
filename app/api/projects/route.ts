import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { ProjectsDAL } from '@/lib/dal/projects';
import { logger } from '@/lib/utils/logger';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const projects = await ProjectsDAL.getByUserId(user.id);
    
    return NextResponse.json({
      success: true,
      data: projects
    });
  } catch (error) {
    logger.error('❌ Projects API: Error fetching projects:', error);
    
    Sentry.setContext('projects_api', {
      route: '/api/projects',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch projects' 
      },
      { status: 500 }
    );
  }
}

