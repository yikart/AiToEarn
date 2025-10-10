import { Button, LanguageStringMap, NotificationTargetChannelEnum, WebButton } from '@onesignal/node-onesignal'

export type LangMap = Partial<Record<keyof LanguageStringMap, string>>

export interface BaseNotificationWithoutTemplate<L extends LangMap> {
  /**
   * Your OneSignal App ID in UUID v4 format. See [Keys & IDs](https://documentation.onesignal.com/docs/keys-and-ids).
   */
  app_id: string
  /**
   * The main message body with [language-specific values](https://documentation.onesignal.com/docs/multi-language-messaging#supported-languages). Supports [Message Personalization](https://documentation.onesignal.com/docs/message-personalization).
   */
  contents: L
  /**
   * The message title with [language-specific values](https://documentation.onesignal.com/docs/multi-language-messaging#supported-languages). Required for Huawei and Web Push. If not set for Web Push, it defaults to your 'Site Name'. Not required if using template_id or content_available. Supports [Message Personalization](https://documentation.onesignal.com/docs/message-personalization) and must include the same languages as contents to ensure localization consistency.
   */
  headings?: L & Partial<Record<Exclude<keyof LanguageStringMap, keyof L>, never>>
  /**
   * iOS only. The subtitle with [language-specific values](https://documentation.onesignal.com/docs/multi-language-messaging#supported-languages). Supports [Message Personalization](https://documentation.onesignal.com/docs/message-personalization) and must include the same languages as contents to ensure localization consistency.
   */
  subtitle?: L & Partial<Record<Exclude<keyof LanguageStringMap, keyof L>, never>>
  /**
   * An internal name you set to help organize and track messages. Not shown to recipients. Maximum 128 characters.
   */
  name?: string
  /**
   * The targeted delivery channel. Required when using include_aliases. Accepts push, email, or sms.
   */
  target_channel?: NotificationTargetChannelEnum
  /**
   * The local name or URL of the media attachment to include in your notification. Users can expand the notification to view images, videos, or other supported attachments. See [Images & Rich Media](https://documentation.onesignal.com/docs/rich-media).
   */
  ios_attachments?: {
    /**
     * The URL of the media to display in the notification. Example: https://avatars.githubusercontent.com/u/11823027?s=200&v=4
     */
    id: string
  }
  /**
   * The local name or URL of the image to include in your Google Android notification. Users can expand the notification to view the images. See [Images & Rich Media](https://documentation.onesignal.com/docs/rich-media).
   */
  big_picture?: string
  /**
   * The local name or URL of the image to include in your Huawei Android notification. Users can expand the notification to view the images. See Images & Rich Media.
   */
  huawei_big_picture?: string
  /**
   * The local name or URL of the image to include in your Amazon Android notification. Users can expand the notification to view the images. See Images & Rich Media.
   */
  adm_big_picture?: string
  /**
   * The URL of the image to include in your Chrome notification. Users can expand the notification to view the images. Supported on Chrome for Windows and Android. macOS does not support this parameter and instead expands the chrome_web_icon. See Images & Rich Media.
   */
  chrome_web_image?: string
  /**
   * The local name of the small icon to display in the Google Android notification. See Notification icons.
   */
  small_icon?: string
  /**
   * The local name of the small icon to display in the Huawei Android notification. See Notification icons.
   */
  huawei_small_icon?: string
  /**
   * The local name of the small icon to display in the Amazon Android notification. See Notification icons.
   */
  adm_small_icon?: string
  /**
   * The local name or URL of the large icon to display in the Google Android notification. See Notification icons.
   */
  large_icon?: string
  /**
   * The local name or URL of the large icon to display in the Huawei Android notification. See Notification icons.
   */
  huawei_large_icon?: string
  /**
   * The local name or URL of the large icon to display in the Amazon Android notification. See Notification icons.
   */
  adm_large_icon?: string
  /**
   * The URL of the icon to display in the Chrome web notification. Defaults to the resource set in the OneSignal dashboard. See Notification icons.
   */
  chrome_web_icon?: string
  /**
   * The URL of the icon to display in the Firefox web notification. Defaults to the resource set in the OneSignal dashboard. See Notification icons.
   */
  firefox_icon?: string
  /**
   * The URL of the icon to display in the Android notification tray for Chrome web notifications. Defaults to the Chrome icon. See Push.
   */
  chrome_web_badge?: string
  /**
   * The UUID of the Android notification channel category created within your OneSignal app.
   */
  android_channel_id?: string
  /**
   * The UUID of the Android notification channel category created within your Android app.
   */
  existing_android_channel_id?: string
  /**
   * The UUID of the Android notification channel category created within your OneSignal app.
   */
  huawei_channel_id?: string
  /**
   * The UUID of the Android notification channel category created within your Huawei app.
   */
  huawei_existing_channel_id?: string
  /**
   * The category you set for notifications sent to Huawei devices. The category chosen must align with an approved [self-classification application](https://developer.huawei.com/consumer/cn/doc/HMSCore-Guides/message-classification-0000001149358835#section1653845862216). Subject to daily send limitations ranging from 2 to 5, depending on the specific [third-level classifications](https://developer.huawei.com/consumer/cn/doc/development/HMSCore-Guides/message-restriction-description-0000001361648361#section199311418515) the message falls under.
   */
  huawei_category?: 'MARKETING' | 'IM' | 'VOIP' | 'SUBSCRIPTION' | 'TRAVEL' | 'HEALTH' | 'WORK' | 'ACCOUNT' | 'EXPRESS' | 'FINANCE' | 'DEVICE_REMINDER' | 'MAIL'
  /**
   * The type of notification being sent to Huawei devices. Options: message - (default) For displayable notifications to the user. Notification will be shown even if the app is force quit. If the device is offline it will display the notification when it connects to the internet within the ttl timeframe (usually 3 days). Does not support Confirmed Delivery, Huawei requires using their dashboard to track this. data - used for notifications containing data payloads you intend to process in the background. If the app is force quit, HMS Core will not start the app to process the notification. Supports [Confirmed Delivery](https://documentation.onesignal.com/docs/confirmed-delivery#huawei).
   */
  huawei_msg_type?: 'message' | 'data'
  /**
   * Define a tag for associating messages in a batch delivery, facilitating precise monitoring and analysis of delivery stats. This tag is returned to your server when Huawei's Push Kit sends a message receipt. You can set this parameter to track your push campaigns' performance and optimize your messaging strategy.
   */
  huawei_bi_tag?: string
  /**
   * Set the priority based on the urgency of the message. 10 - High priority. 5 - Normal priority. Recommended and default value is 10. APNs and FCM use this parameter to determine how quickly a notification is delivered and processed, particularly in power-saving modes. If sending data/background notifications, 5 (Normal priority) is recommended. For details, see [APNs apns-priority](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns) and [FCM priority](https://firebase.google.com/docs/cloud-messaging/android/message-priority).
   */
  priority?: 10 | 5
  /**
   * The priority and delivery timing of iOS notifications based on their importance and the urgency with which they should interrupt the user. See [iOS Focus modes and interruption levels](https://documentation.onesignal.com/docs/ios-focus-modes-and-interruption-levels).
   *
   * Available options: active, passive, time_sensitive, critical
   */
  ios_interruption_level?: 'active' | 'passive' | 'time_sensitive' | 'critical'
  /**
   * The local name of the custom sound file to play when the notification is received instead of the default sound. See [Notification sounds](https://documentation.onesignal.com/docs/notification-sounds).
   */
  ios_sound?: string
  /**
   * Set or increment the badge count on iOS devices. Use with ios_badgeCount. See [Badges](https://documentation.onesignal.com/docs/badges).
   *
   * Available options: None, SetTo, Increase
   */
  ios_badgeType?: 'None' | 'SetTo' | 'Increase'
  /**
   * Use with ios_badgeType to determine the numerical change to your app's badge count. See [Badges](https://documentation.onesignal.com/docs/badges).
   */
  ios_badgeCount?: number
  /**
   * The ARGB Hex formatted color of the Android small icon background. For Android 8+ use Android notification channel category and android_channel_id.
   */
  android_accent_color?: string
  /**
   * The ARGB Hex formatted color of the Huawei small icon background. For Android 8+ use Android notification channel category and huawei_channel_id.
   */
  huawei_accent_color?: string
  /**
   * The httpsURL that opens in the browser when a user interacts with the notification. See [URLs, Links and Deep Links](https://documentation.onesignal.com/docs/links). Supports Message Personalization.
   */
  url?: string
  /**
   * Similar to the url parameter but exclusively targets mobile platforms like iOS, Android. Accepts values other than https but must use your-app-scheme:// protocol.
   */
  app_url?: string
  /**
   * Use with app_url if your app and website need different URLs. Accepts URLs with protocol https://
   */
  web_url?: string
  /**
   * Direct the notification to a specific user experience within your app, such as an App Clip, or target a particular window in applications that use multiple scenes. See [Apple's documentation](https://developer.apple.com/documentation/foundation/nsuseractivity/3238062-targetcontentidentifier).
   */
  target_content_identifier?: string
  /**
   * Add a maximum of 3 Action Buttons to Android and iOS push notifications. See [Action Buttons](https://documentation.onesignal.com/docs/action-buttons).
   */
  buttons?: Array<Button>
  /**
   * Add a maximum of 2 Action Buttons to Chrome web push notifications. See [Action Buttons](https://documentation.onesignal.com/docs/action-buttons).
   */
  web_buttons?: Array<WebButton>
  /**
   * An ID to group notifications on Apple devices. Notifications with the same identifier are organized together in the notification center.
   */
  thread_id?: string
  /**
   * A value between 0 and 1, to sort the notifications from your app. The highest score gets featured in the notification summary. See [iOS Relevance Score](https://documentation.onesignal.com/docs/ios-relevance-score)
   */
  ios_relevance_score?: string
  /**
   * An ID to group notifications on Google Android devices. Notifications with the same identifier are organized together in the notification center.
   */
  android_group?: string
  /**
   * An ID to group notifications on Amazon Android devices. Notifications with the same identifier are organized together in the notification center.
   */
  adm_group?: string
  /**
   * The duration in seconds for which a notification remains valid if the device is offline. Any number between 0 and 2419200 (28 days). Defaults to 3 days. See [Push: Time to Live](https://documentation.onesignal.com/docs/push#time-to-live).
   */
  ttl?: number
  /**
   * An ID that replaces older notifications with newer ones that have the same identifier. For mobile push only. See [Push: Collapse ID](https://documentation.onesignal.com/docs/push#collapse-id).
   */
  collapse_id?: string
  /**
   * An ID that prevents replacement of older notifications with newer ones that have different identifiers. For web push only. See [Push: Web Push Topic](https://documentation.onesignal.com/docs/push#web-push-topic).
   */
  web_push_topic?: string
  /**
   * Bundle a custom data map within your notification, which is then passed to your app. See [Push: Additional Data](https://documentation.onesignal.com/docs/push#additional-data).
   */
  data?: object
  /**
   * Allows for sending data/background notifications to the Android and iOS apps. Set to true and omit contents. Apple interprets this as content-available=1. See [Data & background notifications](https://documentation.onesignal.com/docs/data-notifications).
   */
  content_available?: boolean
  /**
   * Enable users to respond directly to a notification without launching the app. The [Category](https://developer.apple.com/documentation/usernotifications/unnotificationcategory) will activate the corresponding [Notification Content Extension](https://developer.apple.com/documentation/usernotificationsui/unnotificationcontentextension/) in your app when the push is interacted with.
   */
  ios_category?: string
  /**
   * Use only for VoIP notifications. Corresponds to the [apns-push-type](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns#Send-a-POST-request-to-APNs). OneSignal automatically sets this value to alert or background based on the notification content. Pass voip to initiate VoIP calls or alert the user to incoming VoIP calls.
   */
  apns_push_type_override?: string
  /**
   * Schedule delivery for a future date/time (in UTC). The format must be valid per the ISO 8601 standard and compatible with JavaScript’s Date() parser. Example: 2025-09-24T14:00:00-07:00
   */
  send_after?: string
  /**
   * Controls how messages are delivered on a per-user basis: 'timezone' — Sends at the same local time across time zones. 'last-active' — Delivers based on each user’s most recent session. Not compatible with Push Throttling. If enabled, set throttle_rate_per_minute to 0.
   */
  delayed_option?: string
  /**
   * Use with delayed_option: 'timezone' to set a consistent local delivery time. Accepted formats: '9:00AM' (12-hour), '21:45' (24-hour), '09:45:30' (HH:mm:ss).
   */
  delivery_time_of_day?: string
  /**
   * Overrides the throttle limit set in the OneSignal dashboard settings. Must be enabled through the dashboard. Only available with push notifications. See Push Throttling. If throttle_rate_per_minute is set to 0, then the message will be sent immediately without any rate limiting
   */
  throttle_rate_per_minute?: number
  /**
   * Overrides the frequency cap set in the OneSignal dashboard settings. Must be enabled through the dashboard first. Only available with push notifications. See Frequency Capping. Set to false to disable frequency capping.
   */
  enable_frequency_cap?: boolean
  /**
   * A unique identifier used to prevent duplicate messages from repeat API calls. See Idempotent notification requests. Must be a v3 or v4 UUID. Valid for 30 days. Previously called external_id.
   */
  idempotency_key?: string
}

