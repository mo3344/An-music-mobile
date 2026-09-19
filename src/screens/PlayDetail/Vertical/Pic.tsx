import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, View, StyleSheet } from 'react-native'
import { createStyle } from '@/utils/tools'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'

const SpectrumBar = ({ delay, color, baseHeight }: { delay: number, color: string, baseHeight: number }) => {
  const value = useRef(new Animated.Value(0.3)).current
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration: 380 + delay * 130, easing: Easing.inOut(Easing.quad), useNativeDriver: true, delay }),
      Animated.timing(value, { toValue: 0.3, duration: 420 + delay * 110, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]))
    anim.start()
    return () => anim.stop()
  }, [value, delay])
  return (
    <Animated.View style={{ width: 4, height: baseHeight, borderRadius: 2, backgroundColor: color, transform: [{ scaleY: value }] }} />
  )
}

export default ({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const styleMode = useSettingValue('player.styleMode')
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)
  useEffect(() => { if (animated) setPic(musicInfo.pic) }, [musicInfo.pic, animated])
  useNavigationComponentDidAppear(componentId, () => { setAnimated(true) })

  const spinValue = useRef(new Animated.Value(0)).current
  const spinRef = useRef<Animated.CompositeAnimation | null>(null)
  useEffect(() => {
    if (styleMode == 'vinyl' && isPlay && animated) {
      spinRef.current?.stop()
      spinRef.current = Animated.loop(Animated.timing(spinValue, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true }))
      spinRef.current.start()
    } else { spinRef.current?.stop(); spinRef.current = null }
    return () => { spinRef.current?.stop(); spinRef.current = null }
  }, [styleMode, isPlay, animated, spinValue])
  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  const glowValue = useRef(new Animated.Value(1)).current
  const glowRef = useRef<Animated.CompositeAnimation | null>(null)
  useEffect(() => {
    if (styleMode == 'dynamic' && isPlay && animated) {
      glowRef.current?.stop()
      glowRef.current = Animated.loop(Animated.sequence([
        Animated.timing(glowValue, { toValue: 1.04, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glowValue, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]))
      glowRef.current.start()
    } else { glowRef.current?.stop(); glowRef.current = null; glowValue.setValue(1) }
    return () => { glowRef.current?.stop(); glowRef.current = null }
  }, [styleMode, isPlay, animated, glowValue])

  const style = useMemo(() => {
    const imgWidth = Math.min(winWidth * 0.8, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.5)
    return { width: imgWidth, height: imgWidth, borderRadius: styleMode == 'vinyl' ? imgWidth / 2 : 8 }
  }, [statusBarHeight, winHeight, winWidth, styleMode])

  const isVinyl = styleMode == 'vinyl'
  const isDynamic = styleMode == 'dynamic'

  return (
    <View style={styles.container}>
      {/* 全屏模糊封面背景 */}
      {pic ? (
        <View style={StyleSheet.absoluteFill}>
          <Image url={pic} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={StyleSheet.absoluteFill} />
        </View>
      ) : null}
      <Animated.View style={{ ...styles.content, elevation: animated ? 3 : 0, transform: [{ scale: isDynamic ? glowValue : 1 }] }}>
        {isDynamic && isPlay && animated ? (
          <View style={{ ...styles.spectrum, position: 'absolute', bottom: -26 }}>
            {[0, 1, 2, 3, 4].map(i => <SpectrumBar key={i} delay={i * 90} color={pic ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.3)'} baseHeight={20} />)}
          </View>
        ) : null}
        <Animated.View style={{ transform: isVinyl ? [{ rotate: spin }] : [{ rotate: '0deg' }], borderRadius: style.borderRadius, overflow: 'hidden' }}>
          <Image url={pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={style} />
          {isVinyl ? <View pointerEvents="none" style={{ ...styles.vinylHole, backgroundColor: 'rgba(0,0,0,0.55)' }} /> : null}
        </Animated.View>
      </Animated.View>
    </View>
  )
}

const styles = createStyle({
  container: { flexGrow: 1, flexShrink: 1, justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: 'rgba(0,0,0,0)', borderRadius: 8, alignItems: 'center' },
  spectrum: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  vinylHole: { position: 'absolute', left: '50%', top: '50%', width: 14, height: 14, marginLeft: -7, marginTop: -7, borderRadius: 7 },
})
