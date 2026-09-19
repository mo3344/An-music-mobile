/**
 * 歌曲下载任务管理器
 * 支持多音质（128k/320k/无损FLAC/Hi-Res）下载、并发队列、进度、取消、重试。
 * 文件保存到 公共音乐目录（失败时降级应用私有目录）。
 */
import RNFS from 'react-native-fs'
import { mkdir, stat, existsFile } from '@/utils/fs'
import { getMusicUrl } from '@/core/music'
import { getData, saveData } from '@/plugins/storage'
import { storageDataPrefix } from '@/config/constant'
import settingState from '@/store/setting/state'
import { sizeFormate, toast } from '@/utils/tools'


export type DownloadStatus = 'waiting' | 'running' | 'error' | 'done'

export interface DownloadTaskInfo {
  id: string
  musicInfo: LX.Music.MusicInfoOnline
  quality: LX.Quality
  status: DownloadStatus
  progress: number // 0-100
  receivedBytes: number
  totalBytes: number
  filePath: string
  fileName: string
  message?: string
  jobId?: number
}

export const QUALITY_LABELS: Record<LX.Quality, string> = {
  '128k': '标准 128K',
  '320k': '高清 320K',
  flac: '无损 FLAC',
  flac24bit: 'Hi-Res 无损',
}

const EXT_MAP: Record<LX.Quality, string> = {
  '128k': 'mp3',
  '320k': 'mp3',
  flac: 'flac',
  flac24bit: 'flac',
}

const MAX_CONCURRENT = 2
const downloadDoneKey = storageDataPrefix.localMusic + '_download_done'

const tasks = new Map<string, DownloadTaskInfo>()
const waitingIds: string[] = []
let runningCount = 0
let saveDir: string | null = null
let doneCache: DownloadTaskInfo[] | null = null


export const getSaveDir = (): string => {
  if (saveDir) return saveDir
  saveDir = '/storage/emulated/0/Music/AnMusic'
  return saveDir
}

// 目录写入失败时降级
const ensureSaveDir = async(): Promise<string> => {
  const target = getSaveDir()
  try {
    await mkdir(target)
    return target
  } catch {
    const fallback = RNFS.DocumentDirectoryPath + '/an_music_download'
    await mkdir(fallback).catch(() => {})
    saveDir = fallback
    return fallback
  }
}


const extOf = (url: string, quality: LX.Quality): string => {
  const m = url.split('?')[0].match(/\.(\w{2,5})$/)
  if (m && ['mp3', 'flac', 'm4a', 'aac', 'ogg', 'wav', 'ape'].includes(m[1].toLowerCase())) return m[1].toLowerCase()
  return EXT_MAP[quality] ?? 'mp3'
}

