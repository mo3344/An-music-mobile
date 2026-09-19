import { memo } from 'react'
import { View } from 'react-native'

import CheckBoxItem from '../../components/CheckBoxItem'
import { createStyle } from '@/utils/tools'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'

export const LocalMusicAutoScan = memo(() => {
  const value = useSettingValue('localMusic.autoScan')
  return (
    <View style={styles.content}>
      <CheckBoxItem check={value} label="本地音乐：启动时自动扫描新歌曲" onChange={(v: boolean) => { updateSetting({ 'localMusic.autoScan': v }) }} />
    </View>
  )
})

export const LocalMusicDedup = memo(() => {
  const value = useSettingValue('localMusic.dedup')
  return (
    <View style={styles.content}>
      <CheckBoxItem check={value} label="本地音乐：导入时去重（按文件路径）" onChange={(v: boolean) => { updateSetting({ 'localMusic.dedup': v }) }} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
