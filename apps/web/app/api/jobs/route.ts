import { NextResponse } from "next/server";

import { newJobSchema } from "@/features/jobs/forms/newJob/formSchema";
import { createJob } from "@/features/jobs/service";
import { getSupabaseAuthUser } from "@/features/_shared/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

const toScheduledFor = (date: string, time?: string | null) =>
  `${date}T${time?.slice(0, 5) ?? "00:00"}`;

const getCompanyIdForUser = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) => {
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (companyError) {
    throw companyError;
  }
  if (company?.id) {
    return company.id;
  }
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (employeeError) {
    throw employeeError;
  }
  return employee?.company_id ?? null;
};

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

  const supabase = await createSupabaseServerClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();
  const companyId = await getCompanyIdForUser(supabase, user.id);
  if (!companyId) {
    return NextResponse.json({ data: [], total: 0 }, { status: 200 });
  }

  let jobIdsFromAssignments: string[] = [];
  if (query) {
    const { data: matchedEmployees } = await supabase
      .from("employees")
      .select("id")
      .eq("company_id", companyId)
      .ilike("full_name", `%${query}%`);
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
    "id, company_id, customer_id, customer_name, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at, job_assignments(employee_id, employees(full_name))";
  const employeeSelect =
    "id, company_id, customer_id, customer_name, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at, job_assignments!inner(employee_id, employees(full_name))";
  const isCollaborator = employee?.role === "employee" && employee.id;

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
    const body = await request.json();
    const input = await newJobSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    });

    const supabase = await createSupabaseServerClient();
    const { data: company } = await supabase
      .from("companies")
      .select("id, owner_id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!company?.id) {
      return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
    }

    const inactiveIds =
      input.assignedEmployeeIds?.length
        ? (
            await supabase
              .from("employees")
              .select("id")
              .eq("company_id", company.id)
              .in("id", input.assignedEmployeeIds)
              .eq("is_active", false)
          ).data ?? []
        : [];

    const allowInactive = Boolean(input.allowInactive);
    const isOwner = company.owner_id === user.id;
    const isAdmin = !isOwner && user.email
      ? (
          await supabase
            .from("employees")
            .select("role")
            .eq("company_id", company.id)
            .eq("email", user.email)
            .maybeSingle()
        ).data?.role === "admin"
      : false;
    const canAllowInactive = isOwner || isAdmin;

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
      assigned_employee_ids: input.assignedEmployeeIds ?? [],
      allow_inactive_assignments: allowInactive,
      is_recurring: input.isRecurring ?? false,
      recurrence: input.recurrence ?? null,
      notes: input.notes ?? null
    });

    if (company?.id) {
      await supabase.from("job_events").insert({
        company_id: company.id,
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
