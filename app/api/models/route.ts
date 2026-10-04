import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createServiceClient } from '../../../lib/supabase/serviceClient';
import { AI_MODELS, getProviderPrefix } from '../../../lib/ai/models';
import { BYOK_PROVIDERS } from '../../../lib/ai/providers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSupabase = createServiceClient();
    
    // Fetch user's preferred model
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('preferred_model')
      .eq('id', user.id)
      .single();

    const preferredModel = profile?.preferred_model || AI_MODELS[0].name;

    // Fetch current usage for all models today
    const today = new Date().toISOString().split('T')[0];
    const { data: usageData } = await serviceSupabase
      .from('ai_model_usage')
      .select('*')
      .eq('date', today);

    const usageMap = new Map();
    if (usageData) {
      for (const row of usageData) {
        usageMap.set(row.model_name, row);
      }
    }

    // Fetch BYOK keys (standard client)
    const { data: keysData } = await supabase
      .from('user_api_keys')
      .select('provider')
      .eq('user_id', user.id);

    const userProviders = (keysData || [])
      .map((k: { provider: string }) => k.provider)
      .filter((p: string) => BYOK_PROVIDERS.includes(p));

    const isByokUser = userProviders.length > 0;

    let filteredModels = AI_MODELS;
    if (isByokUser) {
      filteredModels = AI_MODELS.filter(m => userProviders.includes(getProviderPrefix(m.name)));
    } else {
      filteredModels = AI_MODELS.filter((m) => m.userSelectable !== false);
    }

    let preferredModel = profile?.preferred_model || null;
    if (!filteredModels.find((m) => m.name === preferredModel)) {
      preferredModel = filteredModels.length > 0 ? filteredModels[0].name : null;
    }

    // Prepare response data combining static config with live usage
    const models = filteredModels.map(model => {
      const usage = usageMap.get(model.name);
      return {
        ...model,
        request_count: usage?.request_count || 0,
        blocked_until: usage?.blocked_until || null,
        is_preferred: model.name === preferredModel
      };
    });

    return NextResponse.json({ data: models, preferredModel, byokProviders: userProviders });
  } catch (error: unknown) {
    console.error("[Models API] Error:", (error as Error).message);
    return NextResponse.json({ error: 'Failed to fetch models status.' }, { status: 500 });
  }
}
