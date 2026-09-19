import { memo, useEffect, useState, useCallback } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import SongList from '../SongList'
import Leaderboard from '../Leaderboard'
import { useI18n } from '@/lang'

type Tab = 'songlist' | 'leaderboard'

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const [tab, setTab] = useState<Tab>('songlist')
  const [inited, setInited] = useState({ songlist: true, leaderboard: false })

  const handleTab = (target: Tab) => {
    setTab(target)
    setInited(prev => ({ ...prev, [target]: true }))
  }

  return (
    <View style={styles.container}>
      {/* 顶部搜索栏 */}
      <View style={{ ...styles.topBar, paddingTop: statusBarHeight }}>
        <TouchableOpacity style={{ ...styles.searchBox, backgroundColor: theme['c-primary-background-hover'] }} onPress={() => setNavActiveId('nav_search')}>
          <Icon name="search-2" size={14} color={theme['c-font-label']} />
          <Text size={12} color={theme['c-font-label']} style={{ marginLeft: 6 }}>{t('search')}</Text>
        </TouchableOpacity>
      </View>
      {/* 子导航 */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTab('songlist')}>
          <Text size={tab == 'songlist' ? 16 : 13} style={{ fontWeight: tab == 'songlist' ? '700' : '400' }} color={tab == 'songlist' ? theme['c-font'] : theme['c-font-label']}>{t('nav_songlist')}</Text>
          <View style={{ ...styles.underline, backgroundColor: tab == 'songlist' ? theme['c-primary'] : 'transparent' }} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTab('leaderboard')}>
          <Text size={tab == 'leaderboard' ? 16 : 13} style={{ fontWeight: tab == 'leaderboard' ? '700' : '400' }} color={tab == 'leaderboard' ? theme['c-font'] : theme['c-font-label']}>{t('nav_top')}</Text>
          <View style={{ ...styles.underline, backgroundColor: tab == 'leaderboard' ? theme['c-primary'] : 'transparent' }} />
        </TouchableOpacity>
      </View>
      {/* 内容 */}
      <View style={styles.content}>
        {inited.songlist && tab == 'songlist' ? <SongList /> : null}
        {inited.leaderboard && tab == 'leaderboard' ? <Leaderboard /> : null}
      </View>
    </View>
  )
})

const styles = createStyle({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scaleSizeW(16), paddingBottom: scaleSizeH(6) },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: scaleSizeW(18), paddingHorizontal: scaleSizeW(14), paddingVertical: scaleSizeH(8) },
  tabBar: { flexDirection: 'row', paddingHorizontal: scaleSizeW(18), borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  tabItem: { marginRight: scaleSizeW(24), paddingVertical: scaleSizeH(6), alignItems: 'center' },
  underline: { width: scaleSizeW(20), height: scaleSizeH(3), borderRadius: scaleSizeW(2), marginTop: scaleSizeH(2) },
  content: { flex: 1 },
})
