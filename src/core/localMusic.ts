/**
 * 本地音乐扫描导入
 * 扫描手机存储中的音频文件，读取元数据后导入到用户歌单「本地音乐」，
 * 播放/管理完全复用原版 local 源播放链路（core/music/local.ts）。
 */
import { readDir, extname, externalStorageDirectoryPath, privateStorageDirectoryPath } from '@/utils/fs'
import { readMetadata } from '@/utils/localMediaMetadata'
import { createUserList, addListMusics } from '@/core/list'
import { getUserLists } from '@/utils/listManage'
import settingState from '@/store/setting/state'
import { toast } from '@/utils/tools'
import { saveLocalMusicData, getLocalMusicData } from '@/utils/data'


// 默认扫描目录（相对外部存储根目录）
const DEFAULT_SCAN_DIRS = [
  'Music',
  'music',
  'Download',
  'download',
  'DCIM/Music',
  'netease/cloudmusic/Music',
  'kugou/download',
  'kgmusic/download',
  'qqmusic/song',
  'migu/Music',
]

// 支持的音频格式
export const LOCAL_MUSIC_EXTS = ['mp3', 'flac', 'wav', 'ape', 'ogg', 'm4a', 'aac', 'wma']

// 内置「本地音乐」歌单 id
export const LOCAL_MUSIC_LIST_ID = 'userlist_local_music'
export const LOCAL_MUSIC_LIST_NAME = '本地音乐'


export interface LocalScanFile {
  path: string
  name: string
  size: number
}


export interface LocalScanProgress {
  status: 'scanning' | 'reading' | 'done' | 'error'
  foundCount: number
  importCount: number
  totalCount: number
  message?: string
}


let scanning = false


export const isScanning = (): boolean => scanning


const dirExists = async(path: string): Promise<boolean> => {
  try {
    await readDir(path)
    return true
  } catch {
    return false
  }
}


/**
 * 收集目录下（含一层子目录）的音频文件
 */
const collectAudioFiles = async(dirPath: string): Promise<LocalScanFile[]> => {
  const files: LocalScanFile[] = []
  let entries
  try {
    entries = await readDir(dirPath)
  } catch {
    return files
  }
  for (const entry of entries) {
    // entry: { name, path, isDirectory, mimeType, size }
    if (entry.isDirectory) {
      // 只下钻一层，避免全盘递归太慢
      try {
        const subEntries = await readDir(entry.path)
        for (const sub of subEntries) {
          if (sub.isDirectory) continue
          const ext = extname(sub.name).toLowerCase()
          if (LOCAL_MUSIC_EXTS.includes(ext)) {
            files.push({ path: sub.path, name: sub.name, size: sub.size ?? 0 })
          }
        }
      } catch {}
    } else {
      const ext = extname(entry.name).toLowerCase()
      if (LOCAL_MUSIC_EXTS.includes(ext)) {
        files.push({ path: entry.path, name: entry.name, size: entry.size ?? 0 })
      }
    }
  }
  return files
}


/**
 * 从文件名解析歌名与歌手（支持 "歌手 - 歌名" / "歌名 - 歌手" 常见命名）
 */
const parseNameFromFileName = (fileName: string): { name: string, singer: string } => {
  const base = fileName.substring(0, fileName.lastIndexOf('.') > 0 ? fileName.lastIndexOf('.') : undefined)
  const cleaned = base.replace(/^\d+[\s._-]+/, '').trim()
  const idx = cleaned.indexOf(' - ')
  if (idx > 0) {
    return {
      singer: cleaned.substring(0, idx).trim(),
      name: cleaned.substring(idx + 3).trim() || cleaned,
    }
  }
  const idx2 = cleaned.indexOf('-')
  if (idx2 > 0) {
    return {
      singer: cleaned.substring(0, idx2).trim(),
      name: cleaned.substring(idx2 + 1).trim() || cleaned,
    }
  }
  return { name: cleaned || fileName, singer: '' }
}


const ensureLocalList = async(): Promise<string> => {
  const lists = await getUserLists()
  const exists = lists.find(l => l.id == LOCAL_MUSIC_LIST_ID || l.name == LOCAL_MUSIC_LIST_NAME)
  if (exists) return exists.id
  await createUserList(lists.length, [{ id: LOCAL_MUSIC_LIST_ID, name: LOCAL_MUSIC_LIST_NAME, locationUpdateTime: null }])
  return LOCAL_MUSIC_LIST_ID
}


