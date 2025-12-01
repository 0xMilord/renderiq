import { Metadata } from 'next';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'AI Rendering Software for Architecture - Renderiq',
  description: 'Discover the best AI rendering software for architectural visualization. Renderiq offers advanced AI-powered rendering that transforms sketches into photorealistic visualizations in minutes.',
  keywords: [
    'AI rendering software',
    'AI architectural rendering',
    'AI rendering engine',
    'AI visualization software',
    'AI rendering platform',
    'AI rendering service',
    'AI rendering tools',
    'AI rendering technology',
    'AI rendering solutions',
    'AI rendering for architecture'
  ],
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'AI Rendering Software for Architecture - Complete Guide',
  description: 'Comprehensive guide to AI rendering software for architectural visualization, featuring Renderiq as the leading AI-powered rendering platform.',
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
      url: 'https://Renderiq.com/logo.png'
    }
  }
};

export default function AIRenderingSoftwarePage() {
  return (
    <>
      <JsonLd data={articleSchema} />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              AI Rendering Software for Architecture
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
              Transform your architectural sketches into photorealistic renders with advanced AI rendering technology. 
              Experience the future of architectural visualization.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Traditional Rendering
                </h2>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• Hours or days to complete</li>
                  <li>• Requires technical expertise</li>
                  <li>• Expensive hardware needed</li>
                  <li>• Limited iteration capability</li>
                </ul>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border-2 border-green-500">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  AI Rendering with Renderiq
                </h2>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• Minutes to complete</li>
                  <li>• No technical expertise required</li>
                  <li>• Works on any device</li>
                  <li>• Unlimited iterations</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-xl">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Why Choose Renderiq AI Rendering Software?
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                  <p className="text-gray-600 dark:text-gray-300">Render in 2-5 minutes vs hours</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold mb-2">Highly Accurate</h3>
                  <p className="text-gray-600 dark:text-gray-300">AI understands design intent</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-xl font-semibold mb-2">Cost Effective</h3>
                  <p className="text-gray-600 dark:text-gray-300">Affordable pricing plans</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
