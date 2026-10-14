import React, { useState } from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { Users, Plus, ShieldCheck, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';

export const AdminStaffPage: React.FC = () => {
  const staffMembers = [
    {
      id: 'st-01',
      name: 'Ranger Tran Minh',
      role: 'Head Station Armourer',
      station: 'Sapa Ridge Outpost',
      certifications: ['UIAGM Alpine Rigging', 'Autoclave Bio-Clear', 'Wilderness First Responder'],
      status: 'ON_DUTY',
    },
    {
      id: 'st-02',
      name: 'Captain Vu Hoang',
      role: 'Lead Mountain Guide',
      station: 'Ha Giang Frontier',
      certifications: ['IFMGA Mountain Guide', 'Avalanche Safety Level 3'],
      status: 'IN_FIELD',
    },
    {
      id: 'st-03',
      name: 'Le Thu Trang',
      role: 'Highland Logistics Coordinator',
      station: 'Da Lat Highland Depot',
      certifications: ['ISO 9001 Lead Auditor', 'Radio Telemetry Operator'],
      status: 'ON_DUTY',
    },
    {
      id: 'st-04',
      name: 'Nguyen Tuan Anh',
      role: 'Speleo Operations Specialist',
      station: 'Phong Nha Vault',
      certifications: ['Cave Rescue Level 2', 'Single Rope Technique Specialist'],
      status: 'STANDBY',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">HUMAN CAPITAL & ARMOURERS</Badge>
            <span className="text-xs text-[#5C665F]">18 ACTIVE RANGERS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Staff & Field Ranger Registry
          </h1>
          <p className="text-xs text-[#5C665F]">
            Station armourers, UIAGM expedition leads, and certified rigging technicians across all depots.
          </p>
        </div>

        <Button variant="accent" size="md" icon={<Plus className="w-4 h-4" />}>
          Register Field Ranger
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staffMembers.map((member) => (
          <Card key={member.id} padding="md" className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xs bg-[#152A20] text-white flex items-center justify-center font-bold text-sm">
                  {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#111D16] font-headline">{member.name}</h3>
                  <div className="text-xs text-[#D97845] font-semibold">{member.role}</div>
                </div>
              </div>
              <Badge variant={member.status === 'ON_DUTY' ? 'success' : member.status === 'IN_FIELD' ? 'warning' : 'neutral'}>
                {member.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="text-xs text-[#5C665F] space-y-1 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#152A20]" />
                <span>Station: <strong className="text-[#111D16]">{member.station}</strong></span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#D8D2C5]">
              <span className="text-[10px] text-[#7A857E] font-bold block uppercase mb-1">CERTIFICATIONS & LICENSES:</span>
              <div className="flex flex-wrap gap-1">
                {member.certifications.map((c) => (
                  <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-xs bg-[#EBE6DC] text-[#111D16] border border-[#D8D2C5] font-semibold">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
