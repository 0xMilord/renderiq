import { EngineLayout } from '@/components/engine-layout';

export default async function ExteriorAIChainPage({ 
  params 
}: { 
  params: Promise<{ chainId: string }> 
}) {
  const { chainId } = await params;
  console.log('📄 ExteriorAIChainPage: Received chainId from params:', chainId);
  
  return <EngineLayout engineType="exterior" chainId={chainId} />;
}

