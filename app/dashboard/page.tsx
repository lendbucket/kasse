import { DashboardClock } from "./DashboardClock";
import { DollarSign, Calendar, Users, Receipt } from "lucide-react";

type Stat = {
  label: string;
  value: string;
  icon: typeof DollarSign;
  mono?: boolean;
};

const STATS: Stat[] = [
  { label: "Today's Revenue", value: "$0.00", icon: DollarSign, mono: true },
  { label: "Appointments Today", value: "0", icon: Calendar, mono: true },
  { label: "Clients Served", value: "0", icon: Users, mono: true },
  { label: "Avg Ticket", value: "$0.00", icon: Receipt, mono: true },
];

const LOCATION_NAME = "Main Location";

export default function DashboardPage() {
  return (
    <>
      <header className="flex flex-col gap-2 border-b border-[#1a2332] bg-[#0d1117] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#606e74]">
            Location
          </p>
          <h1 className="text-xl font-semibold text-white">{LOCATION_NAME}</h1>
        </div>
        <DashboardClock />
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-[#1a2332] bg-[#0d1117] p-5 transition-colors duration-150 hover:border-[#606e74]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-[#606e74]">
                    {stat.label}
                  </p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1a2332] bg-[#06080d]">
                    <Icon size={16} className="text-[#7a8f96]" />
                  </div>
                </div>
                <p
                  className={`mt-4 text-3xl font-semibold text-white ${
                    stat.mono ? "font-mono" : ""
                  }`}
                >
                  {stat.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              Recent Appointments
            </h2>
            <span className="text-xs uppercase tracking-wider text-[#606e74]">
              Last 5
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#1a2332] bg-[#0d1117]">
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <Calendar size={28} className="text-[#606e74]" />
              <p className="text-sm text-[#7a8f96]">No appointments yet</p>
              <p className="text-xs text-[#606e74]">
                Scheduled visits will appear here
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
