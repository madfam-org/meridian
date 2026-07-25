/**
 * Turning a matter's tasks into something a person can act on.
 *
 * The unlocking itself is `@meridian/core`'s `unlockTasks`, which honours both
 * explicit dependencies and phase ordering. What this module adds is the part
 * the applicant actually needs: **why** a locked task is locked, named
 * specifically.
 *
 * "Locked" with no explanation is the single most common way a sequential
 * checklist becomes useless. A person looking at a greyed-out row concludes
 * either that the software is broken or that they have done something wrong,
 * and both conclusions cost a support conversation. The reason is recomputed
 * here from the same two conditions `unlockTasks` applies — an incomplete
 * dependency, an earlier phase still open, or both — and the blocking tasks are
 * named, not counted.
 */

import type { MatterPhase, Task, TaskStatus } from '@meridian/core';
import { MATTER_PHASE_ORDER, phaseIndex, phasePrecedes, unlockTasks } from '@meridian/core';

import type { SampleTask } from '@/lib/sample/matters';

/** A dependency that is not yet satisfied, with enough detail to point at it. */
export interface Blocker {
  readonly taskId: string;
  readonly title: SampleTask['title'];
  readonly status: TaskStatus;
}

export interface TaskView {
  readonly task: Task;
  readonly title: SampleTask['title'];
  readonly detail: SampleTask['detail'];
  /** The status after `unlockTasks` has run — a locked task may have opened. */
  readonly status: TaskStatus;
  /** Dependencies that are neither complete nor waived. */
  readonly blockedBy: readonly Blocker[];
  /** True when the task sits in a phase the matter has not reached. */
  readonly blockedByPhase: boolean;
  /** A dependency named in `dependsOn` that no task in the matter answers. */
  readonly danglingDependencies: readonly string[];
}

export interface PhaseStep {
  readonly phase: MatterPhase;
  readonly position: 'done' | 'current' | 'upcoming';
  readonly taskCount: number;
  readonly completeCount: number;
}

export interface MatterView {
  readonly tasks: readonly TaskView[];
  readonly phases: readonly PhaseStep[];
  readonly openTasks: readonly TaskView[];
  readonly lockedTasks: readonly TaskView[];
  readonly completedCount: number;
}

const SATISFIED: readonly TaskStatus[] = ['complete', 'waived'];

export function buildMatterView(
  samples: readonly SampleTask[],
  currentPhase: MatterPhase,
): MatterView {
  const original = samples.map((s) => s.task);
  const unlocked = unlockTasks(original, currentPhase);

  const statusById = new Map(unlocked.map((t) => [t.id, t.status]));
  const sampleById = new Map(samples.map((s) => [s.task.id, s]));

  const tasks: TaskView[] = samples.map((sample) => {
    const status = statusById.get(sample.task.id) ?? sample.task.status;

    const blockedBy: Blocker[] = [];
    const danglingDependencies: string[] = [];

    for (const dependencyId of sample.task.dependsOn) {
      const dependency = sampleById.get(dependencyId);
      if (dependency === undefined) {
        // `unlockTasks` treats an unresolvable dependency as unsatisfied, which
        // is the safe reading. Surfacing it separately matters because it is a
        // defect in the matter, not something the applicant can act on.
        danglingDependencies.push(dependencyId);
        continue;
      }
      const dependencyStatus = statusById.get(dependencyId) ?? dependency.task.status;
      if (!SATISFIED.includes(dependencyStatus)) {
        blockedBy.push({
          taskId: dependencyId,
          title: dependency.title,
          status: dependencyStatus,
        });
      }
    }

    return {
      task: sample.task,
      title: sample.title,
      detail: sample.detail,
      status,
      blockedBy,
      blockedByPhase: phasePrecedes(currentPhase, sample.task.phase),
      danglingDependencies,
    };
  });

  const currentIndex = phaseIndex(currentPhase);
  const phases: PhaseStep[] = MATTER_PHASE_ORDER.map((phase) => {
    const inPhase = tasks.filter((t) => t.task.phase === phase);
    const index = phaseIndex(phase);
    return {
      phase,
      position: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming',
      taskCount: inPhase.length,
      completeCount: inPhase.filter((t) => SATISFIED.includes(t.status)).length,
    };
  });

  return {
    tasks,
    phases,
    openTasks: tasks.filter((t) => t.status === 'available' || t.status === 'in_progress'),
    lockedTasks: tasks.filter((t) => t.status === 'locked'),
    completedCount: tasks.filter((t) => SATISFIED.includes(t.status)).length,
  };
}
