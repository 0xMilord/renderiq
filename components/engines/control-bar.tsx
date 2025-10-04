'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useCredits } from '@/lib/hooks/use-credits';
import { useImageGeneration } from '@/lib/hooks/use-image-generation';
import { useOptimisticGeneration } from '@/lib/hooks/use-optimistic-generation';
import { useFormPersistence } from '@/lib/hooks/use-form-persistence';
import { OptimisticRenderPreview } from './optimistic-render-preview';
// import { GenerationProgress } from './generation-progress'; // Removed - handled by layout
import { useProjects } from '@/lib/hooks/use-projects';
import { useRenderChain } from '@/lib/hooks/use-render-chain';
import { 
  Upload, 
  X, 
  AlertCircle, 
  Image as ImageIcon, 
  Video, 
  Sparkles,
  Plus
} from 'lucide-react';
import { 
  FaBuilding, 
  FaDesktop, 
  FaMoon, 
  FaSnowflake, 
  FaCloudRain, 
  FaPencilAlt, 
  FaPalette, 
  FaImage,
  FaCubes,
  FaCamera,
  FaPencilRuler,
  FaProjectDiagram,
  FaHardHat,
  FaSquare,
  FaTv,
  FaTabletAlt
} from 'react-icons/fa';
import { Slider } from '@/components/ui/slider';
import { useEngineStore } from '@/lib/stores/engine-store';
import { Render } from '@/lib/types/render';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { CreateProjectModal } from '@/components/projects/create-project-modal';

export interface AutoFillData {
  prompt: string;
  style: string;
  quality: string;
  aspectRatio: string;
  renderMode?: string;
  negativePrompt?: string;
  imageType?: string;
  imageUrl?: string;
}

interface ControlBarProps {
  engineType: 'exterior' | 'interior' | 'furniture' | 'site-plan';
  chainId?: string;
  iterateImageUrl?: string | null;
  autoFillTrigger?: AutoFillData | null;
  onResult?: (result: unknown) => void;
  onGenerationStart?: () => void;
  onProjectChange?: (projectId: string) => void;
  onVersionSelect?: (render: Render) => void;
  onClearRender?: () => void;
  chainRenders?: Render[];
  selectedRenderId?: string;
  isMobile?: boolean;
}

const styles = [
  { value: 'none', label: 'None', icon: X, color: 'text-muted-foreground' },
  { value: 'realistic', label: 'Realistic', icon: FaBuilding, color: 'text-primary' },
  { value: 'cgi', label: 'CGI', icon: FaDesktop, color: 'text-primary' },
  { value: 'night', label: 'Night', icon: FaMoon, color: 'text-primary' },
  { value: 'snow', label: 'Snow', icon: FaSnowflake, color: 'text-primary' },
  { value: 'rain', label: 'Rain', icon: FaCloudRain, color: 'text-primary' },
  { value: 'sketch', label: 'Sketch', icon: FaPencilAlt, color: 'text-primary' },
  { value: 'watercolor', label: 'Watercolor', icon: FaPalette, color: 'text-primary' },
  { value: 'illustration', label: 'Illustration', icon: FaImage, color: 'text-primary' },
];


const aspectRatios = [
  { value: '1:1', label: 'Square', icon: FaSquare, color: 'text-primary', description: '1:1' },
  { value: '16:9', label: 'Wide', icon: FaTv, color: 'text-primary', description: '16:9' },
  { value: '4:3', label: 'Standard', icon: FaTabletAlt, color: 'text-primary', description: '4:3' },
  { value: '3:2', label: 'Photo', icon: FaCamera, color: 'text-primary', description: '3:2' },
];

const imageTypes = [
  { value: '3d-mass', label: '3D Mass', icon: FaCubes, color: 'text-primary' },
  { value: 'photo', label: 'Photo', icon: FaCamera, color: 'text-primary' },
  { value: 'drawing', label: 'Drawing', icon: FaPencilRuler, color: 'text-primary' },
  { value: 'wireframe', label: 'Wireframe', icon: FaProjectDiagram, color: 'text-primary' },
  { value: 'construction', label: 'Build', icon: FaHardHat, color: 'text-primary' },
];

