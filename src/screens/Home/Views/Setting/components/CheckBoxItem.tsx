import { memo } from 'react'
import { View } from 'react-native'
import CheckBox, { type CheckBoxProps } from '@/components/common/CheckBox'
import { createStyle } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'

export default memo((props: CheckBoxProps) => {
  return (
    <View style={styles.container}>
      <CheckBox {...props} />
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingLeft: scaleSizeW(4),
  },
})
