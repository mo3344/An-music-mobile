import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useNavActiveId } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'

const TABS = [
  { id: 'nav_home', icon: 'home', label: '首页' },
  { id: 'nav_discover', icon: 'album', label: '发现' },
  { id: 'nav_love', icon: 'love', label: '我的音乐' },
  { id: 'nav_setting', icon: 'setting', label: '设置' },
] as const

export default memo(() => {
  const theme = useTheme()
  const activeId = useNavActiveId()

  return (
    <View style={styles.container}>
      {
        TABS.map(tab => {
          const active = activeId == tab.id || (activeId == 'nav_search' && tab.id == 'nav_home')
          return (
            <TouchableOpacity key={tab.id} style={styles.item} onPress={() => { setNavActiveId(tab.id) }}>
              <Icon name={tab.icon} size={17} color={active ? theme['c-primary'] : theme['c-font-label']} />
              <Text size={9} style={{ color: active ? theme['c-primary'] : theme['c-font-label'], fontWeight: active ? '700' : '400', marginTop: 2 }}>{tab.label}</Text>
            </TouchableOpacity>
          )
        })
      }
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: scaleSizeH(7),
    paddingBottom: scaleSizeH(9),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
    zIndex: 5,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
})
