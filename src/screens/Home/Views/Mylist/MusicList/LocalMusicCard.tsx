import { forwardRef, memo, useImperativeHandle, useCallback, useEffect, useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import Button from '@/components/common/Button'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { BorderRadius } from '@/theme'
import settingState from '@/store/setting/state'
import { scanLocalMusic, isScanning, type LocalScanProgress } from '@/core/localMusic'
import { getLocalMusicData } from '@/utils/data'
import DownloadManagerModal, { type DownloadManagerModalType } from './DownloadManagerModal'

const settingAutoScan = (): boolean => settingState.setting['localMusic.autoScan'] !== false

export interface LocalMusicCardType {
  refresh: () => void
}

export default memo(forwardRef<LocalMusicCardType, {}>((props, ref) => {
  const theme = useTheme()
  const downloadModalRef = useRef<DownloadManagerModalType>(null)
  const [progress, setProgress] = useState<LocalScanProgress | null>(null)
  const [summary, setSummary] = useState<{ count: number, lastScanTime: number }>({ count: 0, lastScanTime: 0 })
  const unmountedRef = useRef(false)
  const autoScanRef = useRef(false)

  const refreshSummary = useCallback(() => {
    void getLocalMusicData().then(data => {
      if (unmountedRef.current) return
      setSummary({ count: data.paths.length, lastScanTime: data.lastScanTime })
    })
  }, [])

  useImperativeHandle(ref, () => ({ refresh: refreshSummary }), [refreshSummary])

  useEffect(() => {
    unmountedRef.current = false
    refreshSummary()
    // 启动自动扫描（每次进入我的音乐页且开启设置时）
    if (!autoScanRef.current && settingAutoScan() && !isScanning()) {
      autoScanRef.current = true
      void scanLocalMusic(p => { if (!unmountedRef.current) setProgress(p) })
        .catch(() => {})
        .finally(() => { if (!unmountedRef.current) setProgress(null) })
    }
    return () => { unmountedRef.current = true }
  }, [refreshSummary])

  const handleScan = useCallback(() => {
    if (isScanning()) return
    void scanLocalMusic(p => { if (!unmountedRef.current) setProgress(p) })
      .then(result => {
        refreshSummary()
      })
      .catch(() => {})
      .finally(() => { if (!unmountedRef.current) setProgress(null) })
  }, [refreshSummary])

  const scanning = progress != null && (progress.status == 'scanning' || progress.status == 'reading')

  return (
    <View style={styles.container}>
      <View style={{ ...styles.localCard, backgroundColor: theme['c-primary-background-active'] }}>
        <View style={styles.cardTop}>
          <Text size={10} style={{ ...styles.kicker, fontWeight: '800' }} color={theme['c-primary-font-active']}>LOCAL MUSIC · 本地音乐</Text>
        </View>
        <Text style={styles.cardTitle} color={theme['c-font']}>本地音乐导入</Text>
        <Text size={10} color={theme['c-font-label']} style={styles.cardDesc}>扫描手机中的音频文件 · 支持歌曲菜单下载到本地后播放</Text>
        <Button style={{ ...styles.scanBtn, backgroundColor: theme['c-primary'] }} onPress={handleScan} disabled={scanning}>
          <Text size={11} style={{ fontWeight: '700' }} color={theme['c-primary-font']}>
            {scanning ? `扫描中… ${progress?.importCount ?? 0}/${progress?.totalCount ?? 0}` : '＋ 扫描导入'}
          </Text>
        </Button>
        <Text size={9} color={theme['c-font-label']} style={styles.cardStatus}>
          {
            summary.count > 0
              ? `已导入 ${summary.count} 首${summary.lastScanTime > 0 ? ` · 上次扫描 ${new Date(summary.lastScanTime).toLocaleDateString()}` : ''}`
              : '尚未导入 · 点击扫描导入本地歌曲'
          }
        </Text>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={{ ...styles.actionCard, backgroundColor: theme['c-main-background'] }}
          onPress={handleScan}
        >
          <Text size={12} style={{ fontWeight: '700' }} color={theme['c-font']}>♫ 本地音乐</Text>
          <Text size={9} color={theme['c-font-label']} style={{ marginTop: 3 }}>共 {summary.count} 首 · 点击重新扫描</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.actionCard, backgroundColor: theme['c-main-background'] }}
          onPress={() => downloadModalRef.current?.show()}
        >
          <Text size={12} style={{ fontWeight: '700' }} color={theme['c-font']}>⬇ 下载管理</Text>
          <Text size={9} color={theme['c-font-label']} style={{ marginTop: 3 }}>查看下载任务与进度</Text>
        </TouchableOpacity>
      </View>

      <DownloadManagerModal ref={downloadModalRef} />
    </View>
  )
}))

// 直接读设置状态（避免 hook 循环依赖问题）

const styles = createStyle({
  container: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  localCard: {
    borderRadius: BorderRadius.normal3,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kicker: {
    letterSpacing: 1.5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  cardDesc: {
    marginTop: 4,
    lineHeight: 15,
  },
  scanBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.normal4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 10,
  },
  cardStatus: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  actionCard: {
    flex: 1,
    borderRadius: BorderRadius.normal3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    padding: 12,
  },
})
