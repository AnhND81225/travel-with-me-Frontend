import React, { useState } from 'react';
import { GEAR_ITEMS } from '../../data/mockData';
import { Card, Button, Badge } from '../../components/ui';
import { Layers, Plus, Search, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const AdminCatalogPage: React.FC = () => {
  const [items, setItems] = useState(GEAR_ITEMS);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">CATALOG MANAGEMENT</Badge>
            <span className="text-xs text-[#5C665F]">{items.length} SPECIMENS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Products & Expedition Gear Catalog
          </h1>
          <p className="text-xs text-[#5C665F]">
            Configure retail MSRP, field daily rental tariffs, security bonds, and technical lab specifications.
          </p>
        </div>

        <Button variant="accent" size="md" icon={<Plus className="w-4 h-4" />}>
          Add New Expedition Model
        </Button>
      </div>

      <div className="w-full max-w-sm relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name, brand, category..."
          className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs pl-8 pr-3 py-1.5 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] font-body"
        />
        <Search className="w-3.5 h-3.5 text-[#7A857E] absolute left-2.5 top-2.5 pointer-events-none" />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-label">
            <thead className="bg-[#EBE6DC] text-[#7A857E] border-b border-[#D8D2C5] uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Model / Image</th>
                <th className="p-3.5">Brand</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Capability</th>
                <th className="p-3.5">Rental Daily</th>
                <th className="p-3.5">Retail MSRP</th>
                <th className="p-3.5">Deposit Bond</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D2C5]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#EBE6DC]/30 transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xs object-cover bg-[#E7E2D8] border border-[#D8D2C5]" />
                      <div>
                        <div className="font-bold text-[#111D16]">{item.name}</div>
                        <div className="text-[10px] text-[#7A857E] font-mono-spec">SKU: {item.modelCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-bold text-[#D97845]">{item.brand}</td>
                  <td className="p-3.5">
                    <Badge variant="neutral">{item.category}</Badge>
                  </td>
                  <td className="p-3.5">
                    <Badge variant={item.capability === 'BUY_ONLY' ? 'secondary' : item.capability === 'RENT_ONLY' ? 'warning' : 'primary'}>
                      {item.capability.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-mono-spec font-bold text-[#152A20]">
                    ${item.dailyRentalPrice}/day
                  </td>
                  <td className="p-3.5 font-mono-spec font-bold text-[#111D16]">
                    ${item.retailPrice}
                  </td>
                  <td className="p-3.5 font-mono-spec text-[#5C665F]">
                    ${item.depositAmount}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 text-[#5C665F] hover:text-[#111D16] cursor-pointer" title="Edit specifications">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
