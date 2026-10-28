"""Focused regression checks for correction ordering and parsed log semantics."""
import unittest
from build_battle_chronicle import parse_events,reconcile,classify,review_reason

def events(text):
    return [dict(e,id=str(i),stream='test',ordinal=i) for i,e in enumerate(parse_events(text))]

class LogTests(unittest.TestCase):
    def test_cancel_then_reinstate_preserves_later_kill(self):
        rows=reconcile(events('Party killed - Glabrezu for 18,000 experience points.\nCorrection:: Party did not kill - Glabrezu. 18000 experience points removed.\nParty killed - Glabrezu for 18000 experience points.'))
        self.assertEqual([r['status'] for r in rows],['corrected','applied_correction','active'])
        self.assertEqual(rows[1]['cancels'],rows[0]['id'])
    def test_unmatched_correction_does_not_cancel_future_or_different_award(self):
        rows=reconcile(events('Correction:: Party did not kill - Orc. 100 experience points removed.\nParty killed: Orc for 100 experience points.\nParty killed - Orc for 200 experience points.\nCorrection:: Party did not kill - Orc. 100 experience points removed.'))
        self.assertEqual([r['status'] for r in rows],['unmatched_correction','corrected','active','applied_correction'])
    def test_duplicate_enemies_remain_distinct_and_lifo(self):
        rows=reconcile(events('Party killed - Wolf for 50 experience points.\nParty killed - Wolf for 50 experience points.\nCorrection:: Party did not kill - Wolf. 50 experience points removed.'))
        self.assertEqual([r['status'] for r in rows],['active','corrected','applied_correction'])
    def test_nonlethal_zero_unknown_and_placeholder_stay_distinct(self):
        rows=events('Party killed - Blade Golem for 5000 experience points (Defeated, not killed).\nParty killed - Brood Medic Swarm for 0 experience points.\nParty killed - Shrieker Cluster for experience points.\nParty killed - for experience points.')
        self.assertTrue(rows[0]['nonlethal']);self.assertEqual(rows[1]['xp'],0);self.assertIsNone(rows[2]['xp']);self.assertIsNone(review_reason(rows[2]));self.assertTrue(review_reason(rows[3]))
    def test_missing_script_xp_is_retained_as_unknown(self):
        rows=events('Party killed - Troll for undefined experience points.\nParty killed - for selected|npc_xp experience points.')
        self.assertEqual(len(rows),2);self.assertIsNone(rows[0]['xp']);self.assertIsNone(review_reason(rows[0]));self.assertTrue(review_reason(rows[1]))
    def test_species_group_preserves_target_and_named_nox_is_not_party_pc(self):
        self.assertEqual(classify('Orc with Longbow'),('Orc','Orcs'))
        row=events('Party killed - Nox for 7200 experience points.')[0]
        self.assertIsNone(review_reason(row));self.assertEqual(row['target'],'Nox')
if __name__=='__main__':unittest.main()
