import { AutomationRule, AutomationExecution, Device } from '../models/index.js';
import { commandService } from './commandService.js';
import { alertService } from './alertService.js';

class AutomationEngine {
  public async evaluateRules(
    deviceId: string,
    buildingCode: string,
    roomNumber: string,
    metrics: Record<string, any>
  ): Promise<void> {
    try {
      // Find active rules for this building and either this specific room or whole building
      const activeRules = await AutomationRule.find({
        buildingCode,
        isEnabled: true,
        $or: [{ roomNumber }, { roomNumber: { $exists: false } }, { roomNumber: '' }, { roomNumber: null }],
      });

      if (!activeRules || activeRules.length === 0) return;

      const currentHour = new Date().getHours();
      const currentDay = new Date().getDay();

      for (const rule of activeRules) {
        // Schedule check
        if (rule.scheduleStartHour !== undefined && rule.scheduleEndHour !== undefined) {
          if (currentHour < rule.scheduleStartHour || currentHour >= rule.scheduleEndHour) {
            continue;
          }
        }
        if (rule.scheduleDays && rule.scheduleDays.length > 0) {
          if (!rule.scheduleDays.includes(currentDay)) {
            continue;
          }
        }

        const readingVal = metrics[rule.metricKey];
        if (readingVal === undefined) continue;

        const isTriggered = this.checkCondition(readingVal, rule.condition, rule.threshold);
        if (!isTriggered) continue;

        // Anti-flapping: don't re-trigger within durationSeconds or 15 seconds
        const cooldown = (rule.durationSeconds || 15) * 1000;
        if (rule.lastTriggeredAt && Date.now() - new Date(rule.lastTriggeredAt).getTime() < cooldown) {
          continue;
        }

        // Execute action
        await this.executeAction(rule, readingVal);
      }
    } catch (err: any) {
      console.warn(`[Automation Engine Evaluation Error]`, err.message);
    }
  }

  private checkCondition(val: any, cond: string, thresh: any): boolean {
    const numVal = Number(val);
    const numThresh = Number(thresh);
    const isNumeric = !isNaN(numVal) && !isNaN(numThresh);

    switch (cond) {
      case 'GT':
        return isNumeric ? numVal > numThresh : val > thresh;
      case 'GTE':
        return isNumeric ? numVal >= numThresh : val >= thresh;
      case 'LT':
        return isNumeric ? numVal < numThresh : val < thresh;
      case 'LTE':
        return isNumeric ? numVal <= numThresh : val <= thresh;
      case 'EQ':
        return val == thresh;
      case 'NEQ':
        return val != thresh;
      default:
        return false;
    }
  }

  private async executeAction(rule: any, triggerReading: any): Promise<void> {
    let success = false;
    let errMsg: string | undefined;

    try {
      if (rule.action === 'SET_RELAY' || rule.action === 'TRIGGER_PUMP' || rule.action === 'TRIGGER_BUZZER' || rule.action === 'LOCK_DOOR') {
        const actionMap: Record<string, string> = {
          SET_RELAY: 'SET_RELAY',
          TRIGGER_PUMP: 'SET_PUMP',
          TRIGGER_BUZZER: 'BEEP',
          LOCK_DOOR: 'LOCK_DOOR',
        };

        const targetDev = await Device.findOne({ deviceId: rule.actionTargetDevice });
        if (targetDev && targetDev.status !== 'Offline') {
          await commandService.issueCommand({
            deviceId: rule.actionTargetDevice,
            action: actionMap[rule.action] || rule.action,
            value: rule.actionPayload?.value !== undefined ? rule.actionPayload.value : 1,
            issuedBy: `AUTOMATION_ENGINE:${rule.name}`,
            waitForAckMs: 4000,
          });
          success = true;
        } else {
          errMsg = `Target device ${rule.actionTargetDevice} is offline or unavailable`;
        }
      } else if (rule.action === 'SEND_ALERT') {
        await alertService.createAlert({
          deviceId: rule.actionTargetDevice,
          buildingCode: rule.buildingCode,
          roomNumber: rule.roomNumber,
          category: 'TEMPERATURE_THRESHOLD',
          severity: 'HIGH',
          title: `Automation Triggered: ${rule.name}`,
          description: `Rule "${rule.name}" triggered by reading ${rule.metricKey} = ${triggerReading} (Threshold: ${rule.threshold})`,
        });
        success = true;
      }

      await AutomationRule.findByIdAndUpdate(rule._id, { $set: { lastTriggeredAt: new Date() } });
    } catch (err: any) {
      errMsg = err.message;
      success = false;
    }

    // Record execution audit log
    await AutomationExecution.create({
      ruleId: rule.ruleId,
      ruleName: rule.name,
      buildingCode: rule.buildingCode,
      triggeredAt: new Date(),
      triggerReading,
      actionExecuted: rule.action,
      targetDevice: rule.actionTargetDevice,
      executionSuccess: success,
      errorMessage: errMsg,
    });
  }
}

export const automationEngine = new AutomationEngine();
