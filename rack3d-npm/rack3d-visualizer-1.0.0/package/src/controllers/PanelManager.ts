import type { IVisualizer } from '../types/visualizer'

export class PanelManager {
  private viz: IVisualizer

  constructor(viz: IVisualizer) {
    this.viz = viz
  }

  togglePanel(panelId: string): void {
    const self = this.viz
    const panel = document.querySelector(`#${self._id} [data-panel-id="${panelId}"]`)
    if (panel) { panel.classList.toggle('r3-collapsed'); this.savePanelState() }
  }

  savePanelState(): void {
    const self = this.viz
    try {
      const leftSb = document.getElementById(self._id + '-sb')
      const rightSb = document.getElementById(self._id + '-sbr')
      const leftPanels = leftSb ? Array.from(leftSb.querySelectorAll(':scope > .r3-panel')).map((p: Element) => (p as HTMLElement).dataset.panelId).filter(Boolean) : []
      const rightPanels = rightSb ? Array.from(rightSb.querySelectorAll(':scope > .r3-panel')).map((p: Element) => (p as HTMLElement).dataset.panelId).filter(Boolean) : []
      const collapsed: Record<string, boolean> = {}
      document.querySelectorAll(`#${self._id} .r3-panel.r3-collapsed`).forEach((p: Element) => {
        const pd = (p as HTMLElement).dataset.panelId
        if (pd) collapsed[pd] = true
      })
      const state = { left: leftPanels, right: rightPanels, collapsed }
      self._opts.sidebar.panelLayout = state as { left: string[]; right: string[]; collapsed: Record<string, boolean> }
      self._opts.sidebar.leftWidth = leftSb?.clientWidth || self._opts.sidebar.leftWidth
      self._opts.sidebar.rightWidth = rightSb?.clientWidth || self._opts.sidebar.rightWidth
      localStorage.setItem('r3d-panels-' + self._id, JSON.stringify(state))
    } catch { /* localStorage may be unavailable */ }
  }

  restorePanelState(): void {
    const self = this.viz
    let saved: { left?: string[]; right?: string[]; collapsed?: Record<string, boolean> } | null = self._opts.sidebar.panelLayout as typeof saved
    if (!saved) {
      try { saved = JSON.parse(localStorage.getItem('r3d-panels-' + self._id) || 'null') } catch { /* ignore */ }
    }
    if (!saved) return
    const leftSb = document.getElementById(self._id + '-sb')
    const rightSb = document.getElementById(self._id + '-sbr')
    const allPanels = [...(saved.left || []), ...(saved.right || [])]
    allPanels.forEach((panelId: string) => {
      const panel = document.querySelector(`#${self._id} [data-panel-id="${panelId}"]`)
      if (!panel) return
      const inRight = (saved!.right || []).includes(panelId)
      const targetSb = inRight ? rightSb : leftSb
      if (!targetSb) return
      targetSb.appendChild(panel)
    })
    Object.keys(saved.collapsed || {}).forEach((panelId: string) => {
      const panel = document.querySelector(`#${self._id} [data-panel-id="${panelId}"]`)
      if (panel && saved!.collapsed![panelId]) panel.classList.add('r3-collapsed')
    })
  }

  onPanelDragStart(event: DragEvent, panelId: string): void {
    const self = this.viz
    event.dataTransfer!.setData('text/plain', panelId)
    event.dataTransfer!.effectAllowed = 'move'
    const el = document.querySelector(`#${self._id} [data-panel-id="${panelId}"]`)
    if (el) el.classList.add('r3-panel-dragging')
  }

  onPanelDragEnd(): void {
    const self = this.viz
    document.querySelectorAll(`#${self._id} .r3-panel-dragging`).forEach((el: Element) => el.classList.remove('r3-panel-dragging'))
    document.querySelectorAll(`#${self._id} .r3-panel-drop-before`).forEach((el: Element) => el.classList.remove('r3-panel-drop-before'))
  }

  onPanelDragOverPanel(event: DragEvent, panelId: string): void {
    const self = this.viz
    event.preventDefault()
    event.stopPropagation()
    document.querySelectorAll(`#${self._id} .r3-panel-drop-before`).forEach((el: Element) => el.classList.remove('r3-panel-drop-before'))
    const el = document.querySelector(`#${self._id} [data-panel-id="${panelId}"]`)
    if (el) el.classList.add('r3-panel-drop-before')
  }

  onPanelDropPanel(event: DragEvent, targetPanelId: string): void {
    const self = this.viz
    event.preventDefault()
    event.stopPropagation()
    const panelId = event.dataTransfer!.getData('text/plain')
    if (panelId === targetPanelId) return
    const movingPanel = document.querySelector(`#${self._id} [data-panel-id="${panelId}"]`)
    const targetPanel = document.querySelector(`#${self._id} [data-panel-id="${targetPanelId}"]`)
    if (!movingPanel || !targetPanel) return
    targetPanel.parentNode!.insertBefore(movingPanel, targetPanel)
    document.querySelectorAll(`#${self._id} .r3-panel-drop-before`).forEach((el: Element) => el.classList.remove('r3-panel-drop-before'))
    this.savePanelState()
  }

