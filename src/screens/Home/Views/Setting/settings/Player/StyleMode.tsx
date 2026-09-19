import { memo, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'

type StyleMode = LX.AppSetting['player.styleMode']

const MODES: Array<{ id: StyleMode, name: string, desc: string }> = [
  { id: 'dynamic', name: '动态频谱', desc: '封面呼吸光效+跳动频谱' },
  { id: 'vinyl', name: '黑胶唱片', desc: '圆形封面旋转播放' },
  { id: 'classic', name: '经典', desc: '静态封面·省电' },
]

const Item = ({ id, name, desc }: { id: StyleMode, name: string, desc: string }) => {
  const mode = useSettingValue('player.styleMode')
  const isActive = useMemo(() => mode == id, [mode, id])
  return (
    <View style={styles.item}>
      <CheckBox check={isActive} label={name} onChange={() => { updateSetting({ 'player.styleMode': id }) }} need />
      <Text style={styles.desc} size={9}>{desc}</Text>
    </View>
  )
}

export default memo(() => {
  return (
    <SubTitle title="播放器风格（动态效果）">
      <View style={styles.list}>
        {
          MODES.map(m => <Item {...m} key={m.id} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  desc: {
    marginLeft: 6,
  },
})
