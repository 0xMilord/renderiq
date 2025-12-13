'use client';

import { useState, useCallback } from 'react';
import {
	Box,
	TldrawUiContextualToolbar,
	TldrawUiToolbarButton,
	track,
	useEditor,
} from '@tldraw/tldraw';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Wand2, Layers, Video, Maximize2 } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

interface ContextualToolbarProps {
	onGenerate?: (prompt: string, selectedRenderIds: string[]) => void;
	onOpenVariantsDialog?: (selectedRenderIds: string[]) => void;
	onOpenUpscaleDialog?: (selectedRenderIds: string[]) => void;
	onOpenVideoDialog?: (selectedRenderIds: string[]) => void;
}

/**
 * Contextual Toolbar for Selected Shapes
 * Shows when shapes are selected, allows prompt input for generation
 */
export const ContextualToolbar = track(({ onGenerate, onOpenVariantsDialog, onOpenUpscaleDialog, onOpenVideoDialog }: ContextualToolbarProps) => {
	const editor = useEditor();
	const [prompt, setPrompt] = useState('');
	const [isOpen, setIsOpen] = useState(false);

	// Only show when in select.idle state with shapes selected
	const showToolbar = editor.isIn('select.idle');
	const selectedShapes = editor.getSelectedShapes();
	const hasSelection = selectedShapes.length > 0;

	// Get render IDs from selected image shapes (shapes with renderId in meta)
	const imageShapes = selectedShapes.filter(s => s.type === 'image');
	const selectedRenderIds = imageShapes
		.map((shape) => shape.meta?.renderId as string | undefined)
		.filter((id): id is string => !!id);
	const hasImageSelection = selectedRenderIds.length > 0;

	// Get selection bounds for positioning
	const getSelectionBounds = useCallback(() => {
		const fullBounds = editor.getSelectionRotatedScreenBounds();
		if (!fullBounds) return undefined;
		// Position above selection
		return new Box(fullBounds.x, fullBounds.y - 60, fullBounds.width, 0);
	}, [editor]);

	if (!showToolbar || !hasSelection) return null;

	const handleGenerate = () => {
		if (!prompt.trim() || selectedRenderIds.length === 0) return;

		logger.log('🎨 ContextualToolbar: Generating with prompt', {
			prompt,
			selectedRenderIds,
			shapeCount: selectedShapes.length,
		});

		if (onGenerate) {
			onGenerate(prompt.trim(), selectedRenderIds);
		}

		// Clear prompt after generation
		setPrompt('');
		setIsOpen(false);
	};

	return (
		<TldrawUiContextualToolbar getSelectionBounds={getSelectionBounds} label="Edit Selection">
			{!isOpen ? (
				<div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
					{onGenerate && hasImageSelection && (
						<TldrawUiToolbarButton
							title="Iterate"
							type="menu"
							onClick={() => setIsOpen(true)}
						>
							<Sparkles className="h-4 w-4 mr-2" />
							<span>Iterate</span>
						</TldrawUiToolbarButton>
					)}
					{onOpenVariantsDialog && hasImageSelection && (
						<TldrawUiToolbarButton
							title="Generate Variants"
							type="menu"
							onClick={() => {
								logger.log('🎨 ContextualToolbar: Generate Variants clicked', { selectedRenderIds });
								onOpenVariantsDialog(selectedRenderIds);
							}}
						>
							<Layers className="h-4 w-4 mr-2" />
							<span>Variants</span>
						</TldrawUiToolbarButton>
					)}
					{onOpenUpscaleDialog && hasImageSelection && (
						<TldrawUiToolbarButton
							title="Upscale to 4K"
							type="menu"
							onClick={() => {
								logger.log('🎨 ContextualToolbar: Upscale clicked', { selectedRenderIds });
								onOpenUpscaleDialog(selectedRenderIds);
							}}
						>
							<Maximize2 className="h-4 w-4 mr-2" />
							<span>Upscale</span>
						</TldrawUiToolbarButton>
					)}
					{onOpenVideoDialog && hasImageSelection && (
						<TldrawUiToolbarButton
							title="Image to Video"
							type="menu"
							onClick={() => {
								logger.log('🎨 ContextualToolbar: Image to Video clicked', { selectedRenderIds });
								onOpenVideoDialog(selectedRenderIds);
							}}
						>
							<Video className="h-4 w-4 mr-2" />
							<span>Video</span>
						</TldrawUiToolbarButton>
					)}
				</div>
			) : (
				<div
					style={{
						pointerEvents: 'all',
						display: 'flex',
						flexDirection: 'column',
						gap: '8px',
						padding: '8px',
						backgroundColor: 'var(--color-panel)',
						border: '1px solid var(--color-border)',
						borderRadius: '8px',
						minWidth: '300px',
						maxWidth: '400px',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<Textarea
						placeholder="Describe what you want to generate..."
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
								handleGenerate();
							}
							if (e.key === 'Escape') {
								setIsOpen(false);
								setPrompt('');
							}
						}}
						rows={3}
						style={{
							resize: 'none',
							fontSize: '14px',
							padding: '8px',
						}}
						autoFocus
					/>
					<div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setIsOpen(false);
								setPrompt('');
							}}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleGenerate}
							disabled={!prompt.trim() || selectedRenderIds.length === 0}
						>
							<Wand2 className="h-4 w-4 mr-1" />
							Generate
						</Button>
					</div>
					{selectedRenderIds.length > 0 && (
						<div style={{ fontSize: '12px', color: 'var(--color-text-2)', marginTop: '4px' }}>
							{selectedRenderIds.length} render{selectedRenderIds.length > 1 ? 's' : ''} selected
						</div>
					)}
				</div>
			)}
		</TldrawUiContextualToolbar>
	);
});

