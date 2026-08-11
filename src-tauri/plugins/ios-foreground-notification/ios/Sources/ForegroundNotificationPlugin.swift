import Tauri
import UIKit
import UserNotifications
import WebKit

private final class ForegroundNotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
  private weak var nextDelegate: UNUserNotificationCenterDelegate?

  private var foregroundPresentationOptions: UNNotificationPresentationOptions {
    if #available(iOS 14.0, *) {
      return [.banner, .list, .sound]
    }

    return [.alert, .sound]
  }

  init(nextDelegate: UNUserNotificationCenterDelegate?) {
    self.nextDelegate = nextDelegate
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    guard notification.request.trigger?.isKind(of: UNPushNotificationTrigger.self) != true else {
      nextDelegate?.userNotificationCenter?(center, willPresent: notification, withCompletionHandler: completionHandler)
        ?? completionHandler([])
      return
    }

    nextDelegate?.userNotificationCenter?(center, willPresent: notification) { options in
      completionHandler(options.union(self.foregroundPresentationOptions))
    } ?? completionHandler(foregroundPresentationOptions)
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    nextDelegate?.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler)
      ?? completionHandler()
  }
}

private var foregroundNotificationDelegate: ForegroundNotificationDelegate?

private final class ForegroundNotificationPlugin: Plugin {
  override init() {
    super.init()
    let center = UNUserNotificationCenter.current()
    // The notification plugin registers first; retain and forward to its delegate before overriding foreground options.
    let delegate = ForegroundNotificationDelegate(nextDelegate: center.delegate)
    foregroundNotificationDelegate = delegate
    center.delegate = delegate
  }

  @objc func openNotificationSettings(_ invoke: Invoke) {
    DispatchQueue.main.async {
      guard let settingsURL = URL(string: UIApplication.openSettingsURLString) else {
        invoke.reject("The app settings URL is unavailable")
        return
      }

      UIApplication.shared.open(settingsURL, options: [:]) { opened in
        if opened {
          invoke.resolve()
        } else {
          invoke.reject("The app settings page could not be opened")
        }
      }
    }
  }
}

@_cdecl("init_plugin_ios_foreground_notification")
func initPlugin() -> Plugin {
  ForegroundNotificationPlugin()
}
