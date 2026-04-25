"use client";

import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { budgetData, equityComparison } from "@/lib/mockData";

const TOTAL_BUDGET = 2155; // $ per resident annually

function DonutTooltip({ active, payload }: { active?: boolean; payload?: { payload: typeof budgetData[0] }[] }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const sign = d.yoyChange > 0 ? "+" : "";
    return (
      <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100 text-sm">
        <div className="font-bold text-[#1B2A4A]">{d.name}</div>
        <div className="text-gray-600 mt-0.5">${d.perResident}/resident/year</div>
        <div className={`text-xs mt-1 font-semibold ${d.yoyChange > 0 ? "text-[#4A7C59]" : "text-[#E06B5A]"}`}>
          {sign}{d.yoyChange}% vs last year
        </div>
      </div>
    );
  }
  return null;
}

function EquityTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100 text-sm">
        <div className="font-bold text-[#1B2A4A] mb-1">{label}</div>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-600">{p.name}:</span>
            <span className="font-semibold">${p.value}/resident</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function BudgetChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [rentInput, setRentInput] = useState("2800");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const monthlyRent = parseFloat(rentInput) || 0;
  const annualRent = monthlyRent * 12;
  const taxShare = annualRent * 0.017; // ~1.7% effective property/sales tax contribution

  const equityData = equityComparison.map(d => ({
    category: d.category,
    "Your neighborhood": d.yours,
    "City average": d.cityAvg,
    gap: d.gap,
  }));

  const biggestGap = [...equityComparison].sort((a, b) => a.gap - b.gap)[0];

  return (
    <div ref={ref} className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Donut chart */}
        <div>
          <h3 className="font-bold text-[#1B2A4A] text-xl mb-1">Oakland City Budget</h3>
          <p className="text-sm text-gray-500 mb-6">2023–24 · ${TOTAL_BUDGET.toLocaleString()} per resident annually</p>

          {/* Legend pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {budgetData.map((d, i) => (
              <button
                key={i}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150"
                style={{
                  backgroundColor: activeIndex === i ? d.color : "white",
                  borderColor: activeIndex === i ? d.color : "#E5E7EB",
                  color: activeIndex === i ? "white" : "#374151",
                }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                {d.name} {d.value}%
              </button>
            ))}
          </div>

          <div className="relative h-72">
            {inView && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetData}
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {budgetData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    {activeIndex !== null ? (
                      <>
                        <div className="font-bold text-xl text-[#1B2A4A]">{budgetData[activeIndex].value}%</div>
                        <div className="text-xs text-gray-500">{budgetData[activeIndex].name}</div>
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-lg text-[#1B2A4A]">$2,155</div>
                        <div className="text-xs text-gray-500">per resident</div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Equity comparison */}
        <div>
          <h3 className="font-bold text-[#1B2A4A] text-xl mb-1">Neighborhood Equity</h3>
          <p className="text-sm text-gray-500 mb-2">Temescal vs. Oakland average · per resident annually</p>

          {/* Stark gap callout */}
          <div className="mb-6 px-4 py-3 rounded-xl border-l-4" style={{ backgroundColor: "#FEF3E0", borderColor: "#E8A020" }}>
            <span className="text-sm font-bold text-[#1B2A4A]">
              Your neighborhood receives ${Math.abs(biggestGap.gap)} less per resident in {biggestGap.category.toLowerCase()} funding than the city average.
            </span>
          </div>

          {inView && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equityData} layout="vertical" margin={{ left: 16, right: 8, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }} width={70} />
                  <Tooltip content={<EquityTooltip />} />
                  <Bar dataKey="Your neighborhood" fill="#1B2A4A" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="City average" fill="#E8A020" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#1B2A4A" }} />
              Your neighborhood
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#E8A020" }} />
              City average
            </div>
          </div>
        </div>
      </div>

      {/* Tax calculator */}
      <div className="bg-white rounded-[12px] border border-gray-100 p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <h3 className="font-bold text-[#1B2A4A] text-lg mb-1">What You Fund</h3>
        <p className="text-sm text-gray-500 mb-4">Enter your monthly rent or home payment to see your estimated annual tax contribution</p>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-bold text-gray-300">$</span>
          <input
            type="number"
            value={rentInput}
            onChange={(e) => setRentInput(e.target.value)}
            className="w-32 text-2xl font-bold text-[#1B2A4A] border-b-2 border-[#E8A020] bg-transparent outline-none text-center pb-1"
            placeholder="2800"
          />
          <span className="text-gray-400 text-sm">/month</span>
          <span className="text-xs text-gray-400 ml-2">→ ~${taxShare.toFixed(0)}/yr in taxes</span>
        </div>

        {monthlyRent > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {budgetData.map((d, i) => {
              const amount = (taxShare * d.value) / 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="text-xs text-gray-600 w-20 flex-shrink-0">{d.name}</div>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${d.value}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                  </div>
                  <div className="text-xs font-bold text-[#1B2A4A] w-12 text-right">${amount.toFixed(0)}</div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
