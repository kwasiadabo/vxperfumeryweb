import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { money } from '../../lib/format';
import RevenueTrendChart from '../../components/RevenueTrendChart';
import OrderStatusPipeline from '../../components/OrderStatusPipeline';

function Stat({ label, value, sub }) {
  return (
    <div className="bg-white border border-black/5 rounded-lg p-5">
      <p className="text-xs uppercase tracking-widest text-black/40">{label}</p>
      <p className="text-2xl font-medium mt-1">{value}</p>
      {sub && <p className="text-xs text-black/40 mt-1">{sub}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function formatHours(hours) {
  if (!hours) return '—';
  return hours >= 48 ? `${(hours / 24).toFixed(1)}d` : `${hours.toFixed(1)}h`;
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.isAdmin) return navigate('/');
    api.get('/admin/dashboard').then((res) => setData(res.data)).catch(() => {});
  }, [user, navigate]);

  if (!user?.isAdmin) return null;

  return (
    <div className="w-full mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">Admin Dashboard</h1>

      {data ? (
        <>
          <Section title="Revenue">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Stat label="Total Revenue" value={`GHS ${money(data.revenue.total)}`} />
              <Stat label="Revenue Today" value={`GHS ${money(data.revenue.today)}`} />
              <Stat label="Revenue This Month" value={`GHS ${money(data.revenue.month)}`} />
              <Stat label="Avg Order Value" value={`GHS ${money(data.revenue.averageOrderValue)}`} />
              <Stat
                label="Gross Profit"
                value={`GHS ${money(data.revenue.grossProfit)}`}
                sub={`${data.revenue.profitMarginPct.toFixed(1)}% margin on product sales`}
              />
              <Stat
                label="Product vs Delivery"
                value={`GHS ${money(data.revenue.totalProduct)}`}
                sub={`+ GHS ${money(data.revenue.totalDelivery)} delivery fees`}
              />
            </div>

            <div className="mt-4 bg-white border border-black/5 rounded-lg p-5">
              <p className="text-xs uppercase tracking-widest text-black/40 mb-4">Revenue — Last 30 Days</p>
              <RevenueTrendChart data={data.revenueTrend} />
            </div>
          </Section>

          <Section title="Orders">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Stat label="Total Orders" value={data.orders.total} />
              <Stat label="Orders Today" value={data.orders.today} />
              <Stat label="Orders This Month" value={data.orders.month} />
            </div>
            <div className="mt-4 bg-white border border-black/5 rounded-lg p-5">
              <p className="text-xs uppercase tracking-widest text-black/40 mb-4">Order Pipeline</p>
              <OrderStatusPipeline byStatus={data.orders.byStatus} />
            </div>
          </Section>

          <div className="grid md:grid-cols-2 gap-x-8">
            <Section title="Customers">
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Total Customers" value={data.customers.total} />
                <Stat label="New This Month" value={data.customers.newThisMonth} />
                <Stat label="Repeat Customer Rate" value={`${data.customers.repeatRate.toFixed(1)}%`} />
              </div>
            </Section>

            <Section title="Delivery">
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Active Riders" value={data.delivery.activeRiders} />
                <Stat label="Awaiting Dispatch" value={data.delivery.awaitingDispatch} />
                <Stat label="Out for Delivery" value={data.delivery.outForDelivery} />
                <Stat label="Avg Delivery Time" value={formatHours(data.delivery.avgDeliveryHours)} />
              </div>
            </Section>

            <Section title="Inventory">
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Active Products" value={data.inventory.activeProducts} />
                <Stat label="Low Stock Items" value={data.inventory.lowStockCount} />
                <Stat label="Out of Stock" value={data.inventory.outOfStockCount} />
              </div>
            </Section>

            <Section title="Support">
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Open Issues" value={data.issues.open} />
                <Stat label="Issues This Month" value={data.issues.thisMonth} />
              </div>
            </Section>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <div>
              <h2 className="font-display text-2xl">Top Products</h2>
              <div className="mt-4 bg-white border border-black/5 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-black/[0.03] text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Units</th>
                      <th className="px-4 py-3 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((row) => (
                      <tr key={row.ProductId} className="border-t border-black/5">
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3">{row.unitsSold}</td>
                        <td className="px-4 py-3">GHS {money(row.revenue ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl">Top Brands</h2>
              <div className="mt-4 bg-white border border-black/5 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-black/[0.03] text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Brand</th>
                      <th className="px-4 py-3 font-medium">Units</th>
                      <th className="px-4 py-3 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topBrands.map((row) => (
                      <tr key={row.brandId} className="border-t border-black/5">
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3">{row.unitsSold}</td>
                        <td className="px-4 py-3">GHS {money(row.revenue ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-8 text-black/40">Loading metrics…</p>
      )}
    </div>
  );
}