export function ControlBar({ engineType, chainId: initialChainId, iterateImageUrl, autoFillTrigger, onResult, onGenerationStart, onProjectChange, onVersionSelect, onClearRender, chainRenders: externalChainRenders, selectedRenderId: externalSelectedRenderId, isMobile = false }: ControlBarProps) {
  console.log('🎛️ ControlBar mounted with initialChainId:', initialChainId);
  // State - must be declared before hooks that use them
  const [activeTab, setActiveTab] = useState('image');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [renderMode, setRenderMode] = useState('exact');
  const [renderSpeed, setRenderSpeed] = useState('fast');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [imageType, setImageType] = useState('3d-mass');
  const [duration, setDuration] = useState(5);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isPublic, setIsPublic] = useState(true);
  const [chainId, setChainId] = useState<string | undefined>(initialChainId);
  const [addToChain, setAddToChain] = useState(false);
  
  // Slider states for render mode and speed (0-100, 20% increments)
  const [renderModeValue, setRenderModeValue] = useState([0]); // 0 = exact, 100 = creative
  const [renderSpeedValue, setRenderSpeedValue] = useState([0]); // 0 = fast, 100 = best
  
  // Version selection states
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>();
  const [referenceRenderId, setReferenceRenderId] = useState<string | undefined>();
  
  // Seed support states
  const [seed, setSeed] = useState<string>('');
  const [useRandomSeed, setUseRandomSeed] = useState(true);
  
  // Track if we're in "new version" mode to prevent auto-fill
  const [isNewVersionMode, setIsNewVersionMode] = useState(false);
  
  // Create project modal state
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

  // Set chainId from prop - sync with prop changes only
  useEffect(() => {
    console.log('🔍 ControlBar chainId effect triggered:', { 
      initialChainId, 
      currentChainId: chainId
    });
    if (initialChainId) {
      setChainId(initialChainId);
      console.log('📍 Updated chainId state to:', initialChainId);
    } else {
      console.log('⚠️ No initialChainId provided to ControlBar');
    }
  }, [initialChainId, chainId]); // Include chainId in dependencies

  // Sync selected version ID with external prop
  useEffect(() => {
    if (externalSelectedRenderId && externalSelectedRenderId !== selectedVersionId) {
      console.log('🔄 ControlBar: Syncing selected version ID from external:', externalSelectedRenderId);
      setSelectedVersionId(externalSelectedRenderId);
    }
  }, [externalSelectedRenderId, selectedVersionId]);

  // Hooks - using state declared above
  const { credits, refreshCredits, loading: creditsLoading, error: creditsError } = useCredits();
  
  // Debug credits
  console.log('💰 ControlBar: Credits state:', { 
    credits, 
    creditsLoading, 
    creditsError,
    hasCredits: !!credits,
    balance: credits?.balance 
  });

  // Refresh credits on mount to ensure they're loaded
  useEffect(() => {
    if (!credits && !creditsLoading) {
      console.log('🔄 ControlBar: Refreshing credits on mount');
      refreshCredits();
    }
  }, [credits, creditsLoading, refreshCredits]);
  const { generate, reset, isGenerating, result, error } = useImageGeneration();
  const { generate: optimisticGenerate, optimisticRenders, isGenerating: isOptimisticGenerating } = useOptimisticGeneration();
  const { projects, loading: projectsLoading } = useProjects();
  const { chain, renders: internalChainRenders, fetchChain } = useRenderChain(chainId);
  
  // Use external chain renders if provided, otherwise use internal ones
  const chainRenders = externalChainRenders || internalChainRenders;
  
  // Form persistence
  const formState = {
    prompt,
    negativePrompt,
    style: selectedStyle,
    quality: renderSpeed,
    aspectRatio,
    imageType,
    renderMode,
    renderSpeed,
    duration,
    isPublic,
    addToChain,
  };

  const formSetters = {
    setPrompt,
    setNegativePrompt,
    setStyle: setSelectedStyle,
    setQuality: setRenderSpeed,
    setAspectRatio,
    setImageType,
    setRenderMode,
    setRenderSpeed,
    setDuration,
    setIsPublic,
    setAddToChain,
  };

  const { saveFormState, loadFormState } = useFormPersistence(formState, formSetters);

  // Engine store
  const {
    prompt: storePrompt,
    style: storeStyle,
    aspectRatio: storeAspectRatio,
    negativePrompt: storeNegativePrompt,
    imageType: storeImageType,
    uploadedFile: storeUploadedFile,
    setPrompt: setStorePrompt,
    setStyle: setStoreStyle,
    setQuality: setStoreQuality,
    setAspectRatio: setStoreAspectRatio,
    setNegativePrompt: setStoreNegativePrompt,
    setImageType: setStoreImageType,
    setUploadedFile: setStoreUploadedFile,
    autoFill
  } = useEngineStore();
  
  // Debug logging for version selector
  console.log('🔍 ControlBar: Version selector debug:', {
    chainId,
    chainRenders: chainRenders?.length || 0,
    hasChain: !!chain,
    chainRendersData: chainRenders
  });
  
  // Handle version selection with auto-fill
  const handleVersionSelect = async (renderId: string) => {
    console.log('🔄 ControlBar: Version selected from render chain:', renderId);
    console.log('🔄 ControlBar: Available chain renders:', chainRenders?.map(r => ({ id: r.id, status: r.status, hasOutputUrl: !!r.outputUrl })));
    setSelectedVersionId(renderId);
    setIsNewVersionMode(false); // Reset flag when version is selected
    
    const selectedRender = chainRenders?.find(r => r.id === renderId);
    if (!selectedRender) {
      console.error('❌ ControlBar: Selected render not found');
      return;
    }
    
    console.log('📋 ControlBar: Auto-filling form with render data:', selectedRender);
    console.log('📋 ControlBar: Render settings:', selectedRender.settings);
    console.log('📋 ControlBar: Current state before changes:', {
      prompt,
      selectedStyle,
      renderSpeed,
      aspectRatio,
      imageType,
      negativePrompt,
      uploadedFile: !!uploadedFile
    });
    
    // Auto-fill form fields
    if (selectedRender.prompt) {
      console.log('📝 ControlBar: Setting prompt:', selectedRender.prompt);
      setPrompt(selectedRender.prompt);
      setStorePrompt(selectedRender.prompt);
    }
    
    if (selectedRender.settings?.style) {
      console.log('🎨 ControlBar: Setting style:', selectedRender.settings.style);
      setSelectedStyle(selectedRender.settings.style);
      setStoreStyle(selectedRender.settings.style);
    }
    
    if (selectedRender.settings?.quality) {
      const quality = selectedRender.settings.quality;
      const speed = quality === 'high' ? 'best' : 'fast';
      console.log('⚡ ControlBar: Setting quality:', quality, '-> speed:', speed);
      setRenderSpeed(speed);
      setStoreQuality(quality);
      // Update slider value based on quality
      setRenderSpeedValue(quality === 'high' ? [100] : [0]);
    }
    
    if (selectedRender.settings?.aspectRatio) {
      console.log('📐 ControlBar: Setting aspect ratio:', selectedRender.settings.aspectRatio);
      setAspectRatio(selectedRender.settings.aspectRatio);
      setStoreAspectRatio(selectedRender.settings.aspectRatio);
    }
    
    // Add image type handling
    if (selectedRender.settings?.imageType) {
      console.log('🖼️ ControlBar: Setting image type:', selectedRender.settings.imageType);
      setImageType(selectedRender.settings.imageType);
      setStoreImageType(selectedRender.settings.imageType);
    }
    
    // Add negative prompt handling
    if (selectedRender.settings?.negativePrompt) {
      console.log('🚫 ControlBar: Setting negative prompt:', selectedRender.settings.negativePrompt);
      setNegativePrompt(selectedRender.settings.negativePrompt);
      setStoreNegativePrompt(selectedRender.settings.negativePrompt);
    }
    
    // Load the image as uploaded file for preview
    if (selectedRender.outputUrl) {
      try {
        console.log('🖼️ ControlBar: Loading version image:', selectedRender.outputUrl);
        const response = await fetch(selectedRender.outputUrl);
        const blob = await response.blob();
        const file = new File([blob], `version-${selectedRender.id}.jpg`, { type: 'image/jpeg' });
        setUploadedFile(file);
        setStoreUploadedFile(file);
        console.log('✅ ControlBar: Version image loaded as uploaded file');
      } catch (error) {
        console.error('❌ ControlBar: Failed to load version image:', error);
      }
    }
    
    // Auto-fill using engine store
    const autoFillData: AutoFillData = {
      prompt: selectedRender.prompt,
      style: selectedRender.settings?.style || 'realistic',
      quality: selectedRender.settings?.quality || 'standard',
      aspectRatio: selectedRender.settings?.aspectRatio || '16:9',
      renderMode: 'exact', // Default render mode
      imageUrl: selectedRender.outputUrl,
    };
    
    autoFill(autoFillData);
    
    // Notify parent component about version selection for main render area
    if (onVersionSelect) {
      console.log('📢 ControlBar: Notifying parent of version selection:', selectedRender);
      console.log('📢 ControlBar: Calling onVersionSelect with render:', selectedRender);
      onVersionSelect(selectedRender);
      console.log('✅ ControlBar: onVersionSelect called successfully');
    } else {
      console.log('⚠️ ControlBar: onVersionSelect callback not provided');
    }
    
    // Log final state after all changes
    console.log('✅ ControlBar: Version selection complete. Final state:', {
      prompt,
      selectedStyle,
      renderSpeed,
      aspectRatio,
      imageType,
      negativePrompt,
      uploadedFile: !!uploadedFile,
      renderModeValue,
      renderSpeedValue
    });
  };

  // Handle new version button click - clear everything
  const handleNewVersion = () => {
    console.log('🔄 ControlBar: New version button clicked - clearing all form fields');
    setSelectedVersionId(undefined);
    setReferenceRenderId(undefined);
    setIsNewVersionMode(true); // Set flag to prevent auto-fill
    // Clear form state
    setPrompt('');
    setNegativePrompt('');
    setSelectedStyle('realistic');
    setRenderSpeed('fast');
    setAspectRatio('16:9');
    setImageType('3d-mass');
    setUploadedFile(null);
    setPreviewUrl(null);
    setRenderModeValue([0]);
    setRenderSpeedValue([0]);
    // Clear store state
    setStorePrompt('');
    setStoreNegativePrompt('');
    setStoreStyle('realistic');
    setStoreQuality('standard');
    setStoreAspectRatio('16:9');
    setStoreImageType('3d-mass');
    setStoreUploadedFile(null);
    
    // Don't clear main render area - just clear the form
    // The render chain should remain visible
    console.log('🔄 ControlBar: Form cleared, keeping render chain visible');
    
    console.log('✅ ControlBar: Form and render area cleared for new version');
  };
  
  // Sync slider values with existing state
  useEffect(() => {
    setRenderMode(renderModeValue[0] === 0 ? 'exact' : 'creative');
  }, [renderModeValue]);
  
  useEffect(() => {
    const newSpeed = renderSpeedValue[0] === 0 ? 'fast' : 'best';
    console.log('⚡ ControlBar: Render speed changed:', { 
      sliderValue: renderSpeedValue[0], 
      newSpeed, 
      oldSpeed: renderSpeed 
    });
    setRenderSpeed(newSpeed);
    setStoreQuality(newSpeed === 'best' ? 'high' : 'standard');
  }, [renderSpeedValue, renderSpeed]);
  
  // Sync local state with engine store
  useEffect(() => {
    if (storePrompt !== prompt) setPrompt(storePrompt);
  }, [storePrompt, prompt]);
  
  useEffect(() => {
    if (storeStyle !== selectedStyle) setSelectedStyle(storeStyle);
  }, [storeStyle, selectedStyle]);
  
  useEffect(() => {
    if (storeAspectRatio !== aspectRatio) setAspectRatio(storeAspectRatio);
  }, [storeAspectRatio, aspectRatio]);
  
  useEffect(() => {
    if (storeImageType !== imageType) setImageType(storeImageType);
  }, [storeImageType, imageType]);
  
  useEffect(() => {
    if (storeNegativePrompt !== negativePrompt) setNegativePrompt(storeNegativePrompt);
  }, [storeNegativePrompt, negativePrompt]);
  
  useEffect(() => {
    if (storeUploadedFile !== uploadedFile) setUploadedFile(storeUploadedFile);
  }, [storeUploadedFile, uploadedFile]);

  // Auto-select project when chain is loaded
  useEffect(() => {
    if (chain && chain.projectId && !selectedProjectId) {
      console.log('🔗 ControlBar: Auto-selecting project from chain:', chain.projectId);
      setSelectedProjectId(chain.projectId);
    }
  }, [chain, selectedProjectId]);

  // Handle iterate image - convert URL to File
  useEffect(() => {
    if (iterateImageUrl) {
      console.log('🔄 ControlBar: Iterate image URL received:', iterateImageUrl);
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

  // Notify parent when project changes
  useEffect(() => {
    if (selectedProjectId && onProjectChange) {
      onProjectChange(selectedProjectId);
    }
  }, [selectedProjectId, onProjectChange]);

  // Watch for result changes and pass to parent
  useEffect(() => {
    if (result && onResult) {
      console.log('🔄 ControlBar: Result changed, passing to parent:', result);
      console.log('🔄 ControlBar: Result has imageUrl:', !!result.imageUrl);
      console.log('🔄 ControlBar: Result imageUrl value:', result.imageUrl);
      onResult(result);
    }
  }, [result, onResult]);

  // Create preview URL for uploaded file
  useEffect(() => {
    console.log('🖼️ ControlBar: Uploaded file changed:', { 
      hasFile: !!uploadedFile, 
      fileName: uploadedFile?.name,
      fileType: uploadedFile?.type,
      fileSize: uploadedFile?.size
    });
    
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      console.log('🖼️ ControlBar: Created preview URL:', url);
      setPreviewUrl(url);
      setIsNewVersionMode(false); // Reset new version mode when file is uploaded
      return () => {
        console.log('🖼️ ControlBar: Revoking preview URL');
        URL.revokeObjectURL(url);
      };
    } else {
      console.log('🖼️ ControlBar: No uploaded file, clearing preview URL');
      setPreviewUrl(null);
    }
  }, [uploadedFile]);

  // Auto-fill form when trigger changes
  useEffect(() => {
    if (autoFillTrigger) {
      console.log('📋 ControlBar: Auto-filling form with data:', autoFillTrigger);
      
      // Fill prompt
      if (autoFillTrigger.prompt) {
        setPrompt(autoFillTrigger.prompt);
        console.log('✏️ Set prompt:', autoFillTrigger.prompt);
      }
      
      // Fill style
      if (autoFillTrigger.style) {
        setSelectedStyle(autoFillTrigger.style);
        console.log('🎨 Set style:', autoFillTrigger.style);
      }
      
      // Fill quality
      if (autoFillTrigger.quality) {
        setRenderSpeed(autoFillTrigger.quality === 'high' ? 'best' : 'fast');
        console.log('⚡ Set quality:', autoFillTrigger.quality);
      }
      
      // Fill aspect ratio
      if (autoFillTrigger.aspectRatio) {
        setAspectRatio(autoFillTrigger.aspectRatio);
        console.log('📐 Set aspect ratio:', autoFillTrigger.aspectRatio);
      }
      
      // Fill render mode
      if (autoFillTrigger.renderMode) {
        setRenderMode(autoFillTrigger.renderMode);
        console.log('🎯 Set render mode:', autoFillTrigger.renderMode);
      }
      
      // Fill negative prompt
      if (autoFillTrigger.negativePrompt) {
        setNegativePrompt(autoFillTrigger.negativePrompt);
        console.log('🚫 Set negative prompt:', autoFillTrigger.negativePrompt);
      }
      
      // Fill image type
      if (autoFillTrigger.imageType) {
        setImageType(autoFillTrigger.imageType);
        console.log('🖼️ Set image type:', autoFillTrigger.imageType);
      }
      
      // Load the image as uploaded file if available
      if (autoFillTrigger.imageUrl) {
        const loadImage = async () => {
          try {
            const response = await fetch(autoFillTrigger.imageUrl!);
            const blob = await response.blob();
            const file = new File([blob], 'version-image.jpg', { type: 'image/jpeg' });
            setUploadedFile(file);
            console.log('✅ ControlBar: Loaded version image as uploaded file');
          } catch (error) {
            console.error('❌ ControlBar: Failed to load version image:', error);
          }
        };
        loadImage();
      }
      
      console.log('✅ ControlBar: Form auto-filled successfully');
    }
  }, [autoFillTrigger]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    console.log('📁 ControlBar: File dropped:', { 
      name: file.name, 
      type: file.type, 
      size: file.size,
      isImage: file.type.startsWith('image/'),
      isUnderLimit: file.size <= 10 * 1024 * 1024
    });
    
    if (!file.type.startsWith('image/')) {
      console.log('❌ ControlBar: File is not an image');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      console.log('❌ ControlBar: File is too large');
      return;
    }
    
    console.log('✅ ControlBar: Setting uploaded file');
    setUploadedFile(file);
    setStoreUploadedFile(file); // Also update store
    setIsNewVersionMode(false); // Reset new version mode when file is uploaded
    
    // Debug: Check state after setting
    setTimeout(() => {
      console.log('🔍 ControlBar: State after upload:', { 
        uploadedFile: !!uploadedFile, 
        storeUploadedFile: !!storeUploadedFile 
      });
    }, 100);
  }, [uploadedFile, storeUploadedFile, setStoreUploadedFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadedFile(null);
    setPreviewUrl(null);
    setStoreUploadedFile(null); // Also clear store state
    
    console.log('🗑️ ControlBar: File removed, clearing version selection');
    // Clear version selection when file is removed
    setSelectedVersionId(undefined);
    setReferenceRenderId(undefined);
  };

  const getCreditsCost = () => {
    const baseCost = activeTab === 'video' ? 5 : 1;
    const speedMultiplier = renderSpeed === 'best' ? 2 : 1;
    return baseCost * speedMultiplier;
  };

  const handleProjectCreated = (newProjectId: string) => {
    console.log('🎉 ControlBar: New project created:', newProjectId);
    setSelectedProjectId(newProjectId);
    setIsCreateProjectModalOpen(false);
    
    // Notify parent component about project change
    if (onProjectChange) {
      onProjectChange(newProjectId);
    }
  };

  const handleGenerate = async () => {
    console.log('🎯 ControlBar: Generate button clicked');
    console.log('📝 ControlBar: Form state:', {
      prompt,
      style: selectedStyle,
      quality: renderSpeed === 'best' ? 'high' : 'standard',
      aspectRatio,
      type: activeTab,
      duration: activeTab === 'video' ? duration : undefined,
      hasUploadedFile: !!uploadedFile,
      engineType,
      projectId: selectedProjectId,
      isPublic
    });

    if (!prompt.trim()) {
      console.log('❌ ControlBar: No prompt provided');
      return;
    }

    if (!selectedProjectId) {
      console.log('❌ ControlBar: No project selected');
      return;
    }

    const creditsCost = getCreditsCost();
    console.log('💰 ControlBar: Credits cost:', creditsCost, 'Balance:', credits?.balance);
    
    if (credits && credits.balance < creditsCost) {
      console.log('❌ ControlBar: Insufficient credits');
      return;
    }

    console.log('🔄 ControlBar: Starting optimistic generation');
    
    // Notify parent component that generation has started
    if (onGenerationStart) {
      console.log('📢 ControlBar: Notifying parent of generation start');
      onGenerationStart();
    }
    
    console.log('🚀 ControlBar: Calling optimistic generate function');
    console.log('🚀 ControlBar: About to generate with chainId:', chainId);
    console.log('🔍 ControlBar: Current state before generate:', {
      chainId,
      initialChainId,
      selectedProjectId
    });
    
    // Use optimistic generation
    await optimisticGenerate({
      prompt,
      style: selectedStyle,
      quality: renderSpeed === 'best' ? 'high' : 'standard',
      aspectRatio,
      type: activeTab as 'image' | 'video',
      duration: activeTab === 'video' ? duration : undefined,
      uploadedImage: uploadedFile || undefined,
      negativePrompt: negativePrompt || undefined,
      imageType: imageType || undefined,
      projectId: selectedProjectId,
      chainId: addToChain ? (chainId || initialChainId) : undefined, // Only pass chainId if addToChain is true
      isPublic,
      referenceRenderId: referenceRenderId || undefined,
      seed: useRandomSeed ? undefined : (seed ? parseInt(seed) : undefined),
    }, (result) => {
      console.log('📥 ControlBar: Optimistic result received:', result);
      // Pass result to parent component
      if (onResult) {
        onResult(result);
      }
    });

    console.log('🔄 ControlBar: Refreshing credits');
    refreshCredits();
    
    // Refresh chain renders if we're adding to a chain
    if (addToChain && (chainId || initialChainId)) {
      console.log('🔄 ControlBar: Refreshing chain renders');
      await fetchChain();
    }
  };

  const creditsCost = getCreditsCost();

  return (
    <div className={cn(
      "bg-background flex flex-col transition-all duration-300 z-30 overflow-x-hidden",
      isMobile ? "w-full" : "w-full lg:w-1/3 min-w-[280px] max-w-[400px] border-r border-border",
      isMobile ? "h-full" : "h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]"
    )}>
      {/* Header */}
      <div className={`border-b border-border flex-shrink-0 ${
        isMobile ? 'p-2' : 'p-3'
      }`}>
        <div className="flex items-center justify-between gap-2">
          {/* Left side - Project and Version controls */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Project Dropdown */}
            <Select value={selectedProjectId} onValueChange={(value) => {
              if (value === 'create') {
                // Open create project modal
                console.log('Create project clicked');
                setIsCreateProjectModalOpen(true);
              } else {
                setSelectedProjectId(value);
              }
            }}>
              <SelectTrigger className={`${isMobile ? 'w-24 h-6 text-xs' : 'w-32 h-7 text-xs'}`}>
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                {projectsLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : projects.length > 0 ? (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-projects" disabled>No projects</SelectItem>
                )}
                <SelectItem value="create" className="text-primary">
                  <div className="flex items-center space-x-1">
                    <Plus className="h-3 w-3" />
                    <span>Create Project</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Version Dropdown */}
            <Select value={selectedVersionId || ''} onValueChange={(value) => {
              if (value === '') {
                setSelectedVersionId(undefined);
                // Clear the uploaded file and form when version is cleared
                setUploadedFile(null);
                setPreviewUrl(null);
                setStoreUploadedFile(null);
                console.log('🗑️ ControlBar: Version cleared, form reset');
              } else {
                setSelectedVersionId(value);
                handleVersionSelect(value);
              }
            }}>
              <SelectTrigger className={`${isMobile ? 'w-16 h-6 text-xs' : 'w-20 h-7 text-xs'}`}>
                <SelectValue placeholder="Version">
                  {selectedVersionId ? 
                    `v${(chainRenders?.findIndex(r => r.id === selectedVersionId) || 0) + 1}` : 
                    chainRenders && chainRenders.length > 0 ? 'Version' : 'No versions'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {chainRenders && chainRenders
                  .filter(r => r.status === 'completed' && r.outputUrl)
                  .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0))
                  .map((render, index) => (
                    <SelectItem key={render.id} value={render.id}>
                      v{index + 1}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            
            {/* New Version Button */}
            {selectedVersionId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewVersion}
                className={`${isMobile ? 'w-8 h-6 text-xs px-1' : 'w-10 h-7 text-xs px-2'} flex items-center justify-center`}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Right side - Public Toggle */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className={isMobile ? "scale-75" : "scale-90"}
            />
            <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground whitespace-nowrap`}>
              {isMobile ? 'Pub' : 'Public'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
            <div className={`${isMobile ? 'px-2 mt-2 mb-1' : 'px-3 mt-3 mb-2'} flex-shrink-0`}>
              <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'h-6' : 'h-8'}`}>
              <TabsTrigger value="image" className={`flex items-center justify-center space-x-1 text-xs px-2 min-w-0 ${isMobile ? 'text-xs' : ''}`}>
                <ImageIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Image</span>
              </TabsTrigger>
              <TabsTrigger value="video" className={`flex items-center justify-center space-x-1 text-xs px-2 min-w-0 ${isMobile ? 'text-xs' : ''}`}>
                <Video className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Video</span>
              </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
              <TabsContent value="image" className={`${isMobile ? 'px-2' : 'px-3'} flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden data-[state=inactive]:!hidden`}>
              {/* Scrollable Content */}
              <div className={`flex-1 overflow-y-auto ${isMobile ? 'space-y-2 pb-1' : 'space-y-3 pb-2'}`}>
                
                {/* Generation Progress - Removed, handled by layout */}

                {/* Optimistic Renders Preview */}
                {optimisticRenders.length > 0 && (
                  <OptimisticRenderPreview 
                    renders={optimisticRenders}
                    onRemove={(id) => {
                      // Remove optimistic render
                      console.log('Remove optimistic render:', id);
                    }}
                    onRetry={(id) => {
                      // Retry generation - could implement retry logic here
                      console.log('Retry generation for:', id);
                    }}
                    isMobile={isMobile}
                  />
                )}

                {/* Upload Section */}
                <div className="space-y-2">
                <Label className="text-sm font-medium">Upload Image</Label>
                {!uploadedFile ? (
                  <div
                    {...getRootProps()}
                    className={cn(
                      'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors aspect-video flex items-center justify-center',
                      isDragActive
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Upload Image</p>
                      <p className="text-xs text-muted-foreground">or drag & drop image</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Image Preview */}
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                      {previewUrl ? (
                        <Image
                          src={previewUrl}
                          alt="Uploaded preview"
                          fill
                          className="object-cover"
                          onLoad={() => console.log('✅ ControlBar: Image loaded successfully')}
                          onError={(e) => console.error('❌ ControlBar: Image failed to load:', e)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={removeFile}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* File Info */}
                    <div className="flex items-center space-x-2 p-2 border border-border rounded-lg bg-muted/50">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Image Type</Label>
                <div className="grid grid-cols-5 gap-1">
                  {imageTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant={imageType === type.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setImageType(type.value);
                          setStoreImageType(type.value);
                        }}
                        className="h-auto p-1 flex flex-col items-center space-y-1 min-w-0 overflow-hidden"
                      >
                        <IconComponent className={cn("h-3 w-3 flex-shrink-0", imageType === type.value ? "text-white" : type.color)} />
                        <span className="text-xs truncate w-full text-center">{type.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setStorePrompt(e.target.value); // Update store
                  }}
                  placeholder="Describe your image. e.g. villa, modern architecture, daylight, beige stone facade"
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Negative Prompt */}
              <div className="space-y-2">
                <Label htmlFor="negative-prompt">Negative Prompt (optional)</Label>
                <Input
                  id="negative-prompt"
                  value={negativePrompt}
                  onChange={(e) => {
                    setNegativePrompt(e.target.value);
                    setStoreNegativePrompt(e.target.value);
                  }}
                  placeholder="Remove unwanted elements"
                />
              </div>

              {/* Styles */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Styles</Label>
                <div className="grid grid-cols-3 gap-1">
                  {styles.map((style) => {
                    const IconComponent = style.icon;
                    return (
                      <Button
                        key={style.value}
                        variant={selectedStyle === style.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                        setSelectedStyle(style.value);
                        setStoreStyle(style.value);
                      }}
                        className="h-auto p-1 flex flex-col items-center space-y-1 min-w-0"
                      >
                        <IconComponent className={cn("h-4 w-4", selectedStyle === style.value ? "text-white" : style.color)} />
                        <span className="text-xs truncate">{style.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

               {/* Render Mode Slider */}
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <Label className="text-sm font-medium">Render Mode</Label>
                   <span className="text-xs text-muted-foreground">
                     {renderMode === 'exact' ? 'Exact' : 'Creative'}
                   </span>
                 </div>
                 <div className="px-2">
                   <Slider
                     value={renderModeValue}
                     onValueChange={setRenderModeValue}
                     max={100}
                     step={20}
                     className="w-full"
                   />
                   <div className="flex justify-between text-xs text-muted-foreground mt-1">
                     <span>Exact</span>
                     <span>Creative</span>
                   </div>
                 </div>
               </div>

               {/* Render Speed Slider */}
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <Label className="text-sm font-medium">Render Speed</Label>
                   <span className="text-xs text-muted-foreground">
                     {renderSpeed === 'fast' ? 'Fast' : 'Best'}
                   </span>
                 </div>
                 <div className="px-2">
                   <Slider
                     value={renderSpeedValue}
                     onValueChange={setRenderSpeedValue}
                     max={100}
                     step={20}
                     className="w-full"
                   />
                   <div className="flex justify-between text-xs text-muted-foreground mt-1">
                     <span>Fast</span>
                     <span>Best</span>
                   </div>
                 </div>
               </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Aspect Ratio</Label>
                <div className="grid grid-cols-4 gap-1">
                  {aspectRatios.map((ratio) => {
                    const IconComponent = ratio.icon;
                    return (
                      <Button
                        key={ratio.value}
                        variant={aspectRatio === ratio.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setAspectRatio(ratio.value);
                          setStoreAspectRatio(ratio.value);
                        }}
                        className="h-auto p-1 flex flex-col items-center space-y-1 min-w-0"
                      >
                        <IconComponent className={cn("h-4 w-4", aspectRatio === ratio.value ? "text-white" : ratio.color)} />
                        <div className="text-center min-w-0">
                          <div className="font-medium text-xs truncate">{ratio.label}</div>
                          <div className="text-xs opacity-70 truncate">{ratio.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Seed Controls */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Seed (Optional)</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={useRandomSeed}
                      onCheckedChange={(checked) => {
                        setUseRandomSeed(checked);
                        if (checked) {
                          setSeed('');
                        }
                      }}
                      className="scale-75"
                    />
                    <span className="text-xs text-muted-foreground">
                      {useRandomSeed ? 'Random' : 'Custom'}
                    </span>
                  </div>
                  
                  {!useRandomSeed && (
                    <div className="space-y-1">
                      <Input
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        placeholder="Enter seed value (numbers only)"
                        className="h-7 text-xs"
                        type="number"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSeed(Math.floor(Math.random() * 1000000).toString())}
                        className="h-6 text-xs w-full"
                      >
                        Generate Random
                      </Button>
                      <p className="text-xs text-amber-600">
                        Note: Seed support requires Google Cloud Project setup
                      </p>
                    </div>
                  )}
                </div>
              </div>
              </div>


              {/* Pinned Generate Button */}
              <div className="flex-shrink-0 space-y-1 pt-2 border-t border-border bg-background">
                <div className="flex items-center justify-between text-xs px-1">
                  <span>Credits: {creditsCost}</span>
                  <span className="text-muted-foreground">
                    {creditsLoading ? (
                      'Loading...'
                    ) : creditsError ? (
                      'Error loading'
                    ) : (
                      `Balance: ${credits?.balance || 0}`
                    )}
                  </span>
                </div>

                {/* Requirements Check */}
                {!prompt.trim() && (
                  <Alert className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Please enter a prompt to generate</AlertDescription>
                  </Alert>
                )}

                {!selectedProjectId && prompt.trim() && (
                  <Alert className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Please select a project</AlertDescription>
                  </Alert>
                )}

                {credits && credits.balance < creditsCost && prompt.trim() && selectedProjectId && (
                  <Alert variant="destructive" className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      Insufficient credits. Need {creditsCost}, have {credits.balance}
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive" className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || !selectedProjectId || (isGenerating || isOptimisticGenerating) || (credits && credits.balance < creditsCost)}
                  className="w-full h-8"
                  size="sm"
                >
                  {credits && credits.balance < creditsCost ? (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Upgrade to Generate
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate
                    </>
                  )}
                </Button>

                {credits && credits.balance < creditsCost && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-6 text-xs"
                      onClick={() => window.open('/plans', '_blank')}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  Est: 50 Sec
                </p>
              </div>
              </TabsContent>

              <TabsContent value="video" className={`${isMobile ? 'px-2' : 'px-3'} flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden data-[state=inactive]:!hidden`}>
              {/* Scrollable Content */}
              <div className={`flex-1 overflow-y-auto ${isMobile ? 'space-y-2 pb-1' : 'space-y-3 pb-2'}`}>
                {/* Video-specific content */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="3"
                    max="30"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                </div>
                
                {/* Same controls as image but for video */}
                <div className="space-y-2">
                  <Label htmlFor="video-prompt">Video Prompt</Label>
                  <Textarea
                    id="video-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your video sequence..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Pinned Generate Button for Video */}
              <div className="flex-shrink-0 space-y-1 pt-2 border-t border-border bg-background">
                <div className="flex items-center justify-between text-xs px-1">
                  <span>Credits: {creditsCost}</span>
                  <span className="text-muted-foreground">
                    {creditsLoading ? (
                      'Loading...'
                    ) : creditsError ? (
                      'Error loading'
                    ) : (
                      `Balance: ${credits?.balance || 0}`
                    )}
                  </span>
                </div>

                {/* Requirements Check */}
                {!prompt.trim() && (
                  <Alert className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Please enter a prompt to generate</AlertDescription>
                  </Alert>
                )}

                {!selectedProjectId && prompt.trim() && (
                  <Alert className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Please select a project</AlertDescription>
                  </Alert>
                )}

                {credits && credits.balance < creditsCost && prompt.trim() && selectedProjectId && (
                  <Alert variant="destructive" className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      Insufficient credits. Need {creditsCost}, have {credits.balance}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || !selectedProjectId || (isGenerating || isOptimisticGenerating) || (credits && credits.balance < creditsCost)}
                  className="w-full h-8"
                  size="sm"
                >
                  {credits && credits.balance < creditsCost ? (
                    <>
                      <Video className="h-3 w-3 mr-1" />
                      Upgrade to Generate
                    </>
                  ) : (
                    <>
                      <Video className="h-3 w-3 mr-1" />
                      Generate Video
                    </>
                  )}
                </Button>

                {credits && credits.balance < creditsCost && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-6 text-xs"
                      onClick={() => window.open('/plans', '_blank')}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  Est: 2-5 Min
                </p>
              </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

      {/* Create Project Modal */}
      <CreateProjectModal 
        open={isCreateProjectModalOpen} 
        onOpenChange={setIsCreateProjectModalOpen}
        onProjectCreated={handleProjectCreated}
      >
        <div className="hidden" />
      </CreateProjectModal>
    </div>
  );
}
