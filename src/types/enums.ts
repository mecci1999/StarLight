/**
 * 全局枚举文件
 * 如果枚举值需要在全局使用，那么请在此文件中定义。其他枚举值请在对应的文件中定义。
 * 定义规则：
 *  枚举名：XxxEnum
 *  枚举值：全部大写，单词间用下划线分割
 */

/** 主题类型 */
export enum ThemeEnum {
  /** 亮色 */
  LIGHT = 'light',
  /** 暗色 */
  DARK = 'dark',
  /** 跟随系统 */
  OS = 'os'
}

/** pinia存储的名称 */
export enum StoresEnum {
  /** 设置 */
  SETTING = 'setting',
  /** 置顶 */
  ALWAYS_ON_TOP = 'alwaysOnTop',
  /** 登录历史 */
  LOGIN_HISTORY = 'loginHistory',
  /** 用户信息 */
  USER = 'user',
  /** 缓存 */
  CACHED = 'cached',
  /** 全局 */
  GLOBAL = 'global',
  /** 插件列表 */
  PLUGINS = 'plugins',
  /** 侧边栏头部菜单栏 */
  MENUTOP = 'menuTop'
}

/**
 * 请求响应状态码类型
 */
export enum ResponseCodeEnum {
  /**成功请求*/
  OK = '200',
  /**请求错误*/
  FAIL = '400',
  /**服务器出现问题*/
  SERVE_EXCEPTION = '500',
  /**业务出现问题*/
  BUSINESS_EXCEPTION = '600'
}

/** tauri原生跨窗口通信时传输的类型 */
export enum EventEnum {
  /** 窗口关闭 */
  WIN_CLOSE = 'winClose',
  /** 窗口显示 */
  WIN_SHOW = 'winShow',
  /** 退出程序 */
  EXIT = 'exit',
  /** 退出账号 */
  LOGOUT = 'logout',
  /** 独立窗口 */
  ALONE = 'alone',
  /** 共享屏幕 */
  SHARE_SCREEN = 'shareScreen',
  /** 锁屏 */
  LOCK_SCREEN = 'lockScreen'
}

/** 关闭窗口的行为 */
export enum CloseBxEnum {
  /** 隐藏 */
  HIDE = 'hide',
  /** 关闭 */
  CLOSE = 'close'
}

/** 权限状态 */
export enum PowerEnum {
  /** 用户 */
  USER,
  /** 管理员 */
  ADMIN
}

/** MacOS键盘映射 */
export enum MacOsKeyEnum {
  '⌘' = '⌘',
  '⌥' = '⌥',
  '⇧' = '⇧'
}

/** Windows键盘映射 */
export enum WinKeyEnum {
  CTRL = 'Ctrl',
  WIN = 'Win',
  ALT = 'Alt',
  SHIFT = 'Shift'
}

/** 插件状态 */
export enum PluginEnum {
  /** 已内置 */
  BUILTIN,
  /** 已安装 */
  INSTALLED,
  /** 下载中 */
  DOWNLOADING,
  /** 未安装 */
  NOT_INSTALLED,
  /** 卸载中 */
  UNINSTALLING,
  /** 可更新 */
  CAN_UPDATE
}

/** 菜单显示模式 */
export enum ShowModeEnum {
  /** 图标方式 */
  ICON,
  /** 文字方式 */
  TEXT
}

/**
 * URL前缀模块
 */
export enum URLEnum {
  USER = '/user', // 用户模块
  AUTH = '/auth', // 认证模块
  CONFIG = '/config', // 配置模块
  LOGS = '/logs', // 日志模块
  METRICS = '/metrics', // 指标模块
  SUBSCRIPTION = '/subscription' // 订阅模块
}

/**
 * 接口版本
 */
export enum VersionEnum {
  V1 = 'v1',
  V2 = 'v2'
}

/**
 * Mitt事件类型
 */
export enum MittEnum {
  /** 缩小窗口 */
  SHRINK_WINDOW = 'windowShrink',
  /** 触发home窗口事件 */
  HOME_WINDOW_RESIZE = 'homeWindowResize'
}

/**
 * 登录二维码状态
 */
export enum QrCodeStatus {
  PENDING = 'PENDING', // 等待扫描
  SCANNED = 'SCANNED', // 已扫描
  CONFIRMED = 'CONFIRMED', // 已确认
  CANCELLED = 'CANCELLED', // 已取消
  EXPIRED = 'EXPIRED' // 已过期
}

/**
 * websocket事件类型
 */
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  MESSAGE = 'message',
  ERROR = 'error'
}

/** ws响应类型 */
export enum WorkerMsgEnum {
  /** open */
  OPEN = 'open',
  /** message */
  MESSAGE = 'message',
  /** close */
  CLOSE = 'close',
  /** error */
  ERROR = 'error',
  /** ws_error */
  WS_ERROR = 'wsError'
}

/**
 * ws 请求 消息类型 1.获取指标数据，2心跳检测
 */
export enum WsRequestMsgType {
  /** 1.获取微服务指标数据 */
  GetUniverseMetrics = 1,
  /** 2心跳检测 */
  HeartBeatDetection
}

export type WsReqMsgContentType = {
  type: WsRequestMsgType | 'subscribe' | 'unsubscribe'
  data?: Record<string, unknown>
}

// 1.登录返回二维码 2.用户扫描成功等待授权 3.用户登录成功返回用户信息 4.收到消息 5.上下线推送 6.前端token失效
export enum WsResponseMessageType {
  /** 无网络连接 */
  NO_INTERNET = 'noInternet',
  /** 登录返回二维码 */
  LOGIN_QR_CODE = 'loginQrCode',
  /** 用户扫描成功等待授权 */
  WAITING_AUTHORIZE = 'waitingAuthorize',
  /** 用户登录成功返回用户信息 */
  LOGIN_SUCCESS = 'loginSuccess',
  /** 收到消息 */
  RECEIVE_MESSAGE = 'receiveMessage',
  /** 上线推送 */
  ONLINE = 'online',
  /** 前端token失效 */
  TOKEN_EXPIRED = 'tokenExpired',
  TOPOLOGY_SNAPSHOT = 'topology_snapshot',
  TOPOLOGY_DELTA = 'topology_delta',
  /** 禁用的用户 */
  INVALID_USER = 'invalidUser',
  /** 点赞、倒赞更新通知 */
  MSG_MARK_ITEM = 'msgMarkItem',
  /** 消息撤回 */
  MSG_RECALL = 'msgRecall',
  /** 新好友申请 */
  REQUEST_NEW_FRIEND = 'requestNewFriend',
  /** 成员变动 */
  NEW_FRIEND_SESSION = 'newFriendSession',
  /** 下线通知 */
  OFFLINE = 'offline',
  /** 同意好友请求 */
  REQUEST_APPROVAL_FRIEND = 'requestApprovalFriend',
  /** 用户状态改变 */
  USER_STATE_CHANGE = 'userStateChange',
  /** 管理员修改群聊信息 */
  ROOM_INFO_CHANGE = 'roomInfoChange',
  /** 自己修改我在群里的信息 */
  MY_ROOM_INFO_CHANGE = 'myRoomInfoChange',
  /** 群通知消息 */
  ROOM_GROUP_MSG = 'roomGroupMsg',
  /** 群公告消息 */
  ROOM_GROUP_NOTICE_MSG = 'roomGroupNoticeMsg',
  /** 群公告已读 */
  ROOM_GROUP_NOTICE_READ_MSG = 'roomGroupNoticeReadMsg',
  /** 群解散 */
  ROOM_DISSOLUTION = 'roomDissolution'
}
