import { Metadata } from 'next';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'Best AI Architecture Tools 2025 - Renderiq Platform',
  description: 'Discover the best AI architecture tools for 2025. Renderiq leads the industry with advanced AI-powered architectural visualization, rendering, and design automation for architects and designers.',
  keywords: [
    'best AI architecture tools',
    'AI architecture software 2025',
    'AI architectural visualization tools',
    'AI rendering software for architects',
    'AI design tools for architecture',
    'AI architecture platform comparison',
    'top AI architecture tools',
    'AI architecture software review',
    'AI architectural design tools',
    'AI visualization tools for architects'
  ],
  openGraph: {
    title: 'Best AI Architecture Tools 2025 - Renderiq Platform',
    description: 'Discover the best AI architecture tools for 2025. Renderiq leads the industry with advanced AI-powered architectural visualization.',
    images: ['/ai-architecture-tools-og.png'],
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Best AI Architecture Tools 2025 - Complete Guide',
  description: 'Comprehensive guide to the best AI architecture tools available in 2025, featuring Renderiq as the leading AI-powered architectural visualization platform.',
  image: 'https://renderiq.io/ai-architecture-tools-og.png',
  datePublished: new Date().toISOString(),
  dateModified: new Date().toISOString(),
  author: {
    '@type': 'Organization',
    name: 'Renderiq'
  },
  publisher: {
    '@type': 'Organization',
    name: 'Renderiq',
    logo: {
      '@type': 'ImageObject',
      url: 'https://renderiq.io/logo.png'
    }
  }
};

export default function AIArchitectureToolsPage() {
  return (
    <>
      <JsonLd data={articleSchema} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Best AI Architecture Tools 2025
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover the leading AI-powered architecture tools that are revolutionizing the industry. 
              From sketch to stunning visualization in minutes with advanced artificial intelligence.
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                The Future of Architecture is AI-Powered
              </h2>
              <div className="prose prose-lg max-w-none text-gray-600 dark:text-gray-300">
                <p>
                  Artificial Intelligence is transforming the architecture industry, enabling architects and designers 
                  to create stunning visualizations, iterate designs rapidly, and present concepts to clients like never before. 
                  In 2025, AI architecture tools have become essential for modern design workflows.
                </p>
                <p>
                  These advanced tools leverage machine learning, computer vision, and generative AI to understand 
                  architectural sketches and transform them into photorealistic renders in minutes rather than hours. 
                  This dramatic improvement in speed and quality is revolutionizing how architects work.
                </p>
              </div>
            </section>

            {/* Top AI Architecture Tools */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Top AI Architecture Tools for 2025
              </h2>
              
              <div className="grid gap-8">
                {/* Renderiq - Featured */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 border-blue-500">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Renderiq - Leading AI Architecture Platform
                      </h3>
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                          #1 Recommended
                        </span>
                        <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                          Best Overall
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">4.8/5</div>
                      <div className="text-sm text-gray-500">User Rating</div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Features:</h4>
                      <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                        <li>• AI-powered sketch to render conversion</li>
                        <li>• Unified AI Chat interface for all architectural rendering needs</li>
                        <li>• High-resolution output up to 4K</li>
                        <li>• Real-time design iteration</li>
                        <li>• Video generation from sketches</li>
                        <li>• Batch processing capabilities</li>
                        <li>• API access for enterprise integration</li>
                        <li>• Enterprise-grade security and privacy</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Why Choose Renderiq:</h4>
                      <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                        <li>• Fastest rendering times (2-5 minutes)</li>
                        <li>• Most accurate AI interpretation</li>
                        <li>• Comprehensive tool suite</li>
                        <li>• Excellent customer support</li>
                        <li>• Free tier with 10 credits</li>
                        <li>• Affordable pricing plans</li>
                        <li>• Regular AI model updates</li>
                        <li>• Active user community</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                      Perfect For:
                    </h4>
                    <p className="text-blue-800 dark:text-blue-200">
                      Architects, interior designers, real estate developers, construction companies, 
                      design students, and anyone looking for the most advanced AI architecture tools available.
                    </p>
                  </div>
                </div>

                {/* Other Tools */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Traditional Architecture Software
                    </h3>
                    <div className="space-y-2 text-gray-600 dark:text-gray-300 mb-4">
                      <p>• AutoCAD, Revit, SketchUp</p>
                      <p>• Manual rendering processes</p>
                      <p>• Longer production times</p>
                      <p>• Higher learning curve</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      Rating: 3.5/5 - Limited AI capabilities
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Emerging AI Tools
                    </h3>
                    <div className="space-y-2 text-gray-600 dark:text-gray-300 mb-4">
                      <p>• Early-stage development</p>
                      <p>• Limited feature sets</p>
                      <p>• Inconsistent results</p>
                      <p>• Higher pricing</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      Rating: 3.0/5 - Still developing
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* AI Architecture Benefits */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Benefits of AI Architecture Tools
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Speed & Efficiency
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Generate professional renders in minutes instead of hours. 
                    AI dramatically accelerates the design workflow.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Enhanced Creativity
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Focus on design creativity while AI handles the technical 
                    rendering process. More time for innovation.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-purple-100 dark:bg-purple-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Cost Effective
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Reduce rendering costs and increase project throughput. 
                    Better ROI on design projects.
                  </p>
                </div>
              </div>
            </section>

            {/* Call to Action */}
            <section className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Transform Your Architecture Workflow?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of architects using Renderiq to create stunning AI-powered visualizations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/signup" 
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Start Free Trial
                </a>
                <a 
                  href="/gallery" 
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  View Gallery
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
