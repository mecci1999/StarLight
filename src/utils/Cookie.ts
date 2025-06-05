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

// 删除指定名称的 cookie
export function removeCookie(name: string): void {
  // 通过设置过期时间为过去的时间来删除 cookie
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}
