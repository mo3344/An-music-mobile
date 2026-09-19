import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, TouchableOpacity, View, RefreshControl } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { getBoardsList, getListDetail } from '@/core/leaderboard'
import { getLeaderboardSetting, saveLeaderboardSetting } from '@/utils/data'
import leaderboardState, { type BoardItem } from '@/store/leaderboard/state'
import MusicList, { type MusicListType } from '../MusicList'
import { handlePlay, handleCollect } from '../listAction'

// 榜单渐变色
const BOARD_COLORS: Record<string, [string, string]> = {
  热: ['#FF5722', '#E91E63'],
  飙: ['#FF9800', '#FF5722'],
  新: ['#00BCD4', '#009688'],
  经典: ['#3F51B5', '#2196F3'],
  抖: ['#E91E63', '#9C27B0'],
  繁星: ['#7E57C2', '#5E35B1'],
}
const defaultColors: [string, string] = ['#3F51B5', '#2196F3']
const getColor = (name: string): [string, string] => {
  for (const k of Object.keys(BOARD_COLORS)) {
    if (name.includes(k)) return BOARD_COLORS[k]
  }
  return defaultColors
}

export default () => {
  const theme = useTheme()
  const [source, setSource] = useState<LX.OnlineSource>('kw')
  const [boards, setBoards] = useState<BoardItem[]>([])
  const [boardSongs, setBoardSongs] = useState<Record<string, LX.Music.MusicInfoOnline[]>>({})
  const [current, setCurrent] = useState<BoardItem | null>(null)
  const [loading, setLoading] = useState(false)
  const musicListRef = useRef<MusicListType>(null)

  const loadBoards = useCallback(async(src: LX.OnlineSource) => {
    setLoading(true)
    setBoardSongs({})
    try {
      const list = await getBoardsList(src)
      setBoards(list)
      const targets = list.slice(0, 10)
      for (const b of targets) {
        void getListDetail(b.id, 1).then(d => {
          setBoardSongs(prev => ({ ...prev, [b.id]: (d.list ?? []).slice(0, 3) }))
        }).catch(() => {})
      }
    } catch {} finally { setLoading(false) }
  }, [])

  // 初始化音源
  useEffect(() => {
    void getLeaderboardSetting().then(({ source: s, boardId }) => {
      setSource(s)
      void loadBoards(s)
    }).catch(() => { void loadBoards('kw') })
  }, [loadBoards])

  // 进入榜单详情时加载
  useEffect(() => {
    if (current) musicListRef.current?.loadList(source, current.id)
  }, [current, source])

  const switchSource = (s: LX.OnlineSource) => {
    if (s == source) return
    setCurrent(null)
    setSource(s)
    void saveLeaderboardSetting({ source: s, boardId: '' })
    void loadBoards(s)
  }

  const openBoard = (b: BoardItem) => {
    setCurrent(b)
  }
  const backToGrid = () => {
    setCurrent(null)
  }
  const playAll = () => {
    if (current) void handlePlay(current.id)
  }
  const collectBoard = () => {
    if (current) void handleCollect(current.id, current.name, source)
  }

  if (current) {
    // 榜单详情列表态
    return (
      <View style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={backToGrid} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Icon name="chevron-left" size={20} color={theme['c-font']} />
          </TouchableOpacity>
          <Text size={15} style={{ fontWeight: '700', color: theme['c-font'], flex: 1, marginLeft: scaleSizeW(4) }} numberOfLines={1}>{current.name}</Text>
          <TouchableOpacity style={styles.detailAction} onPress={collectBoard} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
            <Icon name="add-music" size={16} color={theme['c-font-label']} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.detailAction} onPress={playAll} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
            <Icon name="play" size={16} color={theme['c-primary']} />
          </TouchableOpacity>
        </View>
        <View style={styles.listContainer}>
          <MusicList ref={musicListRef} />
        </View>
      </View>
    )
  }

  // 榜单网格态
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadBoards(source)} colors={[theme['c-primary']]} />}
    >
      {/* 音源切换 */}
      <View style={styles.sourceBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sourceScroll}>
          {leaderboardState.sources.map(s => (
            <TouchableOpacity key={s} style={{ ...styles.sourcePill, backgroundColor: s == source ? theme['c-primary'] : theme['c-primary-background-hover'] }} onPress={() => switchSource(s)}>
              <Text size={11} style={{ fontWeight: '700' as const, color: s == source ? '#fff' : theme['c-font-label'] }}>{s.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 双列卡片网格 */}
      <View style={styles.grid}>
        {boards.map((b, i) => {
          const [c1, c2] = getColor(b.name)
          const songs = boardSongs[b.id] || []
          const cover = (songs[0] as any)?.img
          return (
            <TouchableOpacity key={b.id} style={styles.card} activeOpacity={0.85} onPress={() => openBoard(b)}>
              <View style={styles.cardCoverWrap}>
                {cover ? (
                  <Image url={cover} style={styles.cardCover} cache />
                ) : (
                  <View style={{ ...styles.cardCover, backgroundColor: c2 }} />
                )}
                <View style={{ ...styles.cardGradient, backgroundColor: c1 }} />
                <View style={styles.cardShade} />
              </View>
              <View style={styles.cardBody}>
                <Text size={13} style={{ fontWeight: '700', color: '#fff' }} numberOfLines={1}>{b.name}</Text>
                {songs.map((s, si) => (
                  <Text key={si} size={9} color="rgba(255,255,255,0.72)" style={styles.boardSong} numberOfLines={1}>
                    {si + 1}  {s.name}
                  </Text>
                ))}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
      <View style={{ height: scaleSizeH(20) }} />
    </ScrollView>
  )
}

const CARD_GAP = scaleSizeW(10)
const CARD_W = scaleSizeW(172)
const CARD_H = scaleSizeH(128)

const styles = createStyle({
  container: { flex: 1 },
  sourceBar: { paddingBottom: scaleSizeH(6) },
  sourceScroll: { paddingHorizontal: scaleSizeW(14), gap: scaleSizeW(8) },
  sourcePill: { paddingHorizontal: scaleSizeW(14), paddingVertical: scaleSizeH(5), borderRadius: scaleSizeW(14) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: scaleSizeW(14), paddingBottom: scaleSizeH(10) },
  card: {
    width: CARD_W,
    height: CARD_H,
    marginBottom: CARD_GAP,
    borderRadius: scaleSizeW(12),
    overflow: 'hidden',
  },
  cardCoverWrap: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
  cardCover: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
  cardGradient: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: 0.55 },
  cardShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', backgroundColor: 'rgba(0,0,0,0.25)' },
  cardBody: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: scaleSizeW(12) },
  boardSong: { marginTop: scaleSizeH(1), lineHeight: scaleSizeH(14) },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: scaleSizeW(12), paddingBottom: scaleSizeH(8),
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: { padding: scaleSizeW(4) },
  detailAction: { paddingHorizontal: scaleSizeW(8), paddingVertical: scaleSizeW(4) },
  listContainer: { flex: 1 },
})
