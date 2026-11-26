import mongoose, { Schema, Document } from 'mongoose';

export type ConditionOperator = 'GT' | 'LT' | 'EQ' | 'GTE' | 'LTE' | 'NEQ';

export interface IAutomationRule extends Document {
  ruleId: string;
  name: string;
  description?: string;
  buildingCode: string;
  roomNumber?: string;
  sensorType: string; // e.g. 'occupancy', 'lightLux', 'temperature', 'tankLevelPercent', 'leakDetected'
  metricKey: string;
  condition: ConditionOperator;
  threshold: number | boolean | string;
  action: 'SET_RELAY' | 'SEND_ALERT' | 'TRIGGER_PUMP' | 'TRIGGER_BUZZER' | 'LOCK_DOOR';
  actionTargetDevice: string;
  actionPayload?: Record<string, any>;
  durationSeconds?: number;
  isEnabled: boolean;
  scheduleDays?: number[]; // [0,1,2,3,4,5,6]
  scheduleStartHour?: number;
  scheduleEndHour?: number;
  lastTriggeredAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AutomationRuleSchema = new Schema<IAutomationRule>(
  {
    ruleId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    buildingCode: { type: String, required: true, uppercase: true, index: true },
    roomNumber: { type: String },
    sensorType: { type: String, required: true },
    metricKey: { type: String, required: true },
    condition: {
      type: String,
      required: true,
      enum: ['GT', 'LT', 'EQ', 'GTE', 'LTE', 'NEQ'],
    },
    threshold: { type: Schema.Types.Mixed, required: true },
    action: {
      type: String,
      required: true,
      enum: ['SET_RELAY', 'SEND_ALERT', 'TRIGGER_PUMP', 'TRIGGER_BUZZER', 'LOCK_DOOR'],
    },
    actionTargetDevice: { type: String, required: true, uppercase: true },
    actionPayload: { type: Schema.Types.Mixed, default: {} },
    durationSeconds: { type: Number, default: 0 },
    isEnabled: { type: Boolean, default: true, index: true },
    scheduleDays: [{ type: Number }],
    scheduleStartHour: { type: Number, default: 0 },
    scheduleEndHour: { type: Number, default: 24 },
    lastTriggeredAt: { type: Date },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const AutomationRule = mongoose.model<IAutomationRule>('AutomationRule', AutomationRuleSchema);

// Execution History Log
export interface IAutomationExecution extends Document {
  ruleId: string;
  ruleName: string;
  buildingCode: string;
  triggeredAt: Date;
  triggerReading: any;
  actionExecuted: string;
  targetDevice: string;
  executionSuccess: boolean;
  errorMessage?: string;
}

const AutomationExecutionSchema = new Schema<IAutomationExecution>(
  {
    ruleId: { type: String, required: true, index: true },
    ruleName: { type: String, required: true },
    buildingCode: { type: String, required: true, uppercase: true },
    triggeredAt: { type: Date, default: Date.now, index: true },
    triggerReading: { type: Schema.Types.Mixed },
    actionExecuted: { type: String, required: true },
    targetDevice: { type: String, required: true },
    executionSuccess: { type: Boolean, required: true },
    errorMessage: { type: String },
  },
  { timestamps: false }
);

export const AutomationExecution = mongoose.model<IAutomationExecution>(
  'AutomationExecution',
  AutomationExecutionSchema
);
