import { memo, useRef } from 'react'
import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import DownloadQualityModal, { type DownloadQualityModalType } from '@/components/DownloadQualityModal'
import { BTN_WIDTH } from '../Btn'

export default memo(() => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const modalRef = useRef<DownloadQualityModalType>(null)
  const handlePress = () => {
    if (musicInfo.source != 'local' && musicInfo.id) {
      (modalRef.current as any)?.show?.(musicInfo as any)
    }
  }
  return (
    <>
      <TouchableOpacity style={{ width: BTN_WIDTH, height: BTN_WIDTH, justifyContent: 'center', alignItems: 'center' }} activeOpacity={0.5} onPress={handlePress}>
        <Icon name='download-2' color={theme['c-button-font']} rawSize={BTN_WIDTH * 0.6} />
      </TouchableOpacity>
      <DownloadQualityModal ref={modalRef as any} />
    </>
  )
})
