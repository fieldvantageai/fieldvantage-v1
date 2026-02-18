import { listEmployees } from "@/features/employees/service";
import { listJobs } from "@/features/jobs/service";
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

export type DashboardSnapshot = {
  generated_at: string;
  metrics: {
    jobs_today: number;
    in_progress_now: number;
    overdue: number;
    unassigned: number;
    planned_today: number;
    completed_today: number;
    in_progress_today: number;
    remaining_today: number;
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
  jobs_by_date: Array<{ date: string; count: number }>;
};

const toDateKey = (date: Date) => date.toISOString().split("T")[0];

const isBetween = (date: Date, start: Date, end: Date) => date >= start && date < end;

const sortByScheduled = (a: Job, b: Job) =>
  new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime();

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [jobs, employees] = await Promise.all([listJobs(), listEmployees()]);
  const employeesByMembershipId = new Map(
    employees.map((employee) => [employee.membership_id, employee])
  );

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const jobsToday = jobs.filter((job) =>
    isBetween(new Date(job.scheduled_for), startOfDay, endOfDay)
  );
  const inProgressNow = jobs.filter((job) => job.status === "in_progress");
  const overdueJobs = jobs.filter((job) => {
    const scheduled = new Date(job.scheduled_for);
    return scheduled < now && job.status === "in_progress";
  });
  const shouldStartJobs = jobs.filter((job) => {
    const scheduled = new Date(job.scheduled_for);
    return scheduled < now && job.status === "scheduled";
  });
  const unassignedJobs = jobs.filter((job) => !job.assigned_membership_ids?.length);

  const completedToday = jobsToday.filter((job) => job.status === "done").length;
  const inProgressToday = jobsToday.filter(
    (job) => job.status === "in_progress"
  ).length;
  const plannedToday = jobsToday.length;
  const remainingToday = Math.max(plannedToday - completedToday - inProgressToday, 0);

  const mapJobItem = (job: Job): DashboardOrderItem => {
    const assignedNames =
      job.assigned_membership_ids
        ?.map((id) => employeesByMembershipId.get(id)?.full_name)
        .filter(Boolean) ?? [];
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
  const upcomingExecutions = jobs
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

  const jobsByDateMap = new Map<string, number>();
  jobs.forEach((job) => {
    const key = toDateKey(new Date(job.scheduled_for));
    jobsByDateMap.set(key, (jobsByDateMap.get(key) ?? 0) + 1);
  });

  return {
    generated_at: now.toISOString(),
    metrics: {
      jobs_today: jobsToday.length,
      in_progress_now: inProgressNow.length,
      overdue: overdueJobs.length,
      unassigned: unassignedJobs.length,
      planned_today: plannedToday,
      completed_today: completedToday,
      in_progress_today: inProgressToday,
      remaining_today: remainingToday
    },
    lists: {
      live_executions: liveExecutions,
      todays_orders: todaysOrders,
      upcoming_executions: upcomingExecutions
    },
    attention,
    jobs_by_date: Array.from(jobsByDateMap.entries()).map(([date, count]) => ({
      date,
      count
    }))
  };
}
