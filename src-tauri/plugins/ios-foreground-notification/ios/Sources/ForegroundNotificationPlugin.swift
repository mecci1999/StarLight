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

private struct NotificationAuthorizationStatus: Encodable {
  let status: String
  let isGranted: Bool

  init(_ status: UNAuthorizationStatus) {
    if #available(iOS 14.0, *), status == .ephemeral {
      self.status = "ephemeral"
      self.isGranted = true
      return
    }

    switch status {
    case .notDetermined:
      self.status = "notDetermined"
      self.isGranted = false
    case .denied:
      self.status = "denied"
      self.isGranted = false
    case .authorized:
      self.status = "authorized"
      self.isGranted = true
    case .provisional:
      self.status = "provisional"
      self.isGranted = true
    @unknown default:
      self.status = "unknown"
      self.isGranted = false
    }
  }
}

private struct LocalNotificationPayload: Decodable {
  let title: String
  let body: String
}

private struct LocalNotificationResult: Encodable {
  let id: String
}

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

  @objc func getNotificationAuthorizationStatus(_ invoke: Invoke) {
    DispatchQueue.main.async {
      UNUserNotificationCenter.current().getNotificationSettings { settings in
        invoke.resolve(NotificationAuthorizationStatus(settings.authorizationStatus))
      }
    }
  }

  @objc func requestNotificationAuthorization(_ invoke: Invoke) {
    DispatchQueue.main.async {
      let center = UNUserNotificationCenter.current()
      center.requestAuthorization(options: [.alert, .badge, .sound]) { _, error in
        if let error = error {
          invoke.reject("Notification authorization could not be requested", error: error)
          return
        }

        center.getNotificationSettings { settings in
          invoke.resolve(NotificationAuthorizationStatus(settings.authorizationStatus))
        }
      }
    }
  }

  @objc func showLocalNotification(_ invoke: Invoke) {
    let payload: LocalNotificationPayload

    do {
      payload = try invoke.parseArgs(LocalNotificationPayload.self)
    } catch {
      invoke.reject("A local notification requires title and body strings", error: error)
      return
    }

    DispatchQueue.main.async {
      let content = UNMutableNotificationContent()
      content.title = payload.title
      content.body = payload.body
      content.sound = .default

      let identifier = UUID().uuidString
      let request = UNNotificationRequest(identifier: identifier, content: content, trigger: nil)
      UNUserNotificationCenter.current().add(request) { error in
        if let error = error {
          invoke.reject("The local notification could not be scheduled", error: error)
          return
        }

        invoke.resolve(LocalNotificationResult(id: identifier))
      }
    }
  }
}

@_cdecl("init_plugin_ios_foreground_notification")
func initPlugin() -> Plugin {
  ForegroundNotificationPlugin()
}
