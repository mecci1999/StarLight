import path from 'path'

/**
 * 获取项目根路径
 * @description 末尾不带斜杆
 */
export const getRootPath = () => {
  return path.resolve(__dirname, process.cwd())
}

/**
 * 获取项目主路径 如（src）
 * @param mainName - src目录名称(默认为： "src")
 * @description 末尾不带斜杆
 */
export const getSrcPath = (mainName = 'src') => {
  const rootPath = getRootPath()
  
  return `${rootPath}/${mainName}`
}