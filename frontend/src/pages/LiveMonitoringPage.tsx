import React, { useState, useEffect } from 'react';
import { Activity, Radio, Cpu, Wifi } from 'lucide-react';
import { socketClient } from '../services/socket.js';
import { StatusBadge, SimulatedBadge } from '../components/common/Badge.js';

export const LiveMonitoringPage: React.FC = () => {
  const [liveStream, setLiveStream] = useState<any[]>([]);

  useEffect(() => {
    const unsub = socketClient.onTelemetry((telemetry) => {
      setLiveStream((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          ...telemetry,
          arrivedAt: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 30),
      ]);
    });

    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Real-Time Telemetry Stream
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Low-latency Socket.IO event ingestion pipe direct from Mosquitto / Aedes MQTT Broker
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
            Live Full-Duplex Socket
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600" />
          Ingested Packet Stream ({liveStream.length} Packets Buffered)
        </h2>

        {liveStream.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Awaiting incoming telemetry packets... Ensure hardware nodes or simulator are active.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Received Time</th>
                  <th className="px-4 py-3">Device ID</th>
                  <th className="px-4 py-3">Building & Zone</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">Payload Metrics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {liveStream.map((packet) => (
                  <tr key={packet.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 font-sans">{packet.arrivedAt}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{packet.deviceId}</td>
                    <td className="px-4 py-3 text-blue-600">
                      {packet.buildingCode} &bull; {packet.roomNumber}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <SimulatedBadge isSimulated={packet.isSimulated} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-md truncate">
                      {JSON.stringify(packet.metrics)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
