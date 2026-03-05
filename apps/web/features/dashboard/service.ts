import { listBranches } from "@/features/branches/service";
import { listEmployees } from "@/features/employees/service";
import { listJobs } from "@/features/jobs/service";
import {
  getActiveCompanyContext,
  type ActiveCompanyRole
} from "@/lib/company/getActiveCompanyContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Job, JobStatus } from "@fieldvantage/shared";

type DashboardOrderItem = {
  id: string;
  title: string | null;
  customer_name: string | null;
  scheduled_for: string;
  status: JobStatus;
  assigned_names: string[];
};

type DashboardAttentionItem = {
  id: string;
  title: string | null;
  customer_name: string | null;
};

type CalendarDayJob = {
  id: string;
  title: string | null;
  scheduled_for: string;
  status: JobStatus;
};

export type CalendarDay = {
  date: string;
  count: number;
  hasOverdue: boolean;
  hasActive: boolean;
  jobs: CalendarDayJob[];
};

export type BranchSummaryItem = {
  branch_id: string | null;
  branch_name: string;
  jobs_today: number;
  in_progress_now: number;
  overdue: number;
};

export type TeamSummary = {
  active_employees: number;
  pending_invites: number;
};

export type DashboardSnapshot = {
  generated_at: string;
  role_context: {
    role: ActiveCompanyRole;
    isHq: boolean;
    branchIds: string[];
  };
  metrics: {
    jobs_today: number;
    in_progress_now: number;
    overdue: number;
    unassigned: number;
    planned_today: number;
    completed_today: number;
    in_progress_today: number;
    remaining_today: number;
    next_scheduled_for: string | null;
    own_should_start_count: number;
  };
  lists: {
    live_executions: DashboardOrderItem[];
    todays_orders: DashboardOrderItem[];
    upcoming_executions: DashboardOrderItem[];
  };
  attention: {
    overdue: DashboardAttentionItem[];
    should_start: DashboardAttentionItem[];
    unassigned: DashboardAttentionItem[];
  };
  jobs_by_date: CalendarDay[];
  team_summary: TeamSummary | null;
  branch_summary: BranchSummaryItem[] | null;
};

const toDateKey = (scheduledFor: string) => scheduledFor.split("T")[0];

const isBetween = (date: Date, start: Date, end: Date) => date >= start && date < end;

