import { NextResponse } from "next/server";
import { getMetricsData } from "@/actions/metricActions";
import { withEEK } from "@/eek/withEEK";

export const GET = withEEK({
  resource: "metrics",
  action: "read",
  handler: async (ctx) => {
    try {
      const metrics = await getMetricsData();
      return NextResponse.json(metrics);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
});
