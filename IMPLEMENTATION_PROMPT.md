# arqihive - Implementation Prompt for Next Developer

## 🚨 CRITICAL TASK: Fix Image Generation and Project Management System

You are tasked with implementing critical fixes to the arqihive image generation and project management system. This is a **HIGH PRIORITY** task that requires immediate attention.

## 📋 Context

The current system has fundamental issues that prevent proper project organization, watermark control, and user experience. Users are generating images that bypass project structures, display Gemini AI watermarks instead of custom watermarks, and lack proper organization.

## 🎯 Primary Objectives

### 1. CREATE MAIN DASHBOARD PAGE (CRITICAL)
**File:** `app/dashboard/page.tsx` (CREATE NEW FILE)

**Requirements:**
- Create a main dashboard page at `/dashboard` route
- Display project overview cards with thumbnails
- Show recent renders and activity
- Include quick actions (Create Project, View Gallery, etc.)
- Add navigation to sub-pages (Projects, Billing, Profile)
- Use existing components from `components/billing/` and `components/profile/`

**Design Pattern:**
```typescript
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xl text-gray-600">Manage your projects and renders</p>
        </div>

        {/* Project Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            {/* Project cards */}
          </div>
          
          {/* Quick Actions & Stats */}
          <div className="space-y-6">
            {/* Quick actions */}
            {/* Recent activity */}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 2. FIX PROJECT-BASED IMAGE GENERATION (CRITICAL)
**File:** `app/api/renders/route.ts` (MAJOR UPDATE)

**Requirements:**
- **ENFORCE** projectId requirement for all image generation
- Return error if projectId is missing
- Validate project exists and belongs to user
- Store images in project-specific folders

**Implementation:**
```typescript
// Add project validation
if (!projectId) {
  return NextResponse.json({ 
    success: false, 
    error: 'Project ID is required for image generation' 
  }, { status: 400 });
}

// Validate project exists and belongs to user
const project = await ProjectsDAL.getById(projectId);
if (!project || project.userId !== user.id) {
  return NextResponse.json({ 
    success: false, 
    error: 'Invalid project ID' 
  }, { status: 400 });
}
```

### 3. ADD PROJECT SELECTION TO CONTROL BAR (CRITICAL)
**File:** `components/engines/control-bar.tsx` (MAJOR UPDATE)

**Requirements:**
- Add project selection dropdown at the top
- Make project selection **REQUIRED** before generation
- Add public/private visibility toggle
- Show project context in UI

**Implementation:**
```typescript
// Add to state
const [selectedProject, setSelectedProject] = useState<string>('');
const [isPublic, setIsPublic] = useState(false);

