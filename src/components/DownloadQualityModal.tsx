import { forwardRef, memo, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import { useTheme } from '@/store/theme/hook'
import { BorderRadius, BorderWidths } from '@/theme'
import { startDownload, QUALITY_LABELS, isTaskExists } from '@/core/music/downloadTask'
import { toast } from '@/utils/tools'

export interface DownloadQualityModalType {
  show: (musicInfo: LX.Music.MusicInfoOnline) => void
}

const QUALITY_ORDER: LX.Quality[] = ['128k', '320k', 'flac', 'flac24bit']

const qualityDesc: Record<LX.Quality, string> = {
  '128k': '标准音质 · 体积小',
  '320k': '高清音质 · 推荐日常',
  flac: '无损音质 · 保留全部细节',
  flac24bit: '母带级 Hi-Res · 24bit 深度',
}

const qualityTips: Record<LX.Quality, string> = {
  '128k': '约 3~4 MB / 首',
  '320k': '约 8~12 MB / 首',
  flac: '约 25~40 MB / 首',
  flac24bit: '约 40~120 MB / 首',
}

export default memo(forwardRef<DownloadQualityModalType, {}>((props, ref) => {
  const dialogRef = useRef<DialogType>(null)
  const theme = useTheme()
  const [musicInfo, setMusicInfo] = useState<LX.Music.MusicInfoOnline | null>(null)

  useImperativeHandle(ref, () => ({
    show(mInfo) {
      setMusicInfo(mInfo)
      requestAnimationFrame(() => dialogRef.current?.setVisible(true))
    },
  }))

  const handleSelect = (quality: LX.Quality) => {
    if (!musicInfo) return
    const avail = musicInfo.meta._qualitys?.[quality]
    if (!avail) {
      toast('该音源暂不支持此音质，请换音源或音质')
      return
    }
    if (isTaskExists(musicInfo, quality)) {
      toast('该歌曲已在下载队列中')
      return
    }
    startDownload(musicInfo, quality)
    dialogRef.current?.setVisible(false)
    toast(`已加入下载队列：${QUALITY_LABELS[quality]}`)
  }

  return (
    <Dialog ref={dialogRef}>
      <View style={{ ...styles.container, backgroundColor: theme['c-primary-background'] }}>
        <Text style={{ ...styles.title, fontWeight: '700' }} color={theme['c-font']}>选择下载音质</Text>
        <Text style={styles.songName} color={theme['c-font-label']} size={12}>
          {musicInfo ? `${musicInfo.name} - ${musicInfo.singer}` : ''}
        </Text>
        <ScrollView style={styles.list}>
          {
            QUALITY_ORDER.map(q => {
              const avail = !!musicInfo?.meta._qualitys?.[q]
              return (
                <TouchableOpacity key={q} style={styles.item} onPress={() => handleSelect(q)} disabled={!avail}>
                  <View style={{ ...styles.itemIcon, backgroundColor: avail ? theme['c-primary-background-active'] : theme['c-primary-background-hover'] }}>
                    <Text size={13} style={{ fontWeight: '700' }} color={avail ? theme['c-primary-font-active'] : theme['c-font-label']}>{q.replace('flac24bit', 'HR').replace('flac', 'SQ').replace('k', 'K')}</Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text color={avail ? theme['c-font'] : theme['c-font-label']}>{QUALITY_LABELS[q]}{avail ? '' : '（不可用）'}</Text>
                    <Text size={10} color={theme['c-font-label']} style={{ marginTop: 2 }}>{qualityDesc[q]} · {qualityTips[q]}</Text>
                  </View>
                  <Text size={12} color={theme['c-primary-font-active']}>{avail ? '下载' : ''}</Text>
                </TouchableOpacity>
              )
            })
          }
        </ScrollView>
        <Text size={10} color={theme['c-font-label']} style={styles.tip}>
          文件保存到 手机存储/Music/AnMusic 目录
        </Text>
      </View>
    </Dialog>
  )
}))

const styles = createStyle({
  container: {
    borderRadius: BorderRadius.normal,
    padding: 18,
    paddingTop: 16,
    marginHorizontal: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  songName: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  list: {
    maxHeight: 320,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: BorderWidths.normal,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tip: {
    textAlign: 'center',
    marginTop: 10,
  },
})