  onPanelDropSidebar(event: DragEvent, sidebar: string): void {
    const self = this.viz
    event.preventDefault()
    const panelId = event.dataTransfer!.getData('text/plain')
    const panel = document.querySelector(`#${self._id} [data-panel-id="${panelId}"]`)
    if (!panel) return
    const targetSb = document.getElementById(sidebar === 'left' ? self._id + '-sb' : self._id + '-sbr')
    if (!targetSb) return
    targetSb.appendChild(panel)
    document.querySelectorAll(`#${self._id} .r3-panel-drop-before`).forEach((el: Element) => el.classList.remove('r3-panel-drop-before'))
    this.savePanelState()
  }

  onPanelResizeStart(e: MouseEvent, panelId: string): void {
    const self = this.viz
    e.preventDefault(); e.stopPropagation()
    const pbEl = document.getElementById(`${self._id}-panel-${panelId}`)
    if (!pbEl) return
    const handle = e.currentTarget as HTMLElement
    handle.classList.add('r3-resizing')
    const startY = e.clientY
    const startH = pbEl.offsetHeight
    const onMove = (ev: MouseEvent) => {
      const h = Math.max(40, Math.min(600, startH + ev.clientY - startY))
      pbEl.style.maxHeight = h + 'px'
    }
    const onUp = () => {
      handle.classList.remove('r3-resizing')
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  toggleSidebarLeft(): void {
    const self = this.viz
    self._opts.sidebar.showLeft = !self._opts.sidebar.showLeft
    const on = self._opts.sidebar.showLeft
    const sb = document.getElementById(self._id + '-sb')
    const handle = document.getElementById(self._id + '-sb-handle')
    const btn = document.getElementById(self._id + '-btnSbL')
    if (sb) sb.style.display = on ? 'flex' : 'none'
    if (handle) handle.style.display = on ? 'flex' : 'none'
    if (btn) btn.className = 'r3-sb-toggle' + (on ? ' on' : '')
    this.savePanelState()
    setTimeout(() => self._onResize?.(), 50)
  }

  toggleSidebarRight(): void {
    const self = this.viz
    self._opts.sidebar.showRight = !self._opts.sidebar.showRight
    const on = self._opts.sidebar.showRight
    const sb = document.getElementById(self._id + '-sbr')
    const handle = document.getElementById(self._id + '-sbr-handle')
    const btn = document.getElementById(self._id + '-btnSbR')
    if (sb) sb.style.display = on ? 'flex' : 'none'
    if (handle) handle.style.display = on ? 'flex' : 'none'
    if (btn) btn.className = 'r3-sb-toggle' + (on ? ' on' : '')
    this.savePanelState()
    setTimeout(() => self._onResize?.(), 50)
  }

  switchTab(tabId: string): void {
    const self = this.viz
    ;['cat', 'um'].forEach((t: string) => {
      const btn = document.getElementById(self._id + '-tab-' + t)
      const body = document.getElementById(self._id + '-tab-body-' + t)
      const on = t === tabId
      if (btn) btn.className = 'r3-tab' + (on ? ' active' : '')
      if (body) body.style.display = on ? '' : 'none'
    })
    const addBtn = document.getElementById(self._id + '-tab-cat-add')
    if (addBtn) addBtn.style.display = tabId === 'cat' ? '' : 'none'
  }

  switchRoomTab(tabId: string): void {
    const self = this.viz
    ;['racks', 'layout', 'walls', 'pillars'].forEach((t: string) => {
      const btn = document.getElementById(self._id + '-rtab-' + t)
      const body = document.getElementById(self._id + '-rtab-body-' + t)
      const on = t === tabId
      if (btn) btn.className = 'r3-tab' + (on ? ' active' : '')
      if (body) body.style.display = on ? '' : 'none'
    })
  }

  switchRackPropTab(tabId: string): void {
    const self = this.viz
    ;['config', 'position', 'nameplate'].forEach((t: string) => {
      const btn = document.getElementById(self._id + '-rpt-' + t)
      const body = document.getElementById(self._id + '-rpt-body-' + t)
      const on = t === tabId
      if (btn) btn.className = 'r3-tab' + (on ? ' active' : '')
      if (body) body.style.display = on ? '' : 'none'
    })
  }

  switchEditDevTab(tabId: string): void {
    const self = this.viz
    ;['properties', 'style', 'network'].forEach((t: string) => {
      const btn = document.getElementById(self._id + '-edt-' + t)
      const body = document.getElementById(self._id + '-edt-body-' + t)
      const on = t === tabId
      if (btn) btn.className = 'r3-tab' + (on ? ' active' : '')
      if (body) body.style.display = on ? '' : 'none'
    })
  }

  switchLightTab(tabId: string): void {
    const self = this.viz
    ;['scene', 'overhead', 'custom'].forEach((t: string) => {
      const btn = document.getElementById(self._id + '-lt-' + t)
      const body = document.getElementById(self._id + '-lt-body-' + t)
      const on = t === tabId
      if (btn) btn.className = 'r3-tab' + (on ? ' active' : '')
      if (body) body.style.display = on ? '' : 'none'
    })
  }

  switchHelpTab(tabId: string): void {
    const self = this.viz
    ;['controls', 'help', 'about'].forEach((t: string) => {
      const btn = document.getElementById(self._id + '-ht-' + t)
      const body = document.getElementById(self._id + '-ht-body-' + t)
      const on = t === tabId
      if (btn) btn.className = 'r3-tab' + (on ? ' active' : '')
      if (body) body.style.display = on ? '' : 'none'
    })
  }
}
