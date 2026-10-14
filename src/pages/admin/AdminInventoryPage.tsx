import React, { useState } from 'react';
import { GEAR_ITEMS, OUTPOSTS } from '../../data/mockData';
import { Card, Button, Badge } from '../../components/ui';
import { Package, Search, Truck, ArrowRight, Layers, Sliders } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

export const AdminInventoryPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredGear = GEAR_ITEMS.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.brand.toLowerCase().includes(q) || g.modelCode.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">CENTRAL QUARTERMASTER</Badge>
            <span className="text-xs text-[#5C665F]">5 ACTIVE BASECAMPS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            National Multi-Branch Inventory Matrix
          </h1>
          <p className="text-xs text-[#5C665F]">
            Real-time stock balance across northern mountain passes, karst vaults, and southern highland depots.
          </p>
        </div>

        <Link to="/admin/transfers">
          <Button variant="accent" size="md" icon={<Truck className="w-4 h-4" />}>
            Dispatch Inter-Branch Shuttle
          </Button>
        </Link>
      </div>

      {/* Search Input */}
      <div className="w-full max-w-sm relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by equipment model, brand, SKU..."
          className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs pl-8 pr-3 py-1.5 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] font-body"
        />
        <Search className="w-3.5 h-3.5 text-[#7A857E] absolute left-2.5 top-2.5 pointer-events-none" />
      </div>

      {/* Multi-Branch Inventory Matrix Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-label">
            <thead className="bg-[#EBE6DC] text-[#7A857E] border-b border-[#D8D2C5] uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Equipment Specimen</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Tariff (Rent / MSRP)</th>
                {OUTPOSTS.map((st) => (
                  <th key={st.id} className="p-3.5 text-center">
                    <div>{st.code}</div>
                    <div className="text-[8px] font-normal text-[#5C665F]">{st.name.replace(' Outpost', '').replace(' Station', '')}</div>
                  </th>
                ))}
                <th className="p-3.5 text-right">Total Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D2C5]">
              {filteredGear.map((item) => {
                const totalStock = Object.values(item.stockByOutpost).reduce((a, b) => a + b, 0);

                return (
                  <tr key={item.id} className="hover:bg-[#EBE6DC]/30 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-[#111D16]">{item.name}</div>
                      <div className="text-[10px] text-[#7A857E] font-mono-spec">
                        {item.brand} • SKU: {item.modelCode}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="neutral">{item.category}</Badge>
                    </td>
                    <td className="p-3.5 font-mono-spec text-[11px]">
                      <span className="font-bold text-[#152A20]">${item.dailyRentalPrice}/d</span>
                      <span className="text-[#7A857E] ml-1">(${item.retailPrice})</span>
                    </td>
                    {OUTPOSTS.map((st) => {
                      const count = item.stockByOutpost[st.id] || 0;
                      return (
                        <td key={st.id} className="p-3.5 text-center font-mono-spec">
                          <span className={`px-2 py-0.5 rounded-xs font-bold ${
                            count > 0 ? 'bg-[#E0EFE6] text-[#152A20]' : 'bg-[#EBE6DC] text-[#7A857E]'
                          }`}>
                            {count}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-3.5 text-right font-bold text-[#111D16] font-mono-spec">
                      {totalStock} Units
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
