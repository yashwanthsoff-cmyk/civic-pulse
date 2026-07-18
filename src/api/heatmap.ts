import { request } from "./_client";
export async function getHeatmap(timeOfDay: "all" | "day" | "night") {
  return request<{
    points: Array<{ latitude: number; longitude: number; weight: number }>;
    totalReports: number;
  }>(`/heatmap?timeOfDay=${timeOfDay}`);
}
