import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import settingState from '@/store/setting/state'
import MusicList from './MusicList'
import MyList from './MyList'
import { useTheme } from '@/store/theme/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import { COMPONENT_IDS } from '@/config/constant'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import type { InitState as CommonState } from '@/store/common/state'

const MAX_WIDTH = scaleSizeW(400)

export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  const t = useI18n()

  useEffect(() => {
    const handleFixDrawer = (id: CommonState['navActiveId']) => {
      if (id == 'nav_love') drawer.current?.fixWidth()
    }
    const changeVisible = (visible: boolean) => {
      if (visible) {
        requestAnimationFrame(() => {
          drawer.current?.openDrawer()
        })
      } else {
        drawer.current?.closeDrawer()
      }
    }

    global.state_event.on('navActiveIdUpdated', handleFixDrawer)
    global.app_event.on('changeLoveListVisible', changeVisible)

    return () => {
      global.state_event.off('navActiveIdUpdated', handleFixDrawer)
      global.app_event.off('changeLoveListVisible', changeVisible)
    }
  }, [])

  const navigationView = () => <MyList />

  return (
    <DrawerLayoutFixed
      ref={drawer}
      visibleNavNames={[COMPONENT_IDS.home]}
      widthPercentage={0.82}
      widthPercentageMax={MAX_WIDTH}
      drawerPosition={settingState.setting['common.drawerLayoutPosition']}
      renderNavigationView={navigationView}
      drawerBackgroundColor={theme['c-content-background']}
      style={{ elevation: 1 }}
    >
      <View style={styles.wrap}>
        <View style={{ ...styles.header, paddingTop: statusBarHeight + scaleSizeH(12), backgroundColor: theme['c-primary'] }}>
          <View style={styles.avatar}>
            <Icon name="logo" size={26} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text size={18} color="#fff" style={styles.headerTitle}>{t('nav_love' as any)}</Text>
            <Text size={11} color="rgba(255,255,255,0.82)">{t('profile_subtitle' as any)}</Text>
          </View>
        </View>
        <MusicList />
      </View>
    </DrawerLayoutFixed>
  )
}

const styles = createStyle({
  wrap: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(18),
    paddingBottom: scaleSizeH(16),
  },
  avatar: {
    width: scaleSizeW(46),
    height: scaleSizeW(46),
    borderRadius: scaleSizeW(23),
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleSizeW(14),
  },
  headerText: { flex: 1 },
  headerTitle: { fontWeight: '700' as const, marginBottom: scaleSizeH(3) },
})