export interface BaseNotificationWithTemplate<L extends LangMap> extends BaseNotificationWithoutTemplate<L> {
  /**
   * The template ID in UUID v4 format set for the message if applicable. See [Templates](https://documentation.onesignal.com/docs/templates).
   */
  template_id: string
  /**
   * Include user or context-specific data (e.g., cart items, OTPs, links) in a message. Use with template_id. See [Message Personalization](https://documentation.onesignal.com/docs/message-personalization). Max size: 2KB (Push/SMS), 10KB (Email).
   */
  custom_data?: object
}

export type BaseNotification<L extends LangMap> = BaseNotificationWithoutTemplate<L> | BaseNotificationWithTemplate<L>

export type NotificationWithAliases<L extends LangMap> = BaseNotification<L> & {
  /**
   * The targeted delivery channel. Required when using include_aliases. Accepts push, email, or sms.
   */
  target_channel: NotificationTargetChannelEnum
  /**
   * Target up to 20,000 users by their external_id, onesignal_id, or your own custom alias. Use with target_channel to control the delivery channel. Not compatible with any other targeting parameters like filters, include_subscription_ids, included_segments, or excluded_segments.
   */
  include_aliases: {
    /**
     * An array of external IDs which should be the same as the user ID in your app. This is the recommended method for targeting users. See [Users](https://documentation.onesignal.com/docs/users).
     */
    external_id: string[]
  }
}
export type NotificationWithSubscription<L extends LangMap> = BaseNotification<L> & {
  /**
   * Target users' specific subscriptions by ID. Include up to 20,000 subscription_id per API call. Not compatible with any other targeting parameters like filters, include_aliases, included_segments, or excluded_segments.
   */
  include_subscription_ids: string[]
}
export type NotificationWithSegments<L extends LangMap> = BaseNotification<L> & {
  /**
   * Target predefined Segments. Users that are in multiple segments will only be sent the message once. Can be combined with excluded_segments. Not compatible with any other targeting parameters like filters, include_aliases, or include_subscription_ids.
   */
  included_segments: string[]
  /**
   * Exclude users in predefined Segments. Overrides membership in any segment specified in the included_segments. Not compatible with any other targeting parameters like filters, include_aliases, or include_subscription_ids.
   */
  excluded_segments: string[]
}

export interface NotificationFilter {
  // The name of the filter to use.
  field: 'tag' | 'last_session' | 'first_session' | 'session_count' | 'session_time' | 'language' | 'app_version' | 'location' | 'country'
  // Used with most filters. See details on the specific filter.
  relation: '=' | '!=' | '>' | '<' | 'exists' | 'not_exists' | 'time_elapsed_gt' | 'time_elapsed_lt'
  // Used with the tag filter. This is the tag key.
  key?: string
  // The value of the field or tag key in which you want to filter with.
  value?: string
}

export interface NotificationOperator {
  /**
   * Chain filter conditions with implicit AND and OR logic. Never end your filters object with an operator. See filters for more.
   *
   * Available options: AND, OR
   */
  operator: 'AND' | 'OR'
}

export type NotificationWithFilters<L extends LangMap> = BaseNotification<L> & {
  /**
   * Filters define the segment based on user properties like tags, activity, or location using flexible AND/OR logic. Limited to 200 total entries, including fields and OR operators.
   */
  filters: (NotificationFilter | NotificationOperator)[]
}

export type Notification<L extends LangMap> = NotificationWithAliases<L> | NotificationWithSubscription<L> | NotificationWithSegments<L> | NotificationWithFilters<L>
