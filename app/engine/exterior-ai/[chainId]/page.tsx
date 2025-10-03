import { EngineLayout } from '@/components/engine-layout';

export default async function ExteriorAIChainPage({ 
  params 
}: { 
  params: Promise<{ chainId: string }> 
}) {
  const { chainId } = await params;
  
  return (
    <EngineLayout engineType="exterior" chainId={chainId}>
      <div />
    </EngineLayout>
  );
}

