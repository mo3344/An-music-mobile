import { forwardRef, memo, useImperativeHandle, useRef, useState, useCallback } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import Button from '@/components/common/Button'
import { createStyle } from '@/utils/tools'
import Modal, { type ModalType } from '@/components/common/Modal'
import { useTheme } from '@/store/theme/hook'
import { BorderRadius, BorderWidths } from '@/theme'
import { getTasks, cancelDownload, retryDownload, clearDoneTasks, getDoneTasks, type DownloadTaskInfo } from '@/core/music/downloadTask'

export interface DownloadManagerModalType {
  show: () => void
}

const StatusText = ({ task, theme }: { task: DownloadTaskInfo, theme: string }) => {
  switch (task.status) {
    case 'running':
      return <Text size={10} color={theme}>下载中 {task.progress}%</Text>
    case 'waiting':
      return <Text size={10} color={theme}>排队中</Text>
    case 'error':
      return <Text size={10} color="#e7543d">{task.message ?? '下载失败'}</Text>
    case 'done':
      return <Text size={10} color={theme}>{task.message ?? '已完成'}</Text>
    default:
      return null
  }
}

const TaskItem = ({ task, theme, onUpdate }: { task: DownloadTaskInfo, theme: Record<string, string>, onUpdate: () => void }) => {
  return (
    <View style={styles.taskItem}>
      <View style={styles.taskInfo}>
        <Text numberOfLines={1} style={styles.taskName} color={theme['c-font']}>{task.musicInfo.name}</Text>
        <Text numberOfLines={1} size={10} color={theme['c-font-label']} style={{ marginTop: 2 }}>
          {task.musicInfo.singer} · {String(task.quality).toUpperCase()}
        </Text>
        {task.status == 'running' && (
          <View style={{ ...styles.progressBg, backgroundColor: theme['c-primary-background-hover'] }}>
            <View style={{ ...styles.progressFill, backgroundColor: theme['c-primary'], width: `${task.progress}%` as any }} />
          </View>
        )}
        <View style={{ marginTop: 2 }}>
          <StatusText task={task} theme={theme['c-font-label']} />
        </View>
      </View>
      <View style={styles.taskActions}>
        {
          (task.status == 'running' || task.status == 'waiting')
            ? <Button style={styles.taskBtn} onPress={() => { cancelDownload(task.id); onUpdate() }}><Text size={11} color={theme['c-font']}>取消</Text></Button>
            : null
        }
        {
          task.status == 'error'
            ? <Button style={styles.taskBtn} onPress={() => { retryDownload(task.id); onUpdate() }}><Text size={11} color={theme['c-primary-font-active']}>重试</Text></Button>
            : null
        }
      </View>
    </View>
  )
}

export default memo(forwardRef<DownloadManagerModalType, {}>((props, ref) => {
  const modalRef = useRef<ModalType>(null)
  const theme = useTheme()
  const [tasks, setTasks] = useState<DownloadTaskInfo[]>([])
  const [doneList, setDoneList] = useState<DownloadTaskInfo[]>([])

  const refresh = useCallback(() => {
    setTasks([...getTasks()])
    void getDoneTasks().then(list => setDoneList(list.filter(d => !getTasks().some(t => t.id == d.id))))
  }, [])

  useImperativeHandle(ref, () => ({
    show() {
      refresh()
      requestAnimationFrame(() => modalRef.current?.setVisible(true))
    },
  }))

  const running = tasks.filter(t => t.status == 'running' || t.status == 'waiting' || t.status == 'error')
  const done = [...doneList, ...tasks.filter(t => t.status == 'done')]

  return (
    <Modal ref={modalRef} onShow={refresh}>
      <View style={{ ...styles.container, backgroundColor: theme['c-primary-background'] }}>
        <View style={styles.header}>
          <Text style={styles.title} color={theme['c-font']}>下载管理</Text>
          {
            done.length > 0 && (
              <Button onPress={() => { clearDoneTasks(); refresh() }}>
                <Text size={11} color={theme['c-primary-font-active']}>清空记录</Text>
              </Button>
            )
          }
        </View>
        <ScrollView style={styles.list} stickyHeaderIndices={[0]}>
          <View style={{ ...styles.groupHeader, backgroundColor: theme['c-primary-background'] }}>
            <Text size={11} color={theme['c-font-label']}>进行中 / 队列 {running.length > 0 ? `(${running.length})` : ''}</Text>
          </View>
          {
            running.length == 0 && <Text size={11} color={theme['c-font-label']} style={styles.empty}>暂无进行中的下载任务</Text>
          }
          {
            running.map(task => <TaskItem key={task.id} task={task} theme={theme} onUpdate={refresh} />)
          }
          <View style={{ ...styles.groupHeader, backgroundColor: theme['c-primary-background'] }}>
            <Text size={11} color={theme['c-font-label']}>已完成 {done.length > 0 ? `(${done.length})` : ''}</Text>
          </View>
          {
            done.length == 0 && <Text size={11} color={theme['c-font-label']} style={styles.empty}>还没有已下载的歌曲</Text>
          }
          {
            done.map(task => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskInfo}>
                  <Text numberOfLines={1} style={styles.taskName} color={theme['c-font']}>{task.fileName || task.musicInfo.name}</Text>
                  <Text numberOfLines={1} size={10} color={theme['c-font-label']} style={{ marginTop: 2 }}>
                    {task.message ?? ''} · 已保存到 Music/AnMusic
                  </Text>
                </View>
              </View>
            ))
          }
        </ScrollView>
        <Text size={10} color={theme['c-font-label']} style={styles.tip}>长按歌曲菜单中的「下载」可选音质下载</Text>
      </View>
    </Modal>
  )
}))

const styles = createStyle({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  groupHeader: {
    paddingTop: 12,
    paddingBottom: 6,
  },
  empty: {
    paddingVertical: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: BorderWidths.normal,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  taskInfo: {
    flex: 1,
    marginRight: 8,
  },
  taskName: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBg: {
    height: 3,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  taskActions: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  taskBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.normal,
  },
  tip: {
    textAlign: 'center',
    paddingVertical: 10,
  },
})
