// 获取指定名称的 cookie
export function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    // 判断这个 cookie 的名称是否是我们想要的
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1)
    }
  }
  return null
}
