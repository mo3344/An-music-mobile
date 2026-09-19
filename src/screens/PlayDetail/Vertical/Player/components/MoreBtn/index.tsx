import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { createStyle } from '@/utils/tools'
import PlayModeBtn from './PlayModeBtn'
import DesktopLyricBtn from './DesktopLyricBtn'
import MusicAddBtn from './MusicAddBtn'
import CommentBtn from './CommentBtn'
import TimeoutExitBtn from './TimeoutExitBtn'
import DownloadBtn from './DownloadBtn'

export default memo(() => {
  return (
    <View style={styles.container}>
      <PlayModeBtn />
      <DesktopLyricBtn />
      <DownloadBtn />
      <MusicAddBtn />
      <CommentBtn />
      <TimeoutExitBtn />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: '4%',
    paddingVertical: 10,
  },
})
