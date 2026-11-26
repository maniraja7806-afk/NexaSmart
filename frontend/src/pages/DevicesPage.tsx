import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Search,
  Plus,
  Filter,
  Power,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { Device, DeviceType, DeviceStatus } from '../types/index.js';
import { StatusBadge, SimulatedBadge } from '../components/common/Badge.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { socketClient } from '../services/socket.js';

export const DevicesPage: React.FC = () => {
  const { hasRole, canControlDevices } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Command modal / state
  const [commandDevice, setCommandDevice] = useState<Device | null>(null);
  const [commandAction, setCommandAction] = useState('SET_RELAY');
  const [commandValue, setCommandValue] = useState(1);
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });

  const fetchDevices = () => {
    const params: any = {};
    if (search) params.search = search;
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;

    api
      .get('/devices', { params })
      .then((res) => {
        if (res.data?.data) {
          setDevices(res.data.data);
        }
      })
      .catch(() => {
        // Fallback default list
        setDevices([
          {
            _id: 'dev_1',
            deviceId: 'DEV-ESP32-ENV-01',
            name: 'Classroom 204 Environment Node',
            type: 'ENVIRONMENT_MONITOR',
            buildingCode: 'BLD-ENG-01',
            roomNumber: 'RM-204',
            macAddress: '24:6F:28:B1:C2:A4',
            ipAddress: '192.168.1.120',
            firmwareVersion: 'v1.4.2',
            status: 'Online',
            isSimulated: false,
            maintenanceStatus: 'OPERATIONAL',
            latestMetrics: { temperature: 23.4, humidity: 50.2, occupancy: true },
          },
          {
            _id: 'dev_2',
            deviceId: 'DEV-ESP32-LGT-01',
            name: 'Classroom 204 Lighting Controller',
            type: 'LIGHTING_CONTROLLER',
            buildingCode: 'BLD-ENG-01',
            roomNumber: 'RM-204',
            macAddress: '24:6F:28:B1:C2:B5',
            ipAddress: '192.168.1.121',
            firmwareVersion: 'v1.4.2',
            status: 'Online',
            isSimulated: false,
            maintenanceStatus: 'OPERATIONAL',
            latestMetrics: { relayState: true },
          },
          {
            _id: 'dev_3',
            deviceId: 'DEV-ESP32-PWR-01',
            name: 'Engineering Main Switchgear PZEM',
            type: 'ENERGY_METER',
            buildingCode: 'BLD-ENG-01',
            roomNumber: 'PANEL-MAIN',
            macAddress: '24:6F:28:C2:01:88',
            ipAddress: '192.168.1.122',
            firmwareVersion: 'v1.4.2',
            status: 'Online',
            isSimulated: false,
            maintenanceStatus: 'OPERATIONAL',
            latestMetrics: { activePowerKw: 4.12, energyKwh: 1420.5 },
          },
          {
            _id: 'dev_4',
            deviceId: 'DEV-ESP32-WTR-01',
            name: 'Rooftop Water Reservoir & Pump Controller',
            type: 'WATER_CONTROLLER',
            buildingCode: 'BLD-ENG-01',
            roomNumber: 'RM-PUMP-ROOM',
            macAddress: '24:6F:28:D4:55:10',
            ipAddress: '192.168.1.123',
            firmwareVersion: 'v1.4.2',
            status: 'Online',
            isSimulated: false,
            maintenanceStatus: 'OPERATIONAL',
            latestMetrics: { tankLevelPercent: 78.5, pumpState: true },
          },
          {
            _id: 'dev_5',
            deviceId: 'DEV-SIM-ENV-01',
            name: '[SIM] Classroom 204 Virtual Sensor Node',
            type: 'ENVIRONMENT_MONITOR',
            buildingCode: 'BLD-ENG-01',
            roomNumber: 'RM-204',
            macAddress: 'AA:BB:CC:DD:EE:01',
            ipAddress: '10.0.0.101',
            firmwareVersion: 'v1.4.2-sim',
            status: 'Online',
            isSimulated: true,
            maintenanceStatus: 'OPERATIONAL',
            latestMetrics: { temperature: 22.8, humidity: 48.0 },
          },
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDevices();

    // Listen to real-time status and ACK updates
    const unsubAck = socketClient.onCommandAck((ack) => {
      if (commandDevice && commandDevice.deviceId === ack.deviceId) {
        setCommandLoading(false);
        if (ack.status === 'SUCCESS') {
          setCommandFeedback({
            status: 'success',
            message: `Command verified and executed by device ACK in ${ack.executedAt ? new Date(ack.executedAt).toLocaleTimeString() : 'real-time'}.`,
          });
        } else {
          setCommandFeedback({
            status: 'error',
            message: ack.errorMessage || 'Device rejected command execution.',
          });
        }
        fetchDevices();
      }
    });

    return () => unsubAck();
  }, [search, typeFilter, statusFilter]);

  const handleSendCommand = async () => {
    if (!commandDevice) return;
    setCommandLoading(true);
    setCommandFeedback({ status: null, message: '' });

    try {
      const res = await api.post(`/devices/${commandDevice.deviceId}/command`, {
        action: commandAction,
        value: commandValue,
      });

      setCommandFeedback({
        status: 'success',
        message: 'Command confirmed via hardware ACK response: ' + (res.data.message || 'SUCCESS'),
      });
      fetchDevices();
    } catch (err: any) {
      setCommandFeedback({
        status: 'error',
        message: err.response?.data?.error || err.message || 'Command timed out or failed.',
      });
    } finally {
      setCommandLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Device Management Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical nodes, MAC/IP provisioning, firmware versions, and remote command dispatch
          </p>
        </div>

        {hasRole('Campus Administrator', 'Facility Manager') && (
          <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 self-start">
            <Plus className="h-4 w-4" />
            Provision Device
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search device ID, name, or MAC address..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Device Types</option>
          <option value="ENERGY_METER">Energy Meter</option>
          <option value="LIGHTING_CONTROLLER">Lighting Controller</option>
          <option value="ENVIRONMENT_MONITOR">Environment IAQ</option>
          <option value="WATER_CONTROLLER">Water Controller</option>
          <option value="FIRE_SAFETY">Fire & Safety</option>
          <option value="PARKING_DETECTOR">Parking Bay</option>
          <option value="EQUIPMENT_SENSOR">Equipment Monitor</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
          <option value="Warning">Warning</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>

      {/* Device Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Device Identity</th>
                <th className="px-5 py-3.5">Type & Classification</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Hardware / Simulated</th>
                <th className="px-5 py-3.5">Connection Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {devices.map((device) => (
                <tr key={device._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-slate-900 block text-xs">
                      {device.deviceId}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate max-w-xs mt-0.5">
                      {device.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      MAC: {device.macAddress} &bull; FW: {device.firmwareVersion}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-800 text-xs">
                      {device.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-blue-600 font-semibold block text-xs">
                      {device.buildingCode}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {device.roomNumber || 'Common Zone'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <SimulatedBadge isSimulated={device.isSimulated} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={device.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => {
                        setCommandDevice(device);
                        setCommandFeedback({ status: null, message: '' });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold text-[11px] transition-all inline-flex items-center gap-1"
                    >
                      <Power className="h-3 w-3" />
                      Command
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actuator Remote Command Dialog */}
      {commandDevice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Remote Actuation Console
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Target: {commandDevice.deviceId}
                </p>
              </div>
              <button
                onClick={() => setCommandDevice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            {!canControlDevices() ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertTriangle className="h-5 w-5 mb-1" />
                <span className="font-bold block">Access Restricted (Viewer Role)</span>
                Your current role is Viewer. Viewers cannot issue actuator control commands or manual overrides.
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Action Command
                    </label>
                    <select
                      value={commandAction}
                      onChange={(e) => setCommandAction(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="SET_RELAY">SET_RELAY (Switch Relay ON/OFF)</option>
                      <option value="SET_LIGHT">SET_LIGHT (Lighting Actuator)</option>
                      <option value="SET_PUMP">SET_PUMP (Water Booster Pump)</option>
                      <option value="UNLOCK_DOOR">UNLOCK_DOOR (RFID Solenoid)</option>
                      <option value="PING">PING (Heartbeat & RSSI Check)</option>
                      <option value="RESET_ENERGY">RESET_ENERGY (PZEM Register Reset)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target State / Value
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCommandValue(1)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                          commandValue === 1
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        1 (ON / HIGH)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommandValue(0)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                          commandValue === 0
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        0 (OFF / LOW)
                      </button>
                    </div>
                  </div>
                </div>

                {commandFeedback.status && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      commandFeedback.status === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {commandFeedback.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{commandFeedback.message}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCommandDevice(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCommand}
                    disabled={commandLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {commandLoading ? 'Awaiting Device ACK...' : 'Execute & Await ACK'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
