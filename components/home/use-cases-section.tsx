import { Building2, Store, Factory, Home, Hotel, School, Hospital, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const aecUseCases = [
  {
    icon: Building2,
    title: 'Commercial Architecture',
    description: 'Create stunning visualizations for office buildings, retail spaces, and commercial developments.',
    features: ['Exterior renders', 'Interior design', 'Material testing', 'Lighting studies'],
  },
  {
    icon: Factory,
    title: 'Industrial Design',
    description: 'Visualize manufacturing facilities, warehouses, and industrial complexes with precision.',
    features: ['Large-scale visualization', 'Technical accuracy', 'Safety compliance', 'Efficiency planning'],
  },
  {
    icon: School,
    title: 'Educational Facilities',
    description: 'Design and present educational buildings, campuses, and learning environments.',
    features: ['Campus planning', 'Classroom layouts', 'Student spaces', 'Accessibility design'],
  },
  {
    icon: Hospital,
    title: 'Healthcare Architecture',
    description: 'Plan and visualize hospitals, clinics, and medical facilities with attention to detail.',
    features: ['Patient flow', 'Medical equipment', 'Sanitation standards', 'Healing environments'],
  },
];

const retailUseCases = [
  {
    icon: Store,
    title: 'Retail Store Design',
    description: 'Design and visualize retail spaces, showrooms, and shopping environments.',
    features: ['Store layouts', 'Product displays', 'Customer flow', 'Brand identity'],
  },
  {
    icon: ShoppingBag,
    title: 'E-commerce Visualization',
    description: 'Create product visualizations and lifestyle images for online stores.',
    features: ['Product renders', 'Lifestyle scenes', 'Background removal', 'Multiple angles'],
  },
  {
    icon: Home,
    title: 'Residential Design',
    description: 'Visualize homes, apartments, and residential developments for marketing and sales.',
    features: ['Interior design', 'Exterior renders', 'Virtual staging', 'Marketing materials'],
  },
  {
    icon: Hotel,
    title: 'Hospitality Design',
    description: 'Design hotels, restaurants, and hospitality spaces with immersive visualizations.',
    features: ['Guest rooms', 'Common areas', 'Restaurant layouts', 'Ambiance creation'],
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
            Use Cases
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Built for Architecture, Engineering & Construction
            <span className="block text-muted-foreground mt-2">and Retail Industries</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Whether you're designing buildings or retail spaces, Renderiq adapts to your industry needs
          </p>
        </div>

        {/* AEC Section */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="h-8 w-8 text-primary" />
            <h3 className="text-3xl font-bold text-foreground">Architecture, Engineering & Construction (AEC)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aecUseCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{useCase.title}</CardTitle>
                    <CardDescription>{useCase.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {useCase.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-primary mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Retail Section */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Store className="h-8 w-8 text-primary" />
            <h3 className="text-3xl font-bold text-foreground">Retail & E-commerce</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {retailUseCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{useCase.title}</CardTitle>
                    <CardDescription>{useCase.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {useCase.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-primary mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}


