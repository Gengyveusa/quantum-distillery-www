/**
 * src/hooks/useConductor.ts
 * React hook that wraps the module-level Conductor singleton.
 *
 * Exposes loadScenario(), loadLegacyScenario(), start(), stop(),
 * answerQuestion(), and continuePendingStep() to components.
 */

import { useEffect, useCallback } from 'react';
import { conductorInstance } from '../engine/conductor/conductorInstance';
import type { ConductorScenario } from '../engine/conductor/types';
import type { InteractiveScenario } from '../engine/ScenarioEngine';

export function useConductor() {
  // Cleanup: stop the conductor when the component unmounts.
  useEffect(() => {
    return () => {
      conductorInstance.stop();
    };
  }, []);

  const loadScenario = useCallback(
    (scenario: ConductorScenario) => {
      conductorInstance.loadScenario(scenario);
    },
    []
  );

  const loadLegacyScenario = useCallback(
    (scenario: InteractiveScenario) => {
      conductorInstance.loadLegacyScenario(scenario);
    },
    []
  );

  const start = useCallback(() => {
    conductorInstance.start();
  }, []);

  const stop = useCallback(() => {
    conductorInstance.stop();
  }, []);

  return { loadScenario, loadLegacyScenario, start, stop };
}

