import { memo, useEffect, useState, useCallback } from 'react'
import { ScrollView, TouchableOpacity, View, RefreshControl } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { useI18n } from '@/lang'
import musicSdk from '@/utils/musicSdk'
import { getBoardsList, getListDetail } from '@/core/leaderboard'
import boardState from '@/store/leaderboard/state'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { type ListInfoItem } from '@/store/songlist/state'

// 榜单渐变色
const BOARD_COLORS: Record<string, [string, string]> = {
  hot: ['#9C27B0', '#673AB7'],
  new: ['#00BCD4', '#009688'],
  rise: ['#FF5722', '#E91E63'],
  top500: ['#FF9800', '#FF5722'],
 抖音: ['#E91E63', '#9C27B0'],
}
const defaultColors: [string, string] = ['#3F51B5', '#2196F3']

const getColor = (id: string): [string, string] => {
  for (const k of Object.keys(BOARD_COLORS)) {
    if (id.includes(k)) return BOARD_COLORS[k]
  }
  return defaultColors
}

// 歌单渐变色池
const SONG_COLORS: [string, string][] = [
  ['#5C6BC0', '#3F51B5'],
  ['#26A69A', '#00897B'],
  ['#EC407A', '#D81B60'],
  ['#AB47BC', '#8E24AA'],
  ['#FFA726', '#FB8C00'],
  ['#42A5F5', '#1E88E5'],
  ['#66BB6A', '#43A047'],
  ['#7E57C2', '#5E35B1'],
  ['#FF7043', '#F4511E'],
  ['#26C6DA', '#00ACC1'],
]
const getSongColor = (i: number): [string, string] => SONG_COLORS[i % SONG_COLORS.length]

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const [songlists, setSonglists] = useState<ListInfoItem[]>([])
  const [boards, setBoards] = useState<ListInfoItem[]>([])
  const [boardSongs, setBoardSongs] = useState<Record<string, LX.Music.MusicInfoOnline[]>>({})
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(() => {
    setLoading(true)
    // 歌单广场（酷我热门）
    void musicSdk.kw.songList.getList('hot', '', 1).then((result: any) => {
      setSonglists((result?.list ?? []).slice(0, 8))
    }).catch(() => {})

    // 排行榜列表
    void getBoardsList('kw').then(list => {
      const top4 = list.slice(0, 4)
      setBoards(top4)
      // 取每个榜单前3首歌
      top4.forEach(board => {
        const boardId = board.id
        void getListDetail(boardId, 1).then(detail => {
          setBoardSongs(prev => ({ ...prev, [boardId]: (detail?.list ?? []).slice(0, 3) }))
        }).catch(() => {})
      })
    }).catch(() => {})

    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleOpenSonglist = (item: ListInfoItem) => {
    navigations.pushSonglistDetailScreen(commonState.componentIds.home!, item)
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} colors={[theme['c-primary']]} />}
    >
      {/* 顶部搜索栏 */}
      <View style={{ ...styles.topBar, paddingTop: statusBarHeight }}>
        <TouchableOpacity style={{ ...styles.searchBox, backgroundColor: theme['c-primary-background-hover'] }} onPress={() => setNavActiveId('nav_search')}>
          <Icon name="search-2" size={14} color={theme['c-font-label']} />
          <Text size={12} color={theme['c-font-label']} style={{ marginLeft: 6 }}>{t('search')}</Text>
        </TouchableOpacity>
      </View>

      {/* 双列卡片网格 */}
      <View style={styles.grid}>
        {/* 排行榜卡片（穿插在前几行） */}
        {boards.map((board, i) => {
          const [c1, c2] = getColor(board.id)
          const songs = boardSongs[board.id] || []
          return (
            <TouchableOpacity key={board.id} style={styles.card} activeOpacity={0.85} onPress={() => { setNavActiveId('nav_discover'); global.app_event.showDiscoverTab('board') }}>
              <View style={{ ...styles.cardBg, backgroundColor: c2 }}>
                <View style={{ ...styles.cardBgOverlay, backgroundColor: c1 }} />
              </View>
              <Text size={13} style={styles.cardTitle} color="#fff">{board.name}</Text>
              {songs.map((s, si) => (
                <Text key={si} size={9} color="rgba(255,255,255,0.7)" style={styles.boardSong} numberOfLines={1}>
                  {si + 1}  {s.name}
                </Text>
              ))}
            </TouchableOpacity>
          )
        })}

        {/* 歌单卡片 */}
        {songlists.map((item, i) => {
          const [c1, c2] = getSongColor(i)
          return (
            <TouchableOpacity key={item.id || i} style={styles.card} activeOpacity={0.85} onPress={() => handleOpenSonglist(item)}>
              <View style={{ ...styles.cardBg, backgroundColor: c2 }}>
                <View style={{ ...styles.cardBgOverlay, backgroundColor: c1 }} />
              </View>
              <Text size={12} style={styles.cardTitle} color="#fff" numberOfLines={1}>{item.name}</Text>
              <Text size={9} color="rgba(255,255,255,0.65)" style={styles.cardSub} numberOfLines={1}>{item.play_count ? item.play_count + ' 收藏' : ''}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
      <View style={{ height: scaleSizeH(20) }} />
    </ScrollView>
  )
})

const CARD_GAP = scaleSizeW(10)
const CARD_W = scaleSizeW(175)

const styles = createStyle({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scaleSizeW(16), paddingBottom: scaleSizeH(8) },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: scaleSizeW(20), paddingHorizontal: scaleSizeW(14), paddingVertical: scaleSizeH(9) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: scaleSizeW(14), paddingBottom: scaleSizeH(10) },
  card: {
    width: CARD_W,
    height: scaleSizeH(110),
    marginBottom: CARD_GAP,
    borderRadius: scaleSizeW(12),
    overflow: 'hidden',
    padding: scaleSizeW(12),
    justifyContent: 'flex-end',
  },
  cardBg: {
    position: 'absolute', left: 0, top: 0, right: 0, bottom: 0,
  },
  cardBgOverlay: {
    position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: 0.85,
  },
  cardTitle: { fontWeight: '700', marginBottom: 2 },
  cardSub: { marginTop: 1 },
  boardSong: { marginTop: 1, lineHeight: scaleSizeH(14) },
})
