/**
 * Rich, SEO-optimized content for each tool
 * Contains specific, engaging content with real search volume keywords
 */

export interface ToolContent {
  howItWorks: {
    steps: Array<{ step: string; detail: string }>;
  };
  faq: Array<{ q: string; a: string }>;
  useCases: Array<{ title: string; desc: string }>;
  keyFeatures: string[];
  about: {
    description: string;
    benefits: string[];
  };
}

export const TOOL_CONTENT: Record<string, ToolContent> = {
  'render-section-drawing': {
    howItWorks: {
      steps: [
        {
          step: 'Upload Your Architectural Render',
          detail: 'Drop in your 3D render, visualization, or photorealistic image. We accept JPG, PNG, or WebP files up to 10MB. Works with renders from Revit, SketchUp, Lumion, Enscape, or any visualization software.'
        },
        {
          step: 'Select Section Drawing Type',
          detail: 'Choose between Technical CAD Section (precise linework for construction docs), 3D Cross Section (perspective view showing depth), or Illustrated 2D Section (stylized for presentations). Each type serves different project phases.'
        },
        {
          step: 'Set Level of Detail (LOD)',
          detail: 'Pick your LOD: 100 for concept studies, 200 for schematic design, 300 for design development with dimensions, or 400 for construction-ready drawings with full specifications. This matches BIM standards architects already use.'
        },
        {
          step: 'Choose Output Quality',
          detail: 'Select standard (5 credits) for quick iterations, high (10 credits) for client presentations, or ultra (15 credits) for print-ready construction documents. Higher quality means sharper linework and better annotation clarity.'
        },
        {
          step: 'Generate Your Section Drawing',
          detail: 'Click Generate and our AI processes your render in 10-30 seconds. The system analyzes structural elements, materials, and spatial relationships to create an accurate section drawing following architectural drafting conventions.'
        },
        {
          step: 'Download & Use',
          detail: 'Get your high-resolution PNG section drawing instantly. Perfect for construction documents, permit applications, client presentations, or design development. Files are print-ready at 300 DPI for professional use.'
        }
      ]
    },
    faq: [
      {
        q: 'Can I use this for building permit applications?',
        a: 'Yes, when set to LOD 300 or 400, our section drawings include structural elements, dimensions, and material specifications suitable for permit documentation. However, always verify with your local building department requirements and have a licensed architect review before submission.'
      },
      {
        q: 'What\'s the difference between LOD 100, 200, 300, and 400?',
        a: 'LOD 100 shows basic building massing (conceptual). LOD 200 includes approximate sizes and generic elements (schematic design). LOD 300 has specific elements with exact dimensions (design development). LOD 400 includes fabrication details and assembly specs (construction documents). This matches the AIA\'s Level of Development standards used in BIM workflows.'
      },
      {
        q: 'Will this work with my Revit or SketchUp renders?',
        a: 'Absolutely. Our tool accepts any architectural render regardless of source software. Whether you\'re exporting from Revit, SketchUp, Lumion, Enscape, V-Ray, or even hand-drawn sketches, the AI analyzes the image to extract structural information and create accurate section drawings.'
      },
      {
        q: 'How accurate are the structural elements in generated sections?',
        a: 'The AI maintains architectural drafting standards and accurately represents visible structural elements, materials, and spatial relationships from your render. For construction documents, we recommend LOD 400 output and review by a licensed professional. The tool excels at design visualization and documentation workflows.'
      },
      {
        q: 'Can I edit the section drawing after generation?',
        a: 'The output is a high-resolution PNG image you can import into AutoCAD, Revit, or any CAD software for further editing. Many architects use our tool to quickly generate base section drawings, then add annotations, dimensions, and details in their preferred CAD platform.'
      }
    ],
    useCases: [
      {
        title: 'Building Permit Documentation',
        desc: 'Generate construction-ready section drawings for permit applications. LOD 400 outputs include structural details, material specifications, and dimensions required by building departments. Saves hours compared to manual drafting.'
      },
      {
        title: 'Client Presentation Sections',
        desc: 'Create illustrated 2D sections that clearly communicate design intent to clients. Perfect for design reviews, stakeholder meetings, and marketing materials. The stylized format helps non-technical audiences understand spatial relationships.'
      },
      {
        title: 'Design Development Workflow',
        desc: 'Rapidly iterate through section options during design development. Convert multiple render angles into sections to explore different cut planes, helping you evaluate spatial quality, daylighting, and material transitions before finalizing designs.'
      },
      {
        title: 'Construction Documentation',
        desc: 'Produce technical CAD-style sections for construction sets. The precise linework and architectural annotations integrate seamlessly into your documentation workflow, whether you\'re working in AutoCAD, Revit, or ArchiCAD.'
      },
      {
        title: 'Educational & Training Materials',
        desc: 'Create section drawings for architecture courses, training programs, or portfolio documentation. Students and professionals use this to quickly visualize building sections for academic projects, presentations, and design competitions.'
      }
    ],
    keyFeatures: [
      'Three section types: Technical CAD (construction docs), 3D Cross Section (perspective), Illustrated 2D (presentations)',
      'BIM-standard LOD levels (100-400) matching AIA Level of Development guidelines',
      'Print-ready output at 300 DPI for professional documentation',
      'Works with renders from Revit, SketchUp, Lumion, Enscape, and any visualization software',
      'Maintains architectural drafting standards with proper line weights and annotations',
      '10-30 second processing time for rapid iteration during design development'
    ],
    about: {
      description: 'Transform your architectural renders into professional section drawings in seconds. Whether you need construction-ready technical drawings or presentation-quality illustrations, this tool adapts to your project phase. Built specifically for architects working in BIM workflows, it understands structural elements, materials, and spatial relationships—not just generic image conversion.',
      benefits: [
        'Saves hours of manual drafting time',
        'Maintains architectural accuracy and drafting standards',
        'Integrates with existing CAD workflows',
        'Supports all project phases from concept to construction'
      ]
    }
  },
  // Add more tools as needed - this is a template
};

