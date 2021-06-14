import { hasPermission, requestPermission } from 'nativescript-permissions';
import * as Application from "tns-core-modules/application";
import { LocalEventEmitter } from './LocalEventEmitter';
import { SMSEvents, DialEvents } from './interfaces';
export { DialEvents, SMSEvents } from './interfaces';
export const NSPhoneEventEmitter = new LocalEventEmitter();
export function dial(telNum, prompt) {
  try {
    if (prompt === void 0) {
      prompt = true;
    }
    let intentType = android.content.Intent.ACTION_DIAL;
    if (prompt === false) {
      const hasPerms = hasPermission(android.Manifest.permission.CALL_PHONE);
      if (hasPerms === false) {
        return 'Application does not have permission to call directly.';
      }
      intentType = android.content.Intent.ACTION_CALL;
    }
    const intent = new android.content.Intent(intentType);
    telNum = telNum.replace('#', encodeURIComponent('#'));
    intent.setData(android.net.Uri.parse('tel:' + telNum));
    const activity =
      Application.android.foregroundActivity ||
      Application.android.startActivity;
    activity.startActivity(intent);
    NSPhoneEventEmitter.notify({
      eventName: DialEvents.SUCCESS
    });
    return true;
  } catch (ex) {
    NSPhoneEventEmitter.notify({
      eventName: DialEvents.ERROR,
      data: {
        error: ex
      }
    });
    return false;
  }
}
export function sms(smsNum, messageText) {
  try {
    if (!Array.isArray(smsNum)) {
      smsNum = [smsNum];
    }
    const SEND_SMS = 1001;
    const intent = new android.content.Intent(
      android.content.Intent.ACTION_VIEW
    );
    intent.putExtra('sms_body', messageText);
    intent.setType('vnd.android-dir/mms-sms');
    intent.setData(android.net.Uri.parse('sms:' + smsNum.join(';')));
    const activity =
      Application.android.foregroundActivity ||
      Application.android.startActivity;
    activity.startActivityForResult(intent, SEND_SMS);
    const previousResult = activity.onActivityResult;
    activity.onActivityResult = (requestCode, resultCode, data) => {
      activity.onActivityResult = previousResult;
      if (requestCode === SEND_SMS) {
        if (resultCode === android.app.Activity.RESULT_OK) {
          NSPhoneEventEmitter.notify({
            eventName: SMSEvents.SUCCESS
          });
        } else if (resultCode === android.app.Activity.RESULT_CANCELED) {
          NSPhoneEventEmitter.notify({
            eventName: SMSEvents.CANCELLED
          });
        } else {
          NSPhoneEventEmitter.notify({
            eventName: SMSEvents.UNKNOWN
          });
        }
      } else {
        if (typeof previousResult === 'function') {
          previousResult(requestCode, resultCode, data);
        }
      }
    };
  } catch (error) {
    NSPhoneEventEmitter.notify({
      eventName: SMSEvents.ERROR,
      data: {
        error: error
      }
    });
  }
}
export function requestCallPermission(explanation) {
  return requestPermission(android.Manifest.permission.CALL_PHONE, explanation);
}
//# sourceMappingURL=index.android.js.map
