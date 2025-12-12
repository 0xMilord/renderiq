import { Metadata } from "next";
import { JsonLd } from '@/components/seo/json-ld';
import { InvestorSlide } from '@/components/investors/investor-slide';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

const investorsPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Investors | Renderiq",
  "description": "Investment opportunity in Renderiq - The AI Visualization Engine for Architecture & AEC",
  "url": `${siteUrl}/investors`
};

export const metadata: Metadata = {
  title: "Investors | Renderiq - AI Architectural Visualization Platform",
  description: "Investment opportunity in Renderiq. The AI Visualization Engine for Architecture & AEC. 25 Apps · 4 Weeks · 300 Users · 2,300+ Renders",
  keywords: ["Renderiq investors", "Renderiq funding", "AEC AI investment", "architectural visualization investment"],
  alternates: {
    canonical: `${siteUrl}/investors`,
  },
};

export default function InvestorsPage() {
  return (
    <>
      <main className="min-h-screen bg-background">
        {/* SLIDE 1 — TITLE */}
        <InvestorSlide variant="title">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4">Renderiq</h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-2">The AI Visualization Engine for Architecture & AEC</p>
          <p className="text-lg md:text-xl text-muted-foreground">25 Apps · 4 Weeks · 300 Users · 2,300+ Renders</p>
        </InvestorSlide>

        {/* SLIDE 2 — THE PROBLEM */}
        <InvestorSlide title="The Problem">
          <p className="text-lg">Architecture and AEC workflows remain constrained by legacy tools and processes that have not evolved with modern technology.</p>
          <p className="font-semibold mt-4 mb-2">Current rendering challenges:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Time-intensive processes requiring hours or days per visualization</li>
            <li>High cost barriers limiting accessibility</li>
            <li>Fragmented tool ecosystems requiring multiple software solutions</li>
            <li>Steep learning curves and specialized skill requirements</li>
            <li>Limited iteration capabilities hindering creative exploration</li>
            <li>Inability to integrate visualization into early-stage design workflows</li>
          </ul>
          <p className="mt-4">These constraints significantly impact productivity and creativity across architecture, interior design, real estate, and construction industries.</p>
        </InvestorSlide>

        {/* SLIDE 3 — THE OPPORTUNITY */}
        <InvestorSlide title="The Opportunity">
          <p className="text-lg">AI technology has unlocked the potential for <strong>instant, high-quality visualization</strong>—yet the AEC industry lacks purpose-built solutions.</p>
          <p className="mt-4">Existing tools fall short:</p>
          <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
            <li>Generic AI tools lack architectural precision and technical accuracy</li>
            <li>Traditional rendering software requires extensive setup and lacks AI-native flexibility</li>
            <li>Current solutions cannot maintain consistency across multiple views and iterations</li>
          </ul>
          <p className="mt-4 font-semibold">The AEC industry requires a specialized visualization engine designed for professional workflows.</p>
        </InvestorSlide>

        {/* SLIDE 4 — THE SOLUTION */}
        <InvestorSlide title="The Solution">
          <h2 className="text-4xl font-bold mb-4">Renderiq</h2>
          <p className="text-xl font-semibold mb-4">The first AI-native visualization engine purpose-built for architecture and AEC.</p>
          <p className="font-semibold mb-2">Delivered in 4 weeks:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>25 purpose-built AEC tools</strong> covering the complete visualization workflow</li>
            <li>Advanced <strong>natural language processing</strong> for intuitive design communication</li>
            <li>Sophisticated <strong>multi-stage rendering pipelines</strong> ensuring quality and consistency</li>
            <li>Professional <strong>CAD-style outputs</strong> meeting industry standards</li>
            <li>Seamless <strong>floorplan to 3D to render</strong> workflow integration</li>
            <li>Flexible <strong>node-based rendering engine</strong> for complex workflows</li>
            <li>Powerful <strong>batch processing and multi-app chaining</strong> capabilities</li>
          </ul>
          <p className="mt-4">Renderiq delivers instant architectural visualization while maintaining professional standards for perspective, materiality, lighting, geometry, and technical drawing conventions.</p>
        </InvestorSlide>

        {/* SLIDE 5 — COMPETITIVE ADVANTAGES */}
        <InvestorSlide title="Competitive Advantages">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">1. AEC-Specialized AI Models</h3>
              <p>Our models are specifically optimized for architectural geometry, technical linework, professional lighting, CAD-style outputs, and elevation drawings—not generic image generation.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">2. Comprehensive Tool Ecosystem</h3>
              <p>25 modular tools working in concert, creating a complete visual operating system rather than a single-purpose application.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">3. Exceptional Engineering Velocity</h3>
              <p>Demonstrated ability to deliver 25 applications, process 2,300+ renders, and build a complete pipeline in just 4 weeks—10x faster than industry standards.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">4. Platform-First Architecture</h3>
              <p>APIs and plugin ecosystem position Renderiq as infrastructure, enabling developers and partners to build on our platform.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">5. Consistency & Reliability</h3>
              <p>Predictable, professional-grade output that AEC professionals can depend on—this reliability forms our core competitive moat.</p>
            </div>
          </div>
        </InvestorSlide>

        {/* SLIDE 6 — TRACTION */}
        <InvestorSlide title="Traction">
          <p className="text-lg mb-4">Strong early indicators of product-market fit in just 3 weeks:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>300 registered users</strong> with active engagement</li>
            <li><strong>2,300+ renders generated</strong> demonstrating high usage</li>
            <li><strong>100 daily active users</strong> showing strong retention</li>
            <li><strong>900 weekly active users</strong> indicating consistent adoption</li>
            <li><strong>Zero marketing spend</strong>—all growth is organic</li>
            <li><strong>ChatGPT as primary referral source</strong>—demonstrating AI-native distribution</li>
            <li><strong>Signups from international top-tier AEC firms</strong>—validating enterprise interest</li>
            <li><strong>Early product-market fit signals</strong> without formal distribution channels</li>
          </ul>
        </InvestorSlide>

        {/* SLIDE 7 — MARKET OPPORTUNITY */}
        <InvestorSlide title="Market Opportunity">
          <p className="text-2xl font-bold mb-4">AEC Visualization Total Addressable Market: <span className="text-primary">$10B+</span></p>
          <p className="mb-2">Market segments include:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Architecture firms and studios</li>
            <li>Interior design professionals</li>
            <li>Real estate development and marketing</li>
            <li>Building Information Modeling (BIM)</li>
            <li>Construction planning and visualization</li>
            <li>Architectural education and training</li>
            <li>Digital twin development</li>
          </ul>
          <p className="mt-4 font-semibold">AI-driven visualization represents an entirely new category with no established market leader.</p>
          <p className="text-xl font-bold text-primary mt-2">Renderiq is positioned to define and dominate this category.</p>
        </InvestorSlide>

        {/* SLIDE 8 — PRODUCT CAPABILITIES */}
        <InvestorSlide title="Product Capabilities">
          <p className="mb-4">Renderiq enables complete visualization workflows:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Sketch to photorealistic render conversion</li>
            <li>Floorplan to 3D model generation</li>
            <li>Render to CAD-style technical drawings</li>
            <li>CAD drawings to elevation views</li>
            <li>3D models to video walkthroughs</li>
            <li>Batch transformations across multiple assets</li>
            <li>Multi-style rendering for design exploration</li>
            <li>Pipeline chaining for complex workflows</li>
          </ul>
          <p className="mt-4 font-semibold text-lg">Enabling design at the speed of thought.</p>
        </InvestorSlide>

        {/* SLIDE 9 — PLATFORM ECOSYSTEM */}
        <InvestorSlide title="Platform Ecosystem">
          <p className="mb-4">Renderiq is evolving into a comprehensive ecosystem:</p>
          <div className="space-y-4 mt-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Applications</h3>
              <p>25 specialized tools covering the entire architectural visualization stack, from initial concepts to final presentations.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Plugin Integrations (Launching Q1 2025)</h3>
              <p>Native integrations with SketchUp, Revit, AutoCAD, Blender, and Rhino/Grasshopper, embedding Renderiq directly into existing AEC workflows.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Public API (Launching Q1 2025)</h3>
              <p>Programmatic access enabling developers to build custom applications on the Renderiq platform, establishing Renderiq as industry infrastructure.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Community & Marketplace</h3>
              <p>Discord and Telegram communities, user-generated content, and a marketplace for presets and pipeline templates.</p>
            </div>
          </div>
        </InvestorSlide>

        {/* SLIDE 10 — BUSINESS MODEL */}
        <InvestorSlide title="Business Model">
          <p className="mb-4">Multiple revenue streams for sustainable growth:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>SaaS subscriptions</strong> with credit-based usage tiers</li>
            <li><strong>Professional and enterprise</strong> subscription plans</li>
            <li><strong>Enterprise integrations</strong> and custom deployments</li>
            <li><strong>API usage billing</strong> for developer ecosystem</li>
            <li><strong>Plugin marketplace</strong> revenue sharing</li>
            <li><strong>B2B render pipeline</strong> licensing</li>
            <li><strong>Educational licensing</strong> for institutions</li>
          </ul>
          <p className="mt-4 font-semibold">Diversified revenue model reduces dependency on any single customer segment.</p>
        </InvestorSlide>

        {/* SLIDE 11 — TECHNICAL MOAT */}
        <InvestorSlide title="Technical Moat">
          <p className="mb-4">Sustainable competitive advantages:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>AEC-specific fine-tuned vision models with proprietary training data</li>
            <li>Proprietary multi-step rendering pipelines ensuring quality and consistency</li>
            <li>Node-based render graph architecture enabling complex workflows</li>
            <li>Advanced consistency and geometry preservation algorithms</li>
            <li>Plugin ecosystem creating switching costs and network effects</li>
            <li>Developer API and SDK establishing platform lock-in</li>
            <li>Category ownership: "AI Visualization Engine for AEC"</li>
          </ul>
          <p className="mt-4 font-semibold">These advantages create a compound moat that strengthens with each user and integration.</p>
        </InvestorSlide>

        {/* SLIDE 12 — KEY METRICS */}
        <InvestorSlide title="Key Metrics">
          <p className="mb-4">Metrics that matter to investors:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>10x engineering velocity:</strong> 25 apps delivered in 4 weeks</li>
            <li><strong>Enterprise validation:</strong> Top-tier AEC firms already onboarding</li>
            <li><strong>Organic distribution:</strong> ChatGPT as primary referral source demonstrates AI-native SEO</li>
            <li><strong>Strong engagement:</strong> Exceptionally high weekly-to-daily active user ratio</li>
            <li><strong>Efficient growth:</strong> Zero paid customer acquisition costs</li>
            <li><strong>High retention:</strong> Strong early user retention metrics</li>
            <li><strong>Product demand:</strong> Significant demand for plugins and API before launch</li>
            <li><strong>Enterprise pipeline:</strong> Enterprise interest generated before formal launch</li>
          </ul>
        </InvestorSlide>

        {/* SLIDE 13 — TIMING */}
        <InvestorSlide title="Why Now">
          <p className="mb-4">Perfect market timing for Renderiq:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>AI technology has reached the maturity required for professional AEC applications</li>
            <li>$10B+ AEC market remains underserved by modern technology solutions</li>
            <li>No established leader in AI-native architectural visualization</li>
            <li>Traditional rendering software is too slow and inflexible for modern workflows</li>
            <li>Architects and designers demand speed, iteration capability, and accuracy</li>
          </ul>
          <p className="mt-4 font-semibold">Renderiq is positioned at the intersection of AI maturity and AEC industry transformation.</p>
        </InvestorSlide>

        {/* SLIDE 14 — COMPETITIVE LANDSCAPE */}
        <InvestorSlide title="Competitive Landscape">
          <p className="font-semibold text-lg mb-4">We are not competing with generic AI tools. We are replacing slow, rigid AEC workflows with a purpose-built solution.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Competitor</th>
                  <th className="text-left p-3 font-semibold">Limitation</th>
                  <th className="text-left p-3 font-semibold">Renderiq Advantage</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-semibold">Midjourney</td>
                  <td className="p-3">Inconsistent geometry, lacks architectural precision</td>
                  <td className="p-3">AEC-specific fidelity and technical accuracy</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-semibold">D5 / Twinmotion</td>
                  <td className="p-3">Non-AI workflows, slow iteration cycles</td>
                  <td className="p-3">Instant AI-powered iteration and exploration</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-semibold">Stable Diffusion Tools</td>
                  <td className="p-3">Unstable styles, no consistency across views</td>
                  <td className="p-3">Consistent output with professional control</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-semibold">Legacy CAD Visualization</td>
                  <td className="p-3">Slow, manual processes, high skill requirements</td>
                  <td className="p-3">AI-native automation with professional results</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xl font-bold text-primary">Renderiq is the only visualization engine purpose-built for AEC professionals.</p>
        </InvestorSlide>

        {/* SLIDE 15 — FOUNDER */}
        <InvestorSlide title="Founder">
          <p className="text-xl font-semibold mb-4">Solo Founder</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Full-stack engineer with deep AI/ML expertise</li>
            <li>Demonstrated execution: 25 applications in 4 weeks</li>
            <li>Intimate understanding of AEC workflows and pain points</li>
            <li>Rare combination of product, technical, and distribution capabilities</li>
            <li>Unprecedented development velocity creating significant competitive advantage</li>
            <li>Compelling founder narrative with clear vision and execution track record</li>
          </ul>
          <p className="mt-4 font-semibold">Investors recognize and back founders who deliver exceptional output. Renderiq is a testament to that execution capability.</p>
        </InvestorSlide>

        {/* SLIDE 16 — FUNDING ROUND */}
        <InvestorSlide title="Funding Round">
          <div className="space-y-4">
            <div>
              <p className="text-xl font-bold mb-2">Raising: $1.5M – $2.5M</p>
              <p className="text-xl font-bold">Valuation: $15M – $20M</p>
              <p className="text-sm text-muted-foreground mt-2">(Valuation expands to $25M–$40M post-API and plugin launch)</p>
            </div>
            <div className="mt-6">
              <p className="font-semibold mb-2">Use of Funds:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>GPU infrastructure and compute resources</li>
                <li>Machine learning model fine-tuning and optimization</li>
                <li>Plugin ecosystem development and partnerships</li>
                <li>Rendering consistency and quality improvements</li>
                <li>Core engineering team expansion</li>
                <li>Global distribution and marketing engine</li>
                <li>Early enterprise customer onboarding and support</li>
              </ul>
            </div>
          </div>
        </InvestorSlide>

        {/* SLIDE 17 — ROADMAP */}
        <InvestorSlide title="Roadmap">
          <p className="font-semibold mb-4">Next 90 Days:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Plugin launch for SketchUp, Blender, and Revit</li>
            <li>Public Renderiq API release</li>
            <li>Expansion to 50+ applications in ecosystem</li>
            <li>Marketplace launch for presets and pipeline templates</li>
            <li>Developer SDK release</li>
            <li>Enterprise customer onboarding program</li>
            <li>User base growth to 5,000+ active users</li>
            <li>Aggressive distribution and market expansion</li>
          </ul>
          <p className="mt-4 text-xl font-bold text-primary">Renderiq becomes the essential infrastructure for AEC visualization.</p>
        </InvestorSlide>

        {/* SLIDE 18 — THE ASK */}
        <InvestorSlide title="The Ask" variant="centered">
          <p className="text-2xl font-semibold">We're building the visualization infrastructure for the AEC industry's future.</p>
          <p className="text-xl mt-4">If this vision aligns with yours, we should connect.</p>
        </InvestorSlide>

        {/* SLIDE 19 — VISION */}
        <InvestorSlide title="Vision" variant="centered">
          <p className="text-lg">Renderiq is not a tool.</p>
          <p className="text-lg">Renderiq is not a feature.</p>
          <p className="text-lg">Renderiq is not a render generator.</p>
          <p className="text-2xl font-bold mt-6">Renderiq is the Visualization Engine for the AI-first AEC world.</p>
          <p className="mt-6 text-lg">Just as Google became the index of the web, Renderiq becomes the index of architectural visual design.</p>
        </InvestorSlide>

        {/* SLIDE 20 — CONTACT */}
        <InvestorSlide title="Contact" variant="centered">
          <p className="text-xl font-semibold mb-2">Founder: Ayush</p>
          <p className="text-lg">Renderiq.io</p>
        </InvestorSlide>

      </main>
      <JsonLd data={investorsPageSchema} />
    </>
  );
}
