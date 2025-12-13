'use client';

import { useMemo } from 'react';
import {
	getStrokePoints,
	getSvgPathFromStrokePoints,
	useEditor,
	useValue,
} from '@tldraw/tldraw';
import { LassoingState } from './lasso-select-tool';

/**
 * Lasso Overlay Component
 * Renders the lasso path on the canvas as user draws
 */
export function LassoSelectSvgComponent() {
	const editor = useEditor();

	// Reactively read lasso points from tool state
	const lassoPoints = useValue(
		'lasso points',
		() => {
			if (!editor.isIn('lasso-select.lassoing')) return [];
			const lassoing = editor.getStateDescendant('lasso-select.lassoing') as LassoingState;
			return lassoing.points.get();
		},
		[editor]
	);

	// Smooth the lasso points and convert to SVG path
	const svgPath = useMemo(() => {
		if (lassoPoints.length === 0) return '';
		const smoothedPoints = getStrokePoints(lassoPoints);
		const svgPath = getSvgPathFromStrokePoints(smoothedPoints, true);
		return svgPath;
	}, [lassoPoints]);

	if (lassoPoints.length === 0) return null;

	return (
		<svg className="tl-overlays__item" aria-hidden="true">
			<path
				d={svgPath}
				fill="var(--color-selection-fill)"
				opacity={0.5}
				stroke="var(--color-selection-stroke)"
				strokeWidth="calc(2px / var(--tl-zoom))"
			/>
		</svg>
	);
}

