import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'

interface Props {
  title: string
  children: React.ReactNode | React.ReactNode[]
}

export default ({ title, children }: Props) => {
  const theme = useTheme()
  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-main-background'] }}>
      <View style={{ ...styles.header, backgroundColor: theme['c-primary-background-hover'] }}>
        <View style={{ ...styles.indicator, backgroundColor: theme['c-primary'] }} />
        <Text style={styles.title} size={15}>{title}</Text>
      </View>
      <View style={styles.body}>
        {children}
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    borderRadius: scaleSizeW(12),
    marginHorizontal: scaleSizeW(12),
    marginBottom: scaleSizeH(12),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(10),
  },
  indicator: {
    width: scaleSizeW(4),
    height: scaleSizeH(16),
    borderRadius: scaleSizeW(2),
    marginRight: scaleSizeW(10),
  },
  title: {},
  body: {
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(8),
  },
})
