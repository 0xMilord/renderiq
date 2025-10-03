# Chain Auto-Select and Iterate Feature

## Summary
Implemented two critical features for the version control system:
1. **Auto-select project when on a chain page**
2. **Iterate button to use generated image as next input**

## Changes Made

### 1. Auto-Select Project from Chain

**Problem:** When navigating to `/engine/exterior-ai/{chainId}`, the project dropdown was empty and user had to manually select project.

**Solution:**
- Added `useRenderChain` hook to `ControlBar` to fetch chain data
- Created `useEffect` that automatically selects the project when chain is loaded
- Checks if chain exists and has `projectId`, then sets it as `selectedProjectId`

**Files Modified:**
- `components/engines/control-bar.tsx`:
  - Added `useRenderChain` import
  - Added chain fetching: `const { chain } = useRenderChain(chainId);`
  - Added auto-select effect:
    ```typescript
    useEffect(() => {
      if (chain && chain.projectId && !selectedProjectId) {
        console.log('🔗 ControlBar: Auto-selecting project from chain:', chain.projectId);
        setSelectedProjectId(chain.projectId);
      }
    }, [chain, selectedProjectId]);
    ```

### 2. Iterate Button

**Problem:** No way to use a generated image as input for the next iteration.

**Solution:**
- Added "Iterate" button to `RenderPreview` next to Download/Share
- Button fetches the current generated image and converts it to a File
- Sets the File as the uploaded image in `ControlBar`
- User can immediately generate with the previous output as input

**Files Modified:**

#### `components/engines/render-preview.tsx`:
- Added `onIterate?: (imageUrl: string) => void` prop
- Added Iterate button with RefreshCw icon:
  ```typescript
  {onIterate && (
    <Button 
      variant="default" 
      size="sm" 
      onClick={() => {
        if (result?.imageUrl) {
          onIterate(result.imageUrl);
        }
      }}
    >
      <RefreshCw className="h-4 w-4 mr-1" />
      Iterate
    </Button>
  )}
  ```

#### `components/engine-layout.tsx`:
- Added `iterateImageUrl` state to track image URL for iteration
- Added `handleIterate` callback:
  ```typescript
  const handleIterate = (imageUrl: string) => {
    console.log('🔄 EngineLayout: Iterate requested with image:', imageUrl);
    setIterateImageUrl(imageUrl);
  };
  ```
- Passed `iterateImageUrl` to both ControlBar instances (mobile and desktop)
- Passed `handleIterate` to RenderPreview

#### `components/engines/control-bar.tsx`:
- Added `iterateImageUrl?: string | null` prop
- Added useEffect to convert URL to File:
  ```typescript
  useEffect(() => {
    if (iterateImageUrl) {
      const loadIterateImage = async () => {
        try {
          const response = await fetch(iterateImageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'iterate-image.jpg', { type: 'image/jpeg' });
          setUploadedFile(file);
          console.log('✅ ControlBar: Iterate image loaded as file');
        } catch (error) {
          console.error('❌ ControlBar: Failed to load iterate image:', error);
        }
      };
      loadIterateImage();
    }
  }, [iterateImageUrl]);
  ```

## User Flow

### Auto-Select Flow:
1. User navigates to `/engine/exterior-ai/{chainId}`
2. `EngineLayout` passes `chainId` to `ControlBar`
3. `ControlBar` fetches chain data using `useRenderChain(chainId)`
4. When chain loads, `projectId` is automatically selected
5. Project dropdown shows correct project without manual selection

### Iterate Flow:
1. User generates an image
2. Image appears in `RenderPreview` with "Iterate" button
3. User clicks "Iterate" button
4. `RenderPreview` calls `onIterate(imageUrl)`
5. `EngineLayout` receives callback, sets `iterateImageUrl` state
6. `ControlBar` receives `iterateImageUrl` prop
7. `ControlBar` fetches image, converts to File, sets as `uploadedFile`
8. Image preview appears in upload section
9. User adjusts prompt and generates next iteration

## Benefits

1. **Improved UX**: No manual project selection needed when working with chains
2. **Iterative Workflow**: Easy to refine images through multiple iterations
3. **Context Preservation**: Each iteration stays in the same chain automatically
4. **Seamless Integration**: Works naturally with existing version control system

## Testing

Test both features:
1. Navigate to `/engine/exterior-ai` → select/create chain
2. Verify project is auto-selected when chain page loads
3. Generate an image
4. Click "Iterate" button
5. Verify image appears in upload section
6. Adjust prompt and generate again
7. Verify new render is added to same chain

## Console Logs

Key logs to watch:
- `🔗 ControlBar: Auto-selecting project from chain:` - Project auto-selected
- `🔄 EngineLayout: Iterate requested with image:` - Iterate button clicked
- `🔄 ControlBar: Iterate image URL received:` - URL received in ControlBar
- `✅ ControlBar: Iterate image loaded as file` - Image converted to File

## Notes

- Iterate button only appears when `onIterate` callback is provided
- Auto-select only happens if no project is currently selected
- Image conversion handles fetch errors gracefully
- Works with both mobile and desktop layouts

