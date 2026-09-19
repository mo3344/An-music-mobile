import { useEffect, useMemo, useState } from 'react'
import Home from '../Views/Home'
import Discover from '../Views/Discover'
import Mylist from '../Views/Mylist'
import Setting from '../Views/Setting'
import commonState, { type InitState as CommonState } from '@/store/common/state'

const Main = () => {
  const [id, setId] = useState(commonState.navActiveId)

  useEffect(() => {
    const handleUpdate = (id: CommonState['navActiveId']) => { requestAnimationFrame(() => setId(id)) }
    global.state_event.on('navActiveIdUpdated', handleUpdate)
    return () => { global.state_event.off('navActiveIdUpdated', handleUpdate) }
  }, [])

  const component = useMemo(() => {
    switch (id) {
      case 'nav_home':
      case 'nav_search': return <Home />
      case 'nav_discover':
      case 'nav_songlist':
      case 'nav_top': return <Discover />
      case 'nav_love':
      case 'nav_mine': return <Mylist />
      case 'nav_setting': return <Setting />
      default: return <Home />
    }
  }, [id])

  return component
}

export default Main
