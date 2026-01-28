/**
 * 加密方法
 */
import CryptoJS from 'crypto-js'

// 加密
export function encryptPassword(password: string, secretKey: string): string {
  // 使用AES加密算法对密码进行加密
  const encrypted = CryptoJS.AES.encrypt(password, secretKey)
  // 返回加密后的密文字符串
  return encrypted.toString()
}