const sortByScheduled = (a: Job, b: Job) =>
  new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime();

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [[jobs, employees], context] = await Promise.all([
    Promise.all([listJobs(), listEmployees()]),
    getActiveCompanyContext()
  ]);

  const role = context?.role ?? "member";
  const isHq = context?.isHq ?? false;
  const branchIds = context?.branchIds ?? [];

  const employeesByMembershipId = new Map(
    employees.map((employee) => [employee.membership_id, employee])
  );

  // Para colaboradores (member), filtra apenas ordens atribuídas ao próprio usuário.
  // Isso alinha o dashboard com a tela de lista de ordens (GET /api/jobs).
  let visibleJobs = jobs;
  let membershipId: string | null = null;
  const needsAssignmentFilter =
    role === "member" ||
    (role === "admin" && !isHq && branchIds.length === 0);

  if (needsAssignmentFilter) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const { data: membershipRow } = user
      ? await supabase
          .from("company_memberships")
          .select("id")
          .eq("company_id", context!.companyId)
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle()
      : { data: null };
    membershipId = membershipRow?.id ?? null;
    if (membershipId) {
      visibleJobs = jobs.filter(
        (job) => job.assigned_membership_ids?.includes(membershipId!)
      );
    } else {
      visibleJobs = [];
    }
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const jobsToday = visibleJobs.filter((job) =>
    isBetween(new Date(job.scheduled_for), startOfDay, endOfDay)
  );
  const inProgressNow = visibleJobs.filter((job) => job.status === "in_progress");
  const overdueJobs = visibleJobs.filter((job) => {
    const scheduled = new Date(job.scheduled_for);
    return scheduled < now && job.status === "in_progress";
  });
  const shouldStartJobs = visibleJobs.filter((job) => {
    const scheduled = new Date(job.scheduled_for);
    return scheduled < now && job.status === "scheduled";
  });
  const unassignedJobs = visibleJobs.filter((job) => !job.assigned_membership_ids?.length);

  const completedToday = jobsToday.filter((job) => job.status === "done").length;
  const inProgressToday = jobsToday.filter(
    (job) => job.status === "in_progress"
  ).length;
  const plannedToday = jobsToday.length;
  const remainingToday = Math.max(plannedToday - completedToday - inProgressToday, 0);

  // Member-specific: next scheduled order and own should-start count
  let nextScheduledFor: string | null = null;
  const ownShouldStartCount = role === "member" ? shouldStartJobs.length : 0;
  if (role === "member") {
    const upcoming = visibleJobs
      .filter((job) => new Date(job.scheduled_for) > now && job.status === "scheduled")
      .sort(sortByScheduled);
    nextScheduledFor = upcoming[0]?.scheduled_for ?? null;
  }

  const mapJobItem = (job: Job): DashboardOrderItem => {
    const assignedNames =
      job.assigned_membership_ids
        ?.map((id) => employeesByMembershipId.get(id)?.full_name)
        .filter((name): name is string => Boolean(name)) ?? [];
    return {
      id: job.id,
      title: job.title ?? null,
      customer_name: job.customer_name ?? null,
      scheduled_for: job.scheduled_for,
      status: job.status,
      assigned_names: assignedNames
    };
  };

  const liveExecutions = inProgressNow
    .slice()
    .sort(sortByScheduled)
    .slice(0, 5)
    .map(mapJobItem);
  const todaysOrders = jobsToday
    .slice()
    .sort(sortByScheduled)
    .slice(0, 5)
    .map(mapJobItem);
  const upcomingExecutions = visibleJobs
    .filter(
      (job) => new Date(job.scheduled_for) > now && job.status === "scheduled"
    )
    .sort(sortByScheduled)
    .slice(0, 3)
    .map(mapJobItem);

  const attention = {
    overdue: overdueJobs.map((job) => ({
      id: job.id,
      title: job.title ?? null,
      customer_name: job.customer_name ?? null
    })),
    should_start: shouldStartJobs.map((job) => ({
      id: job.id,
      title: job.title ?? null,
      customer_name: job.customer_name ?? null
    })),
    unassigned: unassignedJobs.map((job) => ({
      id: job.id,
      title: job.title ?? null,
      customer_name: job.customer_name ?? null
    }))
  };

  type DayAccumulator = {
    count: number;
    hasOverdue: boolean;
    hasActive: boolean;
    jobs: CalendarDayJob[];
  };
  const jobsByDateMap = new Map<string, DayAccumulator>();
  visibleJobs.forEach((job) => {
    const key = toDateKey(job.scheduled_for);
    const existing: DayAccumulator = jobsByDateMap.get(key) ?? {
      count: 0, hasOverdue: false, hasActive: false, jobs: []
    };
    const isOverdue = job.status === "in_progress" && new Date(job.scheduled_for) < now;
    const isActive = job.status === "in_progress" || job.status === "scheduled";
    existing.count += 1;
    if (isOverdue) existing.hasOverdue = true;
    if (isActive) existing.hasActive = true;
    existing.jobs.push({
      id: job.id,
      title: job.title ?? null,
      scheduled_for: job.scheduled_for,
      status: job.status,
    });
    jobsByDateMap.set(key, existing);
  });

  // Team summary (admin/owner only)
  let teamSummary: TeamSummary | null = null;
  if (context && (role === "owner" || role === "admin")) {
    const activeCount = employees.filter(
      (e) => (e as { invitation_status?: string }).invitation_status !== "pending"
    ).length;
    const pendingCount = employees.filter(
      (e) => (e as { invitation_status?: string }).invitation_status === "pending"
    ).length;
    teamSummary = { active_employees: activeCount, pending_invites: pendingCount };
  }

  // Branch summary (owner always if branches exist; admin with 2+ branches)
  let branchSummary: BranchSummaryItem[] | null = null;
  if (context && (role === "owner" || (role === "admin" && branchIds.length >= 2))) {
    const allBranches = await listBranches();
    if (allBranches.length > 0) {
      const branchNameMap = new Map(allBranches.map((b) => [b.id, b.name]));
      const allJobs = role === "owner" || isHq ? jobs : visibleJobs;

      const summaryMap = new Map<string | null, BranchSummaryItem>();
      for (const branch of allBranches) {
        summaryMap.set(branch.id, {
          branch_id: branch.id,
          branch_name: branch.name,
          jobs_today: 0,
          in_progress_now: 0,
          overdue: 0,
        });
      }

      let hasNoBranch = false;
      for (const job of allJobs) {
        const bid = job.branch_id ?? null;
        if (!summaryMap.has(bid)) {
          if (bid === null) {
            hasNoBranch = true;
            summaryMap.set(null, {
              branch_id: null,
              branch_name: "__no_branch__",
              jobs_today: 0,
              in_progress_now: 0,
              overdue: 0,
            });
          } else {
            continue;
          }
        }
        const entry = summaryMap.get(bid)!;
        const scheduledDate = new Date(job.scheduled_for);
        if (isBetween(scheduledDate, startOfDay, endOfDay)) entry.jobs_today++;
        if (job.status === "in_progress") entry.in_progress_now++;
        if (job.status === "in_progress" && scheduledDate < now) entry.overdue++;
      }

      if (!hasNoBranch) {
        const noBranchJobs = allJobs.filter((j) => !j.branch_id);
        if (noBranchJobs.length > 0) {
          const noBranchEntry: BranchSummaryItem = {
            branch_id: null,
            branch_name: "__no_branch__",
            jobs_today: 0,
            in_progress_now: 0,
            overdue: 0,
          };
          for (const job of noBranchJobs) {
            const scheduledDate = new Date(job.scheduled_for);
            if (isBetween(scheduledDate, startOfDay, endOfDay)) noBranchEntry.jobs_today++;
            if (job.status === "in_progress") noBranchEntry.in_progress_now++;
            if (job.status === "in_progress" && scheduledDate < now) noBranchEntry.overdue++;
          }
          if (noBranchEntry.jobs_today > 0 || noBranchEntry.in_progress_now > 0 || noBranchEntry.overdue > 0) {
            summaryMap.set(null, noBranchEntry);
          }
        }
      }

      const items = Array.from(summaryMap.values());
      items.sort((a, b) => {
        if (a.overdue > 0 && b.overdue === 0) return -1;
        if (a.overdue === 0 && b.overdue > 0) return 1;
        if (a.branch_id === null) return 1;
        if (b.branch_id === null) return -1;
        return a.branch_name.localeCompare(b.branch_name);
      });
      branchSummary = items;
    }
  }

  return {
    generated_at: now.toISOString(),
    role_context: { role, isHq, branchIds },
    metrics: {
      jobs_today: jobsToday.length,
      in_progress_now: inProgressNow.length,
      overdue: overdueJobs.length,
      unassigned: unassignedJobs.length,
      planned_today: plannedToday,
      completed_today: completedToday,
      in_progress_today: inProgressToday,
      remaining_today: remainingToday,
      next_scheduled_for: nextScheduledFor,
      own_should_start_count: ownShouldStartCount
    },
    lists: {
      live_executions: liveExecutions,
      todays_orders: todaysOrders,
      upcoming_executions: upcomingExecutions
    },
    attention,
    jobs_by_date: Array.from(jobsByDateMap.entries()).map(([date, acc]) => ({
      date,
      count: acc.count,
      hasOverdue: acc.hasOverdue,
      hasActive: acc.hasActive,
      jobs: acc.jobs.sort(
        (a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
      ),
    })),
    team_summary: teamSummary,
    branch_summary: branchSummary
  };
}