const buildFileName = (musicInfo: LX.Music.MusicInfoOnline, quality: LX.Quality, ext: string): string => {
  const pattern = settingState.setting['download.fileName']
  let base: string
  if (pattern == '歌手 - 歌名') base = `${musicInfo.singer} - ${musicInfo.name}`
  else if (pattern == '歌名') base = musicInfo.name
  else base = `${musicInfo.name} - ${musicInfo.singer}`
  base = base.replace(/[\\/:*?"<>|]/g, '_').trim()
  return `${base} [${quality}].${ext}`
}


const notify = () => {
  global.app_event.downloadListUpdate()
  global.state_event.downloadTaskChanged()
}


const persistDone = async() => {
  const done = [...tasks.values()].filter(t => t.status == 'done')
  doneCache = done
  void saveData(downloadDoneKey, done.map(t => ({
    id: t.id,
    musicInfo: t.musicInfo,
    quality: t.quality,
    status: t.status,
    progress: 100,
    receivedBytes: t.receivedBytes,
    totalBytes: t.totalBytes,
    filePath: t.filePath,
    fileName: t.fileName,
  })))
}

export const getDoneTasks = async(): Promise<DownloadTaskInfo[]> => {
  if (doneCache) return doneCache
  doneCache = await getData<DownloadTaskInfo[]>(downloadDoneKey) ?? []
  return doneCache
}


const pump = () => {
  while (runningCount < MAX_CONCURRENT && waitingIds.length > 0) {
    const id = waitingIds.shift()!
    const task = tasks.get(id)
    if (!task || task.status != 'waiting') continue
    void runTask(task)
  }
}

const runTask = async(task: DownloadTaskInfo) => {
  runningCount++
  task.status = 'running'
  task.progress = 0
  notify()
  try {
    const url = await getMusicUrl({
      musicInfo: task.musicInfo,
      quality: task.quality,
      isRefresh: false,
      onToggleSource: () => {},
      allowToggleSource: false,
    })
    if (!url || url.startsWith('file://')) throw new Error('无法获取下载地址')

    const dir = await ensureSaveDir()
    let ext = extOf(url, task.quality)
    let fileName = buildFileName(task.musicInfo, task.quality, ext)
    let filePath = `${dir}/${fileName}`
    // 重名追加序号
    let idx = 1
    while (await existsFile(filePath).catch(() => false)) {
      const dot = fileName.lastIndexOf('.')
      filePath = `${dir}/${fileName.substring(0, dot)}(${idx++})${fileName.substring(dot)}`
    }
    task.filePath = filePath
    task.fileName = filePath.split('/').at(-1) ?? fileName

    const info = await stat(dir).catch(() => null)
    void info

    const download = RNFS.downloadFile({
      fromUrl: url,
      toFile: filePath,
      background: true,
      discretionary: false,
      progress: (res) => {
        const total = res.contentLength ?? task.totalBytes
        task.totalBytes = total
        task.receivedBytes = res.bytesWritten
        task.progress = total > 0 ? Math.min(99, Math.round(res.bytesWritten / total * 100)) : task.progress
        notify()
      },
    })
    task.jobId = download.jobId
    await download.promise
    // 校验文件存在且非空
    const st = await stat(filePath).catch(() => null)
    if (!st || Number((st as any).size ?? 0) < 1024) throw new Error('下载文件异常')
    task.receivedBytes = Number((st as any).size ?? 0)
    task.totalBytes = task.receivedBytes
    task.progress = 100
    task.status = 'done'
    task.message = sizeFormate(task.receivedBytes)
    void persistDone()
    toast(`已下载：${task.musicInfo.name}（${QUALITY_LABELS[task.quality]}）`)
  } catch (err: any) {
    const msg = String(err?.message ?? err ?? '')
    if (!msg.includes('cancel')) {
      task.status = 'error'
      task.message = msg.includes('401') || msg.includes('403') ? '无版权或需要会员，请更换音质/音源' : '下载失败，请重试'
    }
  } finally {
    runningCount--
    if (task.jobId) delete task.jobId
    notify()
    pump()
  }
}


/**
 * 创建下载任务（若同歌曲同音质已在队列/进行中则跳过）
 */
export const startDownload = (musicInfo: LX.Music.MusicInfoOnline, quality: LX.Quality): boolean => {
  const id = `${musicInfo.id}_${quality}`
  const exist = tasks.get(id)
  if (exist && (exist.status == 'waiting' || exist.status == 'running')) return false
  const task: DownloadTaskInfo = {
    id,
    musicInfo,
    quality,
    status: 'waiting',
    progress: 0,
    receivedBytes: 0,
    totalBytes: Number(musicInfo.meta._qualitys?.[quality]?.size ?? 0),
    filePath: '',
    fileName: '',
  }
  tasks.set(id, task)
  waitingIds.push(id)
  notify()
  pump()
  return true
}

export const cancelDownload = (id: string) => {
  const task = tasks.get(id)
  if (!task) return
  if (task.jobId) {
    try { RNFS.stopDownload(task.jobId) } catch {}
    delete task.jobId
  }
  if (task.status == 'running' || task.status == 'waiting') {
    if (task.filePath) void RNFS.unlink(task.filePath).catch(() => {})
  }
  const qi = waitingIds.indexOf(id)
  if (qi >= 0) waitingIds.splice(qi, 1)
  tasks.delete(id)
  notify()
  pump()
}

export const retryDownload = (id: string) => {
  const task = tasks.get(id)
  if (!task || task.status != 'error') return
  task.status = 'waiting'
  task.message = undefined
  waitingIds.push(id)
  notify()
  pump()
}

export const clearDoneTasks = () => {
  for (const [id, task] of tasks) {
    if (task.status == 'done') tasks.delete(id)
  }
  doneCache = []
  void saveData(downloadDoneKey, [])
  notify()
}

export const getTasks = (): DownloadTaskInfo[] => {
  return [...tasks.values()].sort((a, b) => {
    const order: Record<DownloadStatus, number> = { running: 0, waiting: 1, error: 2, done: 3 }
    return order[a.status] - order[b.status]
  })
}

export const isTaskExists = (musicInfo: LX.Music.MusicInfoOnline, quality: LX.Quality): boolean => {
  const id = `${musicInfo.id}_${quality}`
  const exist = tasks.get(id)
  return !!exist && (exist.status == 'waiting' || exist.status == 'running' || exist.status == 'done')
}
