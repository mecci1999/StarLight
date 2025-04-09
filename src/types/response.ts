/**
 * 类型定义文件
 * 注意：请使用TSDoc规范进行注释，以便在使用时能够获得良好提示。
 * @see TSDoc规范https://tsdoc.org/
 **/

/**
 * 响应请求体
 */
export type ServiceResponse = {
  // 状态码
  status: number
  // 数据
  data: {
    // 内容
    content: any
    // 响应信息
    message: string
    // 响应错误码
    code: number
  }
}
