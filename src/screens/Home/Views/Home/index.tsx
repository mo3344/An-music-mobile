import { memo, useEffect, useState, useCallback } from 'react'
import { ScrollView, TouchableOpacity, View, RefreshControl } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { useI18n } from '@/lang'
import musicSdk from '@/utils/musicSdk'
import { getBoardsList, getListDetail } from '@/core/leaderboard'
import { setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import playerState from '@/store/player/state'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { type ListInfoItem } from '@/store/songlist/state'
import { handlePlay as playBoard } from '../Leaderboard/listAction'


export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const [songlists, setSonglists] = useState<ListInfoItem[]>([])
  const [hotSongs, setHotSongs] = useState<LX.Music.MusicInfoOnline[]>([])
  const [boardId, setBoardId] = useState('')
  const [recent, setRecent] = useState<LX.Player.PlayMusicInfo[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(() => {
    setLoading(true)
    // 热门歌单
    void musicSdk.kw.songList.getList('hot', '', 1).then((result: any) => {
      setSonglists((result?.list ?? []).slice(0, 6))
    }).catch(() => {})

    // 热门歌曲（热歌榜）
    void getBoardsList('kw').then(list => {
      if (!list.length) return
      const b = list[0]
      setBoardId(b.id)
      void getListDetail(b.id, 1).then(d => {
        setHotSongs((d.list ?? []).slice(0, 10))
      }).catch(() => {})
    }).catch(() => {})

    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // 最近播放
  useEffect(() => {
    const update = () => setRecent([...playerState.playedList].reverse())
    update()
    global.state_event.on('playPlayedListChanged', update)
    return () => { global.state_event.off('playPlayedListChanged', update) }
  }, [])

  const recentList = recent.filter(r => (r.musicInfo as any).source != 'local')

  const openSonglist = (item: ListInfoItem) => {
    navigations.pushSonglistDetailScreen(commonState.componentIds.home!, item)
  }
  const playHotSong = (i: number) => {
    if (!boardId || !hotSongs.length) return
    void playBoard(boardId, hotSongs, i)
  }
  const playRecent = (i: number) => {
    const list = recentList.slice(0, 10).map(r => r.musicInfo) as unknown as LX.Music.MusicInfoOnline[]
    if (!list.length) return
    const idx = Math.min(i, list.length - 1)
    void setTempList('recent_play', list).then(() => void playList(LIST_IDS.TEMP, idx))
  }

  const renderSection = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text size={15} style={{ fontWeight: '700', color: theme['c-font'] }}>{title}</Text>
    </View>
  )

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
          <Text size={12} color={theme['c-font-label']} style={{ marginLeft: 6 }}>{t('search' as any)}</Text>
        </TouchableOpacity>
      </View>

      {/* 热门歌单 横向滚动 */}
      {renderSection(t('home_hot_songlists' as any))}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled contentContainerStyle={styles.hScroll}>
        {songlists.map((item, i) => (
          <TouchableOpacity key={item.id || i} style={styles.songCard} activeOpacity={0.85} onPress={() => openSonglist(item)}>
            <View style={styles.songCoverWrap}>
              <Image url={item.img ?? null} style={styles.songCover} cache />
              <View style={styles.songCoverOverlay} />
            </View>
            <Text size={11} color={theme['c-font']} style={styles.songName} numberOfLines={2}>{item.name}</Text>
            {item.play_count ? <Text size={9} color={theme['c-font-label']} style={styles.songPlay} numberOfLines={1}>{item.play_count} 收藏</Text> : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 热门歌曲 */}
      {renderSection(t('home_hot_songs' as any))}
      <View style={styles.songListWrap}>
        {hotSongs.map((s, i) => (
          <TouchableOpacity key={s.id || i} style={styles.songRow} activeOpacity={0.7} onPress={() => playHotSong(i)}>
            <Text size={14} style={{ ...styles.songIndex, color: i < 3 ? theme['c-primary'] : theme['c-font-label'], fontWeight: i < 3 ? '700' : '400' }}>{i + 1}</Text>
            <View style={styles.songInfo}>
              <Text size={13} color={theme['c-font']} numberOfLines={1}>{s.name}</Text>
              <Text size={10} color={theme['c-font-label']} numberOfLines={1}>{s.singer}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 最近播放 */}
      {renderSection(t('home_recent_play' as any))}
      <View style={styles.songListWrap}>
        {recentList.length ? recentList.slice(0, 10).map((r, i) => {
          const m = r.musicInfo as any
          return (
            <TouchableOpacity key={i} style={styles.songRow} activeOpacity={0.7} onPress={() => playRecent(i)}>
              <Text size={14} style={{ ...styles.songIndex, color: theme['c-font-label'] }}>{i + 1}</Text>
              <View style={styles.songInfo}>
                <Text size={13} color={theme['c-font']} numberOfLines={1}>{m.name}</Text>
                <Text size={10} color={theme['c-font-label']} numberOfLines={1}>{m.singer}</Text>
              </View>
            </TouchableOpacity>
          )
        }) : (
          <View style={styles.emptyWrap}>
            <Text size={12} color={theme['c-font-label']}>{t('home_no_recent' as any)}</Text>
          </View>
        )}
      </View>
      <View style={{ height: scaleSizeH(20) }} />
    </ScrollView>
  )
})

const CARD_W = scaleSizeW(112)
const COVER = scaleSizeW(112)

const styles = createStyle({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scaleSizeW(16), paddingBottom: scaleSizeH(8) },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: scaleSizeW(20), paddingHorizontal: scaleSizeW(14), paddingVertical: scaleSizeH(9) },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scaleSizeW(16), marginTop: scaleSizeH(12), marginBottom: scaleSizeH(8) },
  hScroll: { paddingHorizontal: scaleSizeW(14), gap: scaleSizeW(10) },
  songCard: { width: CARD_W },
  songCoverWrap: { width: COVER, height: COVER, borderRadius: scaleSizeW(10), overflow: 'hidden', position: 'relative' },
  songCover: { width: COVER, height: COVER, borderRadius: scaleSizeW(10) },
  songCoverOverlay: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: scaleSizeW(10) },
  songName: { marginTop: scaleSizeH(6), marginBottom: 1 },
  songPlay: { marginBottom: 0 },
  songListWrap: { paddingHorizontal: scaleSizeW(16) },
  songRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: scaleSizeH(7) },
  songIndex: { width: scaleSizeW(24), textAlign: 'center' },
  songInfo: { flex: 1, marginLeft: scaleSizeW(6) },
  emptyWrap: { paddingVertical: scaleSizeH(20), alignItems: 'center' },
})
