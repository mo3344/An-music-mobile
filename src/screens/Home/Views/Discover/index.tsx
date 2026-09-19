import { memo, useEffect, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import SongList from '../SongList'
import Leaderboard from '../Leaderboard'
import { useTheme } from '@/store/theme/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import type { DiscoverTabType } from '@/config/constant'

// 发现页：歌单广场 / 排行榜 子页切换（复用原版两个完整视图）
export default memo(() => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  const [tab, setTab] = useState<DiscoverTabType>('square')
  const [inited, setInited] = useState<{ square: boolean, board: boolean }>({ square: true, board: false })

  useEffect(() => {
    const handleShow = (target: DiscoverTabType) => {
      setTab(target)
      setInited(prev => ({ ...prev, [target]: true }))
    }
    global.app_event.on('showDiscoverTab', handleShow)
    return () => {
      global.app_event.off('showDiscoverTab', handleShow)
    }
  }, [])

  const handleSwitch = (target: DiscoverTabType) => {
    setTab(target)
    setInited(prev => ({ ...prev, [target]: true }))
  }

  return (
    <View style={styles.container}>
      <View style={{ ...styles.subNav, paddingTop: statusBarHeight }}>
        <TouchableOpacity style={styles.subTab} onPress={() => handleSwitch('square')}>
          <Text size={tab == 'square' ? 15 : 12} style={{ fontWeight: tab == 'square' ? '700' : '400' }} color={tab == 'square' ? theme['c-font'] : theme['c-font-label']}>歌单广场</Text>
          <View style={{ ...styles.underline, backgroundColor: tab == 'square' ? theme['c-primary'] : 'transparent' }} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.subTab} onPress={() => handleSwitch('board')}>
          <Text size={tab == 'board' ? 15 : 12} style={{ fontWeight: tab == 'board' ? '700' : '400' }} color={tab == 'board' ? theme['c-font'] : theme['c-font-label']}>排行榜</Text>
          <View style={{ ...styles.underline, backgroundColor: tab == 'board' ? theme['c-primary'] : 'transparent' }} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {
          inited.square && (tab == 'square' ? <SongList /> : null)
        }
        {
          inited.board && (tab == 'board' ? <Leaderboard /> : null)
        }
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
  },
  subNav: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: scaleSizeW(18),
    paddingTop: scaleSizeH(10),
    paddingBottom: scaleSizeH(4),
    gap: scaleSizeW(20),
  },
  subTab: {
    alignItems: 'center',
  },
  underline: {
    width: scaleSizeW(18),
    height: scaleSizeH(3),
    borderRadius: scaleSizeW(2),
    marginTop: scaleSizeH(3),
  },
  content: {
    flex: 1,
  },
})
