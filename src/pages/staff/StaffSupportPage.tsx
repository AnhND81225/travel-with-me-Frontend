import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card, Button, Badge } from '../../components/ui';
import { 
  Headphones, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Send,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StaffSupportPage: React.FC = () => {
  const { selectedStation } = useAppStore();
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const incidents = [
    {
      id: 'inc-01',
      climber: 'Maya Chen (Fansipan Squad)',
      time: '14:20 Today',
      severity: 'HIGH_PRIORITY',
      issue: 'Gale storm advisory: Requesting +1 day bivouac extension at 2,800m station camp.',
      status: 'APPROVED',
    },
    {
      id: 'inc-02',
      climber: 'Marcus Vance',
      time: '11:05 Today',
      severity: 'ADVISORY',
      issue: 'Zipper frost jamming inquiry on Hilleberg Keron 4 GT. Advised dry PTFE lube protocol.',
      status: 'RESOLVED',
    },
    {
      id: 'inc-03',
      climber: 'David Kim',
      time: 'Yesterday',
      severity: 'LOGISTICS',
      issue: 'Requested dropoff depot switch from Sapa Ridge to Hanoi HQ.',
      status: 'AUTHORIZED',
    },
  ];

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastMessage('');
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">FIELD COMMUNICATIONS LINK</Badge>
            <span className="text-xs text-[#5C665F]">STATION: {selectedStation.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Customer Support & Field Radio Telemetry
          </h1>
          <p className="text-xs text-[#5C665F]">
            Direct customer assistance, mountain beacon check-ins, rental duration extensions, and station broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#E0EFE6] border border-[#ADCBBB] px-3 py-1.5 rounded-xs text-xs font-bold text-[#152A20]">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Iridium 406.037 MHz Channel Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Support Tickets & Incidents (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-bold text-sm text-[#111D16] uppercase tracking-wider">
            RECENT FIELD COMMUNICATIONS & REQUESTS
          </h3>

          <div className="space-y-3">
            {incidents.map((inc) => (
              <Card key={inc.id} padding="md" className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant={inc.severity === 'HIGH_PRIORITY' ? 'danger' : 'warning'}>
                      {inc.severity.replace(/_/g, ' ')}
                    </Badge>
                    <span className="font-bold text-[#111D16]">{inc.climber}</span>
                  </div>
                  <span className="text-[10px] text-[#7A857E] font-mono-spec">{inc.time}</span>
                </div>
                <p className="text-xs text-[#5C665F] font-body">{inc.issue}</p>
                <div className="pt-2 border-t border-[#D8D2C5] flex justify-between items-center text-xs">
                  <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Status: {inc.status}
                  </span>
                  <Link to="/staff/rentals" className="text-[#D97845] hover:underline font-bold text-[11px]">
                    Open Custody File →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Emergency Broadcast & Weather Advisory Console (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card padding="md" className="space-y-4">
            <div className="border-b border-[#D8D2C5] pb-3">
              <h3 className="font-bold text-sm text-[#111D16] uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D97845]" />
                BROADCAST SUMMIT ADVISORY
              </h3>
              <p className="text-[11px] text-[#5C665F] font-body mt-0.5">
                Transmit urgent meteorological weather advisory to all active field GPS receivers.
              </p>
            </div>

            {broadcastSent && (
              <div className="p-3 bg-[#E0EFE6] border border-[#ADCBBB] rounded-xs text-xs font-bold text-[#152A20] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Advisory transmitted to 14 active squads on Sapa Ridge.</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-3">
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="E.g., Gale force 60km/h winds approaching summit pass at 16:00. Secure Kerlon storm guys and establish bivouac."
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2.5 text-xs text-[#111D16] placeholder-[#7A857E] font-body focus:outline-none focus:border-[#152A20]"
              />

              <Button
                variant="accent"
                size="md"
                fullWidth
                type="submit"
                disabled={!broadcastMessage.trim()}
                icon={<Send className="w-4 h-4" />}
              >
                Send Radio Alert
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
