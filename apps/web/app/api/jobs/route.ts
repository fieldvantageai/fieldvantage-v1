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
  const unassigned = searchParams.get("unassigned") === "1";
  const sort = searchParams.get("sort") ?? "startDate";
  const dir = searchParams.get("dir") ?? "desc";
  const page = Number(searchParams.get("page") ?? "1");
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;

  const context = await getActiveCompanyContext();
  if (!context) {
    return NextResponse.json({ data: [], total: 0 }, { status: 200 });
  }
  const supabase = await createSupabaseServerClient();
  const companyId = context.companyId;
  const { data: membership } = await supabase
    .from("company_memberships")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  let jobIdsFromAssignments: string[] = [];
  if (query) {
    const { data: membershipUsers } = await supabase
      .from("company_memberships")
      .select("id, user_id")
      .eq("company_id", companyId)
      .eq("status", "active");
    const userIds =
      membershipUsers?.map((item) => item.user_id as string).filter(Boolean) ??
      [];
    const { data: matchedEmployees } = userIds.length
      ? await supabase
          .from("employees")
          .select("user_id")
          .in("user_id", userIds)
          .ilike("full_name", `%${query}%`)
      : { data: [] };
    const matchedUserIds = (matchedEmployees ?? [])
      .map((item) => item.user_id as string)
      .filter(Boolean);
    const membershipIds =
      membershipUsers
        ?.filter((row) => matchedUserIds.includes(row.user_id as string))
        .map((row) => row.id as string) ?? [];
    if (membershipIds.length > 0) {
      const { data: assignments } = await supabase
        .from("job_assignments")
        .select("job_id")
        .in("membership_id", membershipIds);
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
    "id, company_id, customer_id, customer_name, customer_address_id, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at, job_assignments(membership_id)";
  const employeeSelect =
    "id, company_id, customer_id, customer_name, customer_address_id, title, scheduled_date, scheduled_time, estimated_end_at, status, notes, is_recurring, recurrence, created_at, updated_at, job_assignments!inner(membership_id)";
  const isCollaborator = context.role === "member" && membership?.id;
  if (context.role === "member" && !membership?.id) {
    return NextResponse.json({ data: [], total: 0 }, { status: 200 });
  }

  let jobsQuery = supabase
    .from("jobs")
    .select(isCollaborator ? employeeSelect : baseSelect, { count: "exact" })
    .eq("company_id", companyId);
  if (isCollaborator && membership?.id) {
    jobsQuery = jobsQuery.eq("job_assignments.membership_id", membership.id);
  }
  if (isCollaborator && unassigned) {
    return NextResponse.json({ data: [], total: 0 }, { status: 200 });
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
  if (unassigned) {
    const { data: assignedRows } = await supabase
      .from("job_assignments")
      .select("job_id")
      .eq("company_id", companyId);
    const assignedIds = (assignedRows ?? [])
      .map((row) => row.job_id as string)
      .filter(Boolean);
    if (assignedIds.length > 0) {
      jobsQuery = jobsQuery.not("id", "in", `(${assignedIds.join(",")})`);
    }
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

  const assignmentMembershipIds = Array.from(
    new Set(
      (data ?? [])
        .flatMap((row) =>
          ((row as { job_assignments?: Array<{ membership_id: string }> })
            .job_assignments ?? [])
            .map((assignment) => assignment.membership_id)
        )
        .filter(Boolean)
    )
  );
  const { data: membershipRows } =
    assignmentMembershipIds.length > 0
      ? await supabase
          .from("company_memberships")
          .select("id, user_id")
          .in("id", assignmentMembershipIds)
      : { data: [] };
  const userIds = (membershipRows ?? [])
    .map((row) => row.user_id as string)
    .filter(Boolean);
  const { data: employeeRows } =
    userIds.length > 0
      ? await supabase
          .from("employees")
          .select("user_id, full_name")
          .in("user_id", userIds)
      : { data: [] };
  const nameByUserId = new Map<string, string>();
  (employeeRows ?? []).forEach((row) => {
    if (row.user_id && row.full_name) {
      nameByUserId.set(row.user_id as string, row.full_name as string);
    }
  });
  const nameByMembershipId = new Map<string, string>();
  (membershipRows ?? []).forEach((row) => {
    const name = nameByUserId.get(row.user_id as string);
    if (name) {
      nameByMembershipId.set(row.id as string, name);
    }
  });

  const jobs = (data ?? []).map((row) => {
    const assignments = (row as {
      job_assignments?: Array<{ membership_id: string }>;
    }).job_assignments ?? [];
    const assignedIds = assignments.map((assignment) => assignment.membership_id);
    const assignedNames = assignedIds
      .map((id) => nameByMembershipId.get(id))
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
      assigned_membership_ids: assignedIds,
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

    const assignedIds = input.assignedMembershipIds ?? [];
    const assignedMemberships = assignedIds.length
      ? (
          await supabase
            .from("company_memberships")
            .select("id, user_id, status, company_id")
            .in("id", assignedIds)
        ).data ?? []
      : [];

    const invalidAssignments = assignedMemberships.filter(
      (membership) =>
        membership.company_id !== companyId || !membership.user_id
    );

    if (invalidAssignments.length > 0) {
      return NextResponse.json(
        { error: "Colaboradores precisam estar na empresa ativa." },
        { status: 400 }
      );
    }

    const inactiveIds = assignedMemberships.filter(
      (membership) => membership.status !== "active"
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
      assigned_membership_ids: input.assignedMembershipIds ?? [],
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