export interface ScanResult {
  foundCount: number
  importCount: number
}


/**
 * 扫描本地音乐并导入（幂等，可重复调用）
 */
export const scanLocalMusic = async(onProgress?: (progress: LocalScanProgress) => void): Promise<ScanResult> => {
  if (scanning) throw new Error('scanning')
  scanning = true
  try {
    const sdRoot = externalStorageDirectoryPath ?? '/storage/emulated/0'
    const saved = await getLocalMusicData()
    const knownPaths = new Set<string>(saved.paths)
    const isDedup = settingState.setting['localMusic.dedup'] !== false

    onProgress?.({ status: 'scanning', foundCount: 0, importCount: 0, totalCount: 0 })

    // 收集所有候选目录
    const dirs: string[] = []
    for (const dir of DEFAULT_SCAN_DIRS) {
      const full = `${sdRoot}/${dir}`
      if (await dirExists(full)) dirs.push(full)
    }
    // 下载/缓存目录里用户保存的歌曲也纳入
    dirs.push(privateStorageDirectoryPath + '/an_music_download')

    const allFiles: LocalScanFile[] = []
    for (const dir of dirs) {
      const files = await collectAudioFiles(dir)
      allFiles.push(...files)
    }

    // 过滤已导入（去重按文件路径）
    const newFiles = isDedup ? allFiles.filter(f => !knownPaths.has(f.path)) : allFiles
    onProgress?.({ status: 'reading', foundCount: allFiles.length, importCount: 0, totalCount: newFiles.length })

    const musicInfos: LX.Music.MusicInfoLocal[] = []
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i]
      // 元数据解析失败不阻断导入
      let meta: { name?: string, singer?: string, interval?: number, albumName?: string } | null = null
      try {
        meta = await readMetadata(file.path)
        // 时长单位防御：毫秒则转秒
        if (typeof meta?.interval == 'number' && meta.interval > 10000) meta.interval = Math.round(meta.interval / 1000)
      } catch {}
      const fallback = parseNameFromFileName(file.name)
      const info: LX.Music.MusicInfoLocal = {
        id: `local_${file.path}`,
        name: meta?.name || fallback.name,
        singer: meta?.singer || fallback.singer,
        source: 'local',
        interval: (typeof meta?.interval == 'number' && meta.interval > 0) ? String(Math.round(meta.interval)) : '0',
        meta: {
          filePath: file.path,
          ext: extname(file.name).toLowerCase(),
          albumName: meta?.albumName ?? '',
        },
      }
      musicInfos.push(info)
      if (i % 8 == 0 || i == newFiles.length - 1) {
        onProgress?.({ status: 'reading', foundCount: allFiles.length, importCount: musicInfos.length, totalCount: newFiles.length })
      }
    }

    let importCount = 0
    if (musicInfos.length) {
      const listId = await ensureLocalList()
      await addListMusics(listId, musicInfos, settingState.setting['list.addMusicLocationType'])
      importCount = musicInfos.length
    }

    // 持久化已导入路径（防止下次重复导入）
    const newPaths = allFiles.map(f => f.path)
    const mergedPaths = Array.from(new Set([...saved.paths, ...newPaths])).slice(-5000)
    await saveLocalMusicData({ paths: mergedPaths, lastScanTime: Date.now() })

    onProgress?.({ status: 'done', foundCount: allFiles.length, importCount, totalCount: newFiles.length })
    global.state_event.localMusicUpdated(mergedPaths.length)
    return { foundCount: allFiles.length, importCount }
  } catch (err: any) {
    onProgress?.({ status: 'error', foundCount: 0, importCount: 0, totalCount: 0, message: err?.message })
    throw err
  } finally {
    scanning = false
  }
}


/**
 * 启动时自动扫描（设置开启时）
 */
export const autoScanLocalMusic = (): void => {
  if (!settingState.setting['localMusic.autoScan']) return
  void scanLocalMusic().catch(() => {})
}


export const toastLocalScanDone = (importCount: number) => {
  toast(importCount > 0 ? `本地音乐：新增 ${importCount} 首` : '本地音乐：未发现新歌曲')
}
