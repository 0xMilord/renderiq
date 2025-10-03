import { Code, Zap, Shield, Globe } from 'lucide-react';

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            API Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Integrate AecoSec&apos;s AI rendering capabilities into your applications
          </p>
        </div>

        {/* Overview */}
        <div className="bg-card rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Overview</h2>
          <p className="text-muted-foreground mb-6">
            The AecoSec API allows you to programmatically create AI-powered architectural renders 
            from sketches and 3D model snapshots. Our API is built on top of the Nano Banana SDK 
            and provides a simple, RESTful interface for generating both images and videos.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <Zap className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">Fast Processing</h3>
                <p className="text-muted-foreground text-sm">Get renders in minutes with our optimized pipeline</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">Secure & Reliable</h3>
                <p className="text-muted-foreground text-sm">Enterprise-grade security and 99.9% uptime</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Code className="h-6 w-6 text-purple-600 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">Easy Integration</h3>
                <p className="text-muted-foreground text-sm">Simple REST API with comprehensive documentation</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Globe className="h-6 w-6 text-orange-600 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">Global CDN</h3>
                <p className="text-muted-foreground text-sm">Fast delivery worldwide with our global CDN</p>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-card rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Authentication</h2>
          <p className="text-muted-foreground mb-4">
            All API requests require authentication using an API key. Include your API key in the 
            Authorization header of each request.
          </p>
          
          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <pre className="text-green-400 text-sm">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.aecosec.com/v1/renders`}
            </pre>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Get your API key from the <a href="/dashboard" className="text-primary hover:underline">dashboard</a>.
          </p>
        </div>

        {/* Endpoints */}
        <div className="bg-card rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-6">API Endpoints</h2>
          
          {/* Create Render */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">Create Render</h3>
            <div className="bg-muted rounded-lg p-3 mb-3">
              <code className="text-sm font-mono">POST /v1/renders</code>
            </div>
            
            <p className="text-muted-foreground mb-4">
              Create a new AI render from an uploaded image. Supports both image and video generation.
            </p>
            
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <pre className="text-green-400 text-sm">
{`{
  "image_url": "https://example.com/sketch.jpg",
  "type": "image",
  "prompt": "Transform into a modern glass building",
  "settings": {
    "style": "photorealistic",
    "quality": "high",
    "aspect_ratio": "16:9"
  }
}`}
              </pre>
            </div>
            
            <h4 className="font-semibold text-foreground mb-2">Response</h4>
            <div className="bg-gray-900 rounded-lg p-4">
              <pre className="text-green-400 text-sm">
{`{
  "success": true,
  "data": {
    "id": "render_123",
    "status": "processing",
    "estimated_completion": "2024-01-15T10:30:00Z"
  }
}`}
              </pre>
            </div>
          </div>

          {/* Get Render Status */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">Get Render Status</h3>
            <div className="bg-muted rounded-lg p-3 mb-3">
              <code className="text-sm font-mono">GET /v1/renders/{render_id}</code>
            </div>
            
            <p className="text-muted-foreground mb-4">
              Check the status of a render and get the result when completed.
            </p>
            
            <div className="bg-gray-900 rounded-lg p-4">
              <pre className="text-green-400 text-sm">
{`{
  "success": true,
  "data": {
    "id": "render_123",
    "status": "completed",
    "output_url": "https://cdn.aecosec.com/renders/render_123.jpg",
    "processing_time": 45
  }
}`}
              </pre>
            </div>
          </div>

          {/* List Renders */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">List Renders</h3>
            <div className="bg-muted rounded-lg p-3 mb-3">
              <code className="text-sm font-mono">GET /v1/renders?page=1&limit=20</code>
            </div>
            
            <p className="text-muted-foreground mb-4">
              Get a paginated list of your renders.
            </p>
          </div>
        </div>

        {/* SDKs */}
        <div className="bg-card rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">SDKs & Libraries</h2>
          <p className="text-muted-foreground mb-6">
            We provide official SDKs for popular programming languages to make integration easier.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">JavaScript/TypeScript</h3>
              <div className="bg-gray-900 rounded p-2 mb-3">
                <code className="text-green-400 text-sm">npm install @aecosec/sdk</code>
              </div>
              <p className="text-muted-foreground text-sm mb-3">
                Official SDK for Node.js and browser applications
              </p>
              <a href="#" className="text-primary text-sm hover:underline">View Docs →</a>
            </div>
            
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Python</h3>
              <div className="bg-gray-900 rounded p-2 mb-3">
                <code className="text-green-400 text-sm">pip install aecosec</code>
              </div>
              <p className="text-muted-foreground text-sm mb-3">
                Python SDK for server-side applications
              </p>
              <a href="#" className="text-primary text-sm hover:underline">View Docs →</a>
            </div>
            
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">cURL</h3>
              <div className="bg-gray-900 rounded p-2 mb-3">
                <code className="text-green-400 text-sm">curl -X POST ...</code>
              </div>
              <p className="text-muted-foreground text-sm mb-3">
                Direct HTTP API access for any language
              </p>
              <a href="#" className="text-primary text-sm hover:underline">View Docs →</a>
            </div>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="bg-card rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Rate Limits</h2>
          <p className="text-muted-foreground mb-6">
            API requests are rate limited to ensure fair usage and system stability.
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Requests/Minute
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Monthly Renders
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    Free
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    10
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    50
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    Pro
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    100
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    1,000
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    Enterprise
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    Unlimited
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    Unlimited
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Support */}
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Need Help?</h2>
          <p className="text-muted-foreground mb-6">
            Our team is here to help you integrate AecoSec into your applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@aecosec.com"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Contact Support
            </a>
            <a
              href="/docs"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-card hover:bg-muted"
            >
              View Full Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
