import { NextResponse } from "next/server";

import { newJobSchema } from "@/features/jobs/forms/newJob/formSchema";
import { createJob } from "@/features/jobs/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";
import { getActiveCompanyContext } from "@/lib/company/getActiveCompanyContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

const toScheduledFor = (date: string, time?: string | null) =>
  `${date}T${time?.slice(0, 5) ?? "00:00"}`;

export async function GET(request: Request) {
  const user = await getSupabaseAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status") ?? "all";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const sort = searchParams.get("sort") ?? "startDate";
  const dir = searchParams.get("dir") ?? "desc";
  const page = Number(searchParams.get("page") ?? "1");
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;

  const context = await getActiveCompanyContext();
  if (!context) {
    return NextResponse.json({ data: [], total: 0 }, { status: 200 });
  }
  const supabase = await createSupabaseServerClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const companyId = context.companyId;

  let jobIdsFromAssignments: string[] = [];
  if (query) {
    const { data: membershipUsers } = await supabase
      .from("company_memberships")
      .select("user_id")
      .eq("company_id", companyId)
      .eq("status", "active");
    const userIds =
      membershipUsers?.map((item) => item.user_id as string).filter(Boolean) ??
      [];
    const { data: matchedEmployees } = userIds.length
      ? await supabase
          .from("employees")
          .select("id")
          .in("user_id", userIds)
          .ilike("full_name", `%${query}%`)
      : { data: [] };
    const employeeIds = (matchedEmployees ?? []).map((item) => item.id);
    if (employeeIds.length > 0) {
      const { data: assignments } = await supabase
        .from("job_assignments")
        .select("job_id")
        .in("employee_id", employeeIds);
      jobIdsFromAssignments = (assignments ?? []).map(
        (item) => item.job_id as string
      );
    }
  }

  const orFilters = [];
  if (query) {
    orFilters.push(`title.ilike.%${query}%`, `customer_name.ilike.%${query}%`);
    if (jobIdsFromAssignments.length > 0) {
      orFilters.push(`id.in.(${jobIdsFromAssignments.join(",")})`);
    }
  }

  const baseSelect =
    "id, company_id, customer_id, customer_name, customer_address_id, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at, job_assignments(employee_id, employees(full_name))";
  const employeeSelect =
    "id, company_id, customer_id, customer_name, customer_address_id, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at, job_assignments!inner(employee_id, employees(full_name))";
  const isCollaborator = context.role === "member" && employee?.id;
  if (context.role === "member" && !employee?.id) {
    return NextResponse.json({ data: [], total: 0 }, { status: 200 });
  }

  let jobsQuery = supabase
    .from("jobs")
    .select(isCollaborator ? employeeSelect : baseSelect, { count: "exact" })
    .eq("company_id", companyId);
  if (isCollaborator) {
    jobsQuery = jobsQuery.eq("job_assignments.employee_id", employee.id);
  }

  if (status !== "all") {
    jobsQuery = jobsQuery.eq("status", status);
  }
  if (from) {
    jobsQuery = jobsQuery.gte("scheduled_date", from);
  }
  if (to) {
    jobsQuery = jobsQuery.lte("scheduled_date", to);
  }
  if (orFilters.length > 0) {
    jobsQuery = jobsQuery.or(orFilters.join(","));
  }

  const ascending = dir !== "desc";
  if (sort === "title") {
    jobsQuery = jobsQuery.order("title", { ascending });
  } else if (sort === "customer") {
    jobsQuery = jobsQuery.order("customer_name", { ascending });
  } else if (sort === "status") {
    jobsQuery = jobsQuery.order("status", { ascending });
  } else {
    jobsQuery = jobsQuery.order("scheduled_date", { ascending });
    jobsQuery = jobsQuery.order("scheduled_time", { ascending });
  }

  const fromIndex = (safePage - 1) * PAGE_SIZE;
  const toIndex = fromIndex + PAGE_SIZE - 1;
  const { data, error, count } = await jobsQuery.range(fromIndex, toIndex);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const jobs = (data ?? []).map((row) => {
    const assignments = (row as {
      job_assignments?: Array<{ employee_id: string; employees?: { full_name?: string | null } }>;
    }).job_assignments ?? [];
    const assignedIds = assignments.map((assignment) => assignment.employee_id);
    const assignedNames = assignments
      .map((assignment) => assignment.employees?.full_name)
      .filter(Boolean)
      .join(", ");

    return {
      id: row.id,
      company_id: row.company_id,
      customer_id: row.customer_id,
      customer_name: row.customer_name,
      customer_address_id: row.customer_address_id,
      title: row.title,
      status: row.status,
      scheduled_for: toScheduledFor(row.scheduled_date, row.scheduled_time),
      estimated_end_at: row.estimated_end_at,
      notes: row.notes,
      is_recurring: row.is_recurring,
      recurrence: row.recurrence,
      assigned_employee_ids: assignedIds,
      assigned_label: assignedNames,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  });

  return NextResponse.json({
    data: jobs,
    total: count ?? 0,
    page: safePage,
    pageSize: PAGE_SIZE
  });
}

export async function POST(request: Request) {
  try {
    const user = await getSupabaseAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }
    const context = await getActiveCompanyContext();
    if (!context) {
      return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
    }
    if (context.role === "member") {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }
    const body = await request.json();
    const input = await newJobSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });

    const supabase = await createSupabaseServerClient();
    const companyId = context.companyId;

    const assignedIds = input.assignedEmployeeIds ?? [];
    const assignedEmployees = assignedIds.length
      ? (
          await supabase
            .from("employees")
            .select("id, user_id, is_active")
            .in("id", assignedIds)
        ).data ?? []
      : [];

    const assignedUserIds = assignedEmployees
      .map((row) => row.user_id)
      .filter(Boolean) as string[];

    const memberships = assignedUserIds.length
      ? (
          await supabase
            .from("company_memberships")
            .select("user_id")
            .eq("company_id", companyId)
            .eq("status", "active")
            .in("user_id", assignedUserIds)
        ).data ?? []
      : [];

    const membershipUserIds = new Set(
      memberships.map((item) => item.user_id as string)
    );

    const invalidAssignments = assignedEmployees.filter(
      (employeeRow) =>
        !employeeRow.user_id || !membershipUserIds.has(employeeRow.user_id)
    );

    if (invalidAssignments.length > 0) {
      return NextResponse.json(
        { error: "Colaboradores precisam estar na empresa ativa." },
        { status: 400 }
      );
    }

    const inactiveIds = assignedEmployees.filter(
      (employeeRow) => employeeRow.is_active === false
    );

    const allowInactive = Boolean(input.allowInactive);
    const canAllowInactive = context.role === "owner" || context.role === "admin";

    if (inactiveIds.length > 0 && (!allowInactive || !canAllowInactive)) {
      return NextResponse.json(
        { error: "EMPLOYEE_INACTIVE", message: "Colaborador inativo." },
        { status: 409 }
      );
    }

    const job = await createJob({
      title: input.title,
      status: input.status,
      scheduled_for: input.scheduledFor,
      estimated_end_at: input.estimatedEndAt,
      customer_name: input.customerName,
      customer_id: input.customerId || null,
      customer_address_id: input.customerAddressId || null,
      assigned_employee_ids: input.assignedEmployeeIds ?? [],
      allow_inactive_assignments: allowInactive,
      is_recurring: input.isRecurring ?? false,
      recurrence: input.recurrence ?? null,
      notes: input.notes ?? null
    });

    if (companyId) {
      await supabase.from("job_events").insert({
        company_id: companyId,
        job_id: job.id,
        event_type: "created",
        event_label: "Order created",
        from_status: null,
        to_status: job.status,
        occurred_at: job.created_at ?? new Date().toISOString(),
        created_by: user.id
      });
    }

    return NextResponse.json({ data: job }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Dados invalidos."
      },
      { status: 400 }
    );
  }
}