// Add project selection UI
<div className="space-y-2">
  <Label className="text-sm font-medium">Project</Label>
  <Select value={selectedProject} onValueChange={setSelectedProject}>
    <SelectTrigger>
      <SelectValue placeholder="Select a project" />
    </SelectTrigger>
    <SelectContent>
      {projects.map((project) => (
        <SelectItem key={project.id} value={project.id}>
          {project.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

// Add visibility toggle
<div className="space-y-2">
  <Label className="text-sm font-medium">Visibility</Label>
  <div className="flex items-center space-x-2">
    <Switch
      id="public"
      checked={isPublic}
      onCheckedChange={setIsPublic}
    />
    <Label htmlFor="public">Make public (appears in gallery)</Label>
  </div>
</div>

// Update generate function
const handleGenerate = async () => {
  if (!selectedProject) {
    setError('Please select a project');
    return;
  }
  
  // ... rest of generation logic with projectId: selectedProject
};
```

### 4. IMPLEMENT CUSTOM WATERMARK SYSTEM (HIGH PRIORITY)
**File:** `lib/services/image-generation.ts` (MAJOR UPDATE)

**Requirements:**
- Add watermark overlay to generated images
- Remove Gemini AI watermark
- Support custom watermark images
- Maintain image quality

**Implementation:**
```typescript
// Add watermark processing
private async addCustomWatermark(imageData: string): Promise<string> {
  // Use Canvas API or Sharp to overlay watermark
  // Return watermarked image as base64
}

// Update generateImage method
const watermarkedImageData = await this.addCustomWatermark(result.data.imageData);
```

### 5. FIX STORAGE ORGANIZATION (HIGH PRIORITY)
**File:** `lib/services/storage.ts` (MAJOR UPDATE)

**Requirements:**
- Organize images by project slug
- Use project-based folder structure
- Generate project slugs automatically

**Implementation:**
```typescript
// Update uploadFile method
static async uploadFile(
  file: File | Buffer,
  bucket: string,
  projectSlug: string, // Add project slug
  userId: string,
  fileName?: string
): Promise<{ url: string; key: string }> {
  const filePath = `projects/${projectSlug}/${userId}/${finalFileName}`;
  // ... rest of implementation
}
```

### 6. ADD PROJECT SLUGS TO DATABASE (MEDIUM PRIORITY)
**File:** `lib/db/schema.ts` (MINOR UPDATE)

**Requirements:**
- Add `slug` field to projects table
- Generate URL-friendly slugs
- Ensure uniqueness

**Implementation:**
```typescript
// Add to projects table
slug: text('slug').notNull().unique(),
```

### 7. UPDATE PROJECT DAL (MEDIUM PRIORITY)
**File:** `lib/dal/projects.ts` (MINOR UPDATE)

**Requirements:**
- Add slug generation
- Update create method
- Add slug validation

**Implementation:**
```typescript
// Add slug generation
private static generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Update create method
static async create(project: NewProject): Promise<Project> {
  const slug = this.generateSlug(project.name);
  const [newProject] = await db.insert(projects).values({
    ...project,
    slug
  }).returning();
  return newProject;
}
```

## 🔧 Implementation Steps

### Step 1: Create Dashboard Page
1. Create `app/dashboard/page.tsx`
2. Add project overview components
3. Include quick actions and navigation
4. Test routing and navigation

### Step 2: Fix Image Generation Flow
1. Update `/api/renders` to require projectId
2. Add project validation
3. Update storage organization
4. Test image generation with projects

### Step 3: Update Control Bar
1. Add project selection dropdown
2. Add visibility toggle
3. Make project selection required
4. Update generation logic

### Step 4: Implement Watermark System
1. Add watermark processing to ImageGenerationService
2. Create watermark overlay function
3. Test watermark quality and positioning
4. Ensure Gemini watermark removal

### Step 5: Update Storage and Database
1. Add project slugs to schema
2. Update storage service
3. Update project DAL
4. Test project-based organization

## 🧪 Testing Requirements

### Unit Tests
- Test project validation in API
- Test watermark processing
- Test storage organization
- Test project slug generation

### Integration Tests
- Test complete image generation flow
- Test project-based organization
- Test dashboard functionality
- Test control bar interactions

### User Acceptance Tests
- Users can access dashboard
- Users must select project before generation
- Images are properly organized
- Watermarks are applied correctly
- Public images appear in gallery

## 📁 Files to Modify

### Critical Files (Must Modify)
- `app/dashboard/page.tsx` (CREATE)
- `components/engines/control-bar.tsx` (MAJOR UPDATE)
- `app/api/renders/route.ts` (MAJOR UPDATE)
- `lib/services/image-generation.ts` (MAJOR UPDATE)
- `lib/services/storage.ts` (MAJOR UPDATE)

### Supporting Files (Should Modify)
- `lib/db/schema.ts` (ADD SLUG FIELD)
- `lib/dal/projects.ts` (ADD SLUG GENERATION)
- `lib/hooks/use-image-generation.ts` (ADD PROJECT VALIDATION)
- `components/gallery-grid.tsx` (UPDATE VISIBILITY)

### Optional Files (Nice to Have)
- `lib/types/index.ts` (ADD NEW TYPES)
- `README.md` (UPDATE DOCUMENTATION)
- `drizzle/` (ADD MIGRATION)

## ⚠️ Critical Notes

### Breaking Changes
- Image generation now requires projectId
- Storage paths will change
- Control bar UI will change significantly

### Backward Compatibility
- Existing projects will need slug generation
- Existing images may need reorganization
- Users will need to select projects for new generations

### Performance Considerations
- Watermark processing adds latency
- Project validation adds database queries
- Storage organization may increase complexity

## 🎯 Success Criteria

### Must Have
- ✅ Dashboard page accessible at `/dashboard`
- ✅ Project selection required for image generation
- ✅ Images organized by project
- ✅ Custom watermarks applied
- ✅ Public/private toggle working

### Should Have
- ✅ Project slugs generated automatically
- ✅ Gallery integration working
- ✅ Free plan users see public images
- ✅ Error handling for missing projects

### Nice to Have
- ✅ Watermark customization options
- ✅ Project management features
- ✅ Analytics and monitoring
- ✅ Performance optimizations

## 🚀 Getting Started

1. **Read the audit report** (`AUDIT_REPORT.md`) for full context
2. **Start with dashboard page** - this is the most visible change
3. **Fix image generation flow** - this is the most critical functionality
4. **Update control bar** - this affects user experience
5. **Implement watermark system** - this affects brand consistency
6. **Test thoroughly** - this affects system reliability

## 📞 Support

If you encounter issues or need clarification:
1. Review the audit report for detailed analysis
2. Check existing code patterns in the codebase
3. Follow the established architecture (Database → DAL → Services → Actions → Hooks → Components)
4. Ensure all changes follow the user's coding standards

## 🎉 Expected Outcome

After implementation, users should be able to:
- Access a proper dashboard for project management
- Generate images only within project context
- See custom watermarks instead of Gemini watermarks
- Control image visibility (public/private)
- Have images properly organized by project
- Experience a more professional and organized system

**Remember:** This is a critical system that affects user experience and brand consistency. Take your time to implement it correctly and test thoroughly.

---

**Priority:** CRITICAL  
**Estimated Time:** 2-3 days  
**Complexity:** High  
**Impact:** High  
**Status:** Ready for Implementation
