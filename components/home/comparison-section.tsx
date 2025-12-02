import { CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const competitors = [
  {
    name: 'Traditional CAD Software',
    features: {
      aiPowered: false,
      speed: false,
      cost: false,
      easeOfUse: false,
      videoGeneration: false,
    },
  },
  {
    name: 'Other AI Render Tools',
    features: {
      aiPowered: true,
      speed: true,
      cost: false,
      easeOfUse: false,
      videoGeneration: false,
    },
  },
  {
    name: 'Renderiq',
    features: {
      aiPowered: true,
      speed: true,
      cost: true,
      easeOfUse: true,
      videoGeneration: true,
    },
    highlight: true,
  },
];

const featureLabels = {
  aiPowered: 'AI-Powered Rendering',
  speed: '2-5 Minute Renders',
  cost: 'Affordable Pricing',
  easeOfUse: 'No Technical Skills Required',
  videoGeneration: 'Video Generation',
};

export function ComparisonSection() {
  return (
    <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
            Comparison
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Why Choose Renderiq?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Compare Renderiq with traditional architecture render software and other AI tools
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Feature</TableHead>
                    {competitors.map((competitor) => (
                      <TableHead
                        key={competitor.name}
                        className={competitor.highlight ? 'bg-primary/10 font-bold' : ''}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {competitor.name}
                          {competitor.highlight && (
                            <Badge className="bg-primary text-primary-foreground">Best</Badge>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(featureLabels).map(([key, label]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{label}</TableCell>
                      {competitors.map((competitor) => (
                        <TableCell
                          key={competitor.name}
                          className={competitor.highlight ? 'bg-primary/5' : ''}
                        >
                          {competitor.features[key as keyof typeof competitor.features] ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

