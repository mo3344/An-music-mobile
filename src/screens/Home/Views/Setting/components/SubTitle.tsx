import { memo } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'

export default memo(({ title, children }: {
  title: string
  children: React.ReactNode | React.ReactNode[]
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title} size={13}>{title}</Text>
      {children}
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingLeft: scaleSizeW(4),
    marginBottom: scaleSizeH(14),
  },
  title: {
    marginLeft: scaleSizeW(-4),
    marginBottom: scaleSizeH(8),
  },
})
