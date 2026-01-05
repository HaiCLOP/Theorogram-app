import cron from 'node-cron';
import { supabase } from '../config/supabase';
import { classifyContent } from '../services/moderation';

/**
 * Background job to rescan published theories
 * Runs every 6 hours
 */
export function startRescanJob() {
    // Run at 00:00, 06:00, 12:00, 18:00 every day
    cron.schedule('0 */6 * * *', async () => {
        console.log('[Rescan Job] Starting theory rescan...');

        try {
            // Fetch all published theories (safe status)
            const { data: theories, error } = await supabase
                .from('theories')
                .select('id, title, body')
                .eq('moderation_status', 'safe')
                .limit(100); // Process in batches

            if (error || !theories) {
                console.error('[Rescan Job] Error fetching theories:', error);
                return;
            }

            console.log(`[Rescan Job] Rescanning ${theories.length} theories...`);

            for (const theory of theories) {
                try {
                    // Reclassify
                    const moderation = await classifyContent(theory.title, theory.body);

                    // If reclassified as NSFW or UNSAFE, take action
                    if (moderation.classification === 'nsfw' || moderation.classification === 'unsafe') {
                        console.log(`[Rescan Job] Theory ${theory.id} reclassified as ${moderation.classification}`);

                        // Shadowban the theory
                        await supabase
                            .from('theories')
                            .update({ moderation_status: 'shadowbanned' })
                            .eq('id', theory.id);

                        // Log the action
                        await supabase.from('moderation_logs').insert({
                            theory_id: theory.id,
                            classification: moderation.classification,
                            confidence: moderation.confidence,
                            action_taken: 'shadowbanned_rescan',
                            gemini_response: { reasoning: moderation.reasoning },
                        });
                    }
                } catch (theoryError) {
                    console.error(`[Rescan Job] Error processing theory ${theory.id}:`, theoryError);
                }

                // Small delay to avoid rate limiting
                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            console.log('[Rescan Job] Rescan complete');
        } catch (error) {
            console.error('[Rescan Job] Fatal error:', error);
        }
    });

    console.log('[Rescan Job] Scheduled to run every 6 hours');
}
