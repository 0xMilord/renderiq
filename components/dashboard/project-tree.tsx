'use client';

import {
  syncDataLoaderFeature,
  selectionFeature,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { FolderIcon, FolderOpenIcon, MessageSquare } from "lucide-react";
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tree, TreeItem, TreeItemLabel } from "@/components/tree";
import type { Project, RenderChain } from '@/lib/db/schema';

interface ProjectTreeItem {
  name: string;
  type: 'project' | 'chain';
  projectId?: string;
  projectSlug?: string;
  chainId?: string;
  chainPath?: string;
  children?: string[];
}

interface ProjectTreeProps {
  projects: Project[];
  chains: Array<RenderChain & { projectId: string }>;
}

export function ProjectTree({ projects, chains }: ProjectTreeProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Build tree structure: projects as folders, chains as files
  const items: Record<string, ProjectTreeItem> = {};
  
  // Create a map of chains by project
  const chainsByProject = chains.reduce((acc, chain) => {
    if (!acc[chain.projectId]) {
      acc[chain.projectId] = [];
    }
    acc[chain.projectId].push(chain);
    return acc;
  }, {} as Record<string, Array<RenderChain & { projectId: string }>>);

  // Add virtual root
  const projectIds = projects.map(project => `project-${project.id}`);
  items['root'] = {
    name: 'Projects',
    type: 'project',
    children: projectIds.length > 0 ? projectIds : undefined,
  };

  // Add projects as folders
  projects.forEach((project) => {
    const projectChains = chainsByProject[project.id] || [];
    const chainIds = projectChains.map(chain => `chain-${chain.id}`);
    
    items[`project-${project.id}`] = {
      name: project.name,
      type: 'project',
      projectId: project.id,
      projectSlug: project.slug,
      children: chainIds.length > 0 ? chainIds : undefined,
    };
  });

  // Add chains as files
  chains.forEach((chain) => {
    const project = projects.find(p => p.id === chain.projectId);
    const chainPath = project ? `/project/${project.slug}/chain/${chain.id}` : '#';
    items[`chain-${chain.id}`] = {
      name: chain.name,
      type: 'chain',
      chainId: chain.id,
      chainPath,
      projectId: chain.projectId,
    };
  });

  // Get expanded projects from URL or default
  const getExpandedProjects = () => {
    const expanded: string[] = [];
    projects.forEach((project) => {
      if (pathname.includes(`/dashboard/projects/${project.slug}`) || 
          pathname.includes(`/project/${project.slug}`)) {
        expanded.push(`project-${project.id}`);
      }
    });
    return expanded;
  };

  const tree = useTree<ProjectTreeItem>({
    dataLoader: {
      getChildren: (itemId) => items[itemId]?.children ?? [],
      getItem: (itemId) => items[itemId],
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
    ],
    getItemName: (item) => item.getItemData().name,
    indent: 16,
    initialState: {
      expandedItems: ['root', ...getExpandedProjects()],
    },
    isItemFolder: (item) => item.getItemData()?.type === 'project',
    rootItemId: 'root',
  });

  const handleItemClick = (item: ProjectTreeItem) => {
    if (item.type === 'project' && item.projectSlug) {
      router.push(`/dashboard/projects/${item.projectSlug}`);
    } else if (item.type === 'chain' && item.chainPath) {
      router.push(item.chainPath);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <Tree indent={16} tree={tree} className="w-full">
        {tree.getItems()
          .filter(item => item.getId() !== 'root') // Hide root item
          .map((item) => {
            const itemData = item.getItemData();
            const isProject = itemData.type === 'project';
            const isActive = isProject && itemData.projectSlug
              ? pathname.includes(`/dashboard/projects/${itemData.projectSlug}`) || pathname.includes(`/project/${itemData.projectSlug}`)
              : pathname === itemData.chainPath;
            
            return (
              <TreeItem item={item} key={item.getId()} asChild>
                <Link
                  href={
                    isProject && itemData.projectSlug
                      ? `/dashboard/projects/${itemData.projectSlug}`
                      : itemData.chainPath || '#'
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    handleItemClick(itemData);
                  }}
                >
                  <TreeItemLabel
                    className={cn(
                      "w-full cursor-pointer",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {isProject ? (
                        item.isExpanded() ? (
                          <FolderOpenIcon className="size-4 text-primary" />
                        ) : (
                          <FolderIcon className="size-4 text-primary" />
                        )
                      ) : (
                        <MessageSquare className="size-4 text-muted-foreground" />
                      )}
                      {item.getItemName()}
                    </span>
                  </TreeItemLabel>
                </Link>
              </TreeItem>
            );
          })}
      </Tree>
    </div>
  );
}

